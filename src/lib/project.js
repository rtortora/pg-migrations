import FS from 'async-file';
import Path from 'path';
import map from 'lodash.map';
import forEach from 'lodash.foreach';
import isFunction from 'lodash.isfunction';
import merge from 'lodash.merge';
import filenameToKey from './filename_to_key';

const CONFIG_FILENAME = "migrations.config.js";

export default class Project {
  constructor(rootPath = null) {
    this.rootPath = rootPath || process.cwd();
  }

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

  async getConnection({ bootstrap = false } = {}) {
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

  async localMigrationsMap() {
    if (!this._localMigrationsMap) {
      const config = await this.config();
      const files = await FS.readdir(config.migrationsPath);
      this._localMigrationsMap = new Map();
      forEach(files, (filename)=>{
        const key = filenameToKey(filename);
        this._localMigrationsMap.set(key, {
          key,
          filename,
          path: Path.join(config.migrationsPath, filename),
        });
      });
    }
    return this._localMigrationsMap;
  }

  async migrationStatusMap() {
    if (!this._migrationStatusMap) {
      const localMigrationsMap = await this.localMigrationsMap();
      this._migrationStatusMap = new Map();
      for(let [key, migration] of localMigrationsMap) {
        this._migrationStatusMap.set(key, { local: migration });
      }

      const config = await this.config();
      const conn = await this.getConnection({ bootstrap: true });
      const status = (await conn.query(`select "key", "filename", "migrated_at" from "${config.migrationsTableName}" order by "migrated_at"`)).rows;
      forEach(status, (status)=>{
        this._migrationStatusMap.set(status.key, {
          applied: status,
          local: localMigrationsMap.get(key),
        });
      });
    }
    return this._migrationStatusMap;
  }

  async withMigrationLock(fn) {
    if (this._withMigrationLock) {
      await fn();
    } else {
      const config = await this.config();
      const conn = await this.getConnection();
      this._withMigrationLock = true;
      await conn.query(`select pg_advisory_lock(1) from "${config.migrationsTableName}"`);
      try {
        await fn();
      } finally {
        await conn.query(`select pg_advisory_unlock(1) from "${config.migrationsTableName}"`);
        this._withMigrationLock = false;
      }
    }
  }
}