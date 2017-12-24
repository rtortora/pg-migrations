import FS from 'async-file';
import Path from 'path';
import map from 'lodash.map';
import forEach from 'lodash.foreach';
import isFunction from 'lodash.isfunction';
import merge from 'lodash.merge';

export const CONFIG_FILENAME = "migrations.config.js";

/**
 * Represents a host application using the pg-migrations library.
 */
export default class MigrationsHost {
  constructor(rootPath = null) {
    this.rootPath = rootPath || process.cwd();
  }

  /**
   * Gets the migrations configuration of the client application, which includes the name of the migrations table, the relative path of where migration files are kept, and a method to get a connection to the database.
   * @return {Promise<{ configPath: string, migrationsTableName: string, migrationsPath: string, migrationsRelPath: string, getConnection: function }>}
   */
  async config() {
    if (!this._config) {
      while (true) {
        if (await FS.exists(Path.join(this.rootPath, CONFIG_FILENAME), FS.constants.R_OK)) {
          break;
        }
        this.rootPath = Path.dirname(this.rootPath);
        if (this.rootPath == "/") {
          throw new Error(`Cannot find ${CONFIG_FILENAME}`);
        }
      }
      const loadedConfig = require(Path.join(this.rootPath, CONFIG_FILENAME)).default;
      this._config = merge({
        configPath: Path.join(this.rootPath, CONFIG_FILENAME),
        migrationsTableName: "migrations",
        migrationsRelPath: "./migrations",
      }, loadedConfig);
      this._config.migrationsPath = Path.join(this.rootPath, this._config.migrationsRelPath);
    }
    return this._config;
  }

  /**
   * Gets a connection to the database, can optionally bootstrap the migrations table.
   * @param {{ bootstrap: boolean }} opt - If bootstrap is true, will ensure the migrations table exists. Default value is false.
   * @return {Promise<pg.Client>}
   */
  async conn({ bootstrap = false } = {}) {
    if (!this._conn) {
      const config = await this.config();
      if (!isFunction(config.getConnection)) {
        throw new Error(`${config.configPath} does not define a getConnection method`);
      }
      this._conn = await config.getConnection();
      await this._conn.connect();
    }
    if (bootstrap && !this._bootstrapped) {
      const config = await this.config();
      await this._conn.query(`
        create table if not exists "${config.migrationsTableName}" (
          "key" varchar(14) primary key not null,
          "filename" varchar(255) not null,
          "migrated_at" timestamp with time zone not null default timezone('utc'::text, now())
        );
      `);
      this._bootstrapped = true;
    }
    return this._conn;
  }

  /**
   * Gets a map of migration keys to the information about the migration on disk, like the filename and path.
   * @param {{ refresh: boolean }} opt - If refresh is true, will freshly fetch the local migrations map, otherwise will use the values from the last call (if any). Default value is false.
   * @return {Promise<Map<string:{ key: string, filename: string, path: string }>>}
   */
  async localMigrationsMap({ refresh = false } = {}) {
    if (!this._localMigrationsMap || refresh) {
      const config = await this.config();
      const files = await FS.readdir(config.migrationsPath);
      this._localMigrationsMap = new Map();
      forEach(files, (filename)=>{
        const keySearch = filename.match(/([0-9]{12,14})/);
        if (keySearch) {
          const key = keySearch[1];
          this._localMigrationsMap.set(key, {
            key,
            filename,
            path: Path.join(config.migrationsPath, filename),
          });
        }
      });
    }
    return this._localMigrationsMap;
  }

  /**
   * Gets a map of migration status, including both applied and local migrations on disk independent of status.
   * @param {{ refresh: boolean }} opt - If refresh is true, will freshly fetch the migration status map, otherwise will use the values from the last call (if any). Default value is false.
   * @return {Promise<Map<string:{ applied: { key: string, filename: string, migrated_at: string }, local: { key: string, filename: string, path: string } }>>}
   */
  async migrationStatusMap({ refresh = false } = {}) {
    if (!this._migrationStatusMap || refresh) {
      const localMigrationsMap = await this.localMigrationsMap();
      this._migrationStatusMap = new Map();
      for(let [key, migration] of localMigrationsMap) {
        this._migrationStatusMap.set(key, { local: migration });
      }

      const config = await this.config();
      const conn = await this.conn({ bootstrap: true });
      const statuses = (await conn.query(`select "key", "filename", "migrated_at" from "${config.migrationsTableName}" order by "migrated_at"`)).rows;
      forEach(statuses, (status)=>{
        this._migrationStatusMap.set(status.key, {
          applied: status,
          local: localMigrationsMap.get(status.key),
        });
      });
    }
    return this._migrationStatusMap;
  }

  /**
   * Sets a migration status.
   * @param {{ key: string, filename: string, path: string }} migration
   * @param {string} status - Must be either 'up' or 'down'.
   */
  async setMigrationStatus(migration, status) {
    if (status != 'up' && status != 'down') {
      throw new Error(`Unhandled status, must be 'up' or 'down' but was: '${status}'`);
    }
    const config = await this.config();
    const conn = await this.conn({ bootstrap: true });
    const migrationStatusMap = await this.migrationStatusMap();
    if (status == 'up' && !migrationStatusMap.get(migration.key).applied) {
      await conn.query(`insert into "${config.migrationsTableName}" (key, filename) values ($1, $2)`, [
        migration.key,
        Path.basename(migration.path, ".js"),
      ]);
    } else if (status == 'down' && migrationStatusMap.get(migration.key).applied) {
      await conn.query(`delete from "${config.migrationsTableName}" where key = $1`, [
        migration.key,
      ]);
    }
  }

  /**
   * Acquires a global migration lock, so multiple agents trying to run migrations at the same time wont apply them multiple times.
   * @param {function} fn - Asynchronoush function is called while the migration lock is held. When the provided function ends, the migration lock is released.
   * @return {Promise}
   */
  async withMigrationLock(fn) {
    if (this._withMigrationLock) {
      return await fn();
    } else {
      const config = await this.config();
      const conn = await this.conn({ bootstrap: true });
      this._withMigrationLock = true;
      await conn.query(`select pg_advisory_lock(1) from "${config.migrationsTableName}"`);
      try {
        return await fn();
      } finally {
        await conn.query(`select pg_advisory_unlock(1) from "${config.migrationsTableName}"`);
        this._withMigrationLock = false;
      }
    }
  }

  /**
   * Starts a transaction for the duration of the provided asynchronous function. If any exceptions are thrown, the transaction is rolled back, otherwise, it is committed.
   * @param {function} fn - Asynchronoush function is called while the migration is open.
   * @return {Promise}
   */
  async withTransaction(fn) {
    if (this._withTransaction) {
      return await fn();
    } else {
      const config = await this.config();
      const conn = await this.conn();
      this._withTransaction = true;
      await conn.query(`begin`);
      try {
        let result = await fn();
        await conn.query("commit");
        return result;
      } catch(exception) {
        await conn.query("rollback");
        throw exception;
      } finally {
        this._withTransaction = false;
      }
    }
  }
}