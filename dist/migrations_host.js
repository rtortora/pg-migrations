"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const FS = require('async-file');

const Path = require('path');

const CONFIG_FILENAME = "migrations.config.js";
/**
 * Represents a host application using the pg-migrations library.
 */

module.exports = class MigrationsHost {
  constructor(rootPath = null) {
    this.rootPath = rootPath || process.cwd();
  }
  /**
   * Gets the migrations configuration of the client application, which includes the name of the migrations table, the relative path of where migration files are kept, and a method to get a connection to the database.
   * @return {Promise<{ configPath: string, migrationsTableName: string, migrationsPath: string, migrationsRelPath: string, getConnection: function }>}
   */


  config() {
    var _this = this;

    return _asyncToGenerator(function* () {
      if (!_this._config) {
        while (true) {
          if (yield FS.exists(Path.join(_this.rootPath, CONFIG_FILENAME), FS.constants.R_OK)) {
            break;
          }

          _this.rootPath = Path.dirname(_this.rootPath);

          if (_this.rootPath == "/") {
            throw new Error(`Cannot find ${CONFIG_FILENAME}`);
          }
        }

        let loadedConfig = require(Path.join(_this.rootPath, CONFIG_FILENAME));

        if (loadedConfig.default) {
          loadedConfig = loadedConfig.default;
        }

        _this._config = Object.assign({
          configPath: Path.join(_this.rootPath, CONFIG_FILENAME),
          migrationsTableName: "migrations",
          migrationsRelPath: "./migrations"
        }, loadedConfig);
        _this._config.migrationsPath = Path.join(_this.rootPath, _this._config.migrationsRelPath);
      }

      return _this._config;
    })();
  }
  /**
   * Gets a connection to the database, can optionally bootstrap the migrations table.
   * @param {{ bootstrap: boolean }} opt - If bootstrap is true, will ensure the migrations table exists. Default value is false.
   * @return {Promise<pg.Client>}
   */


  conn({
    bootstrap = false
  } = {}) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      if (!_this2._conn) {
        const config = yield _this2.config();

        if (typeof config.getConnection !== 'function') {
          throw new Error(`${config.configPath} does not define a getConnection method, is '${typeof config.getConnection}'`);
        }

        _this2._conn = yield config.getConnection();

        if (!_this2._conn._connecting && !_this2._conn._connected) {
          yield _this2._conn.connect();
        }
      }

      if (bootstrap && !_this2._bootstrapped) {
        const config = yield _this2.config();
        yield _this2._conn.query(`
        create table if not exists "${config.migrationsTableName}" (
          "key" varchar(14) primary key not null,
          "filename" varchar(255) not null,
          "migrated_at" timestamp with time zone not null default timezone('utc'::text, now())
        );
      `);
        _this2._bootstrapped = true;
      }

      return _this2._conn;
    })();
  }
  /**
   * Gets a map of migration keys to the information about the migration on disk, like the filename and path.
   * @param {{ refresh: boolean }} opt - If refresh is true, will freshly fetch the local migrations map, otherwise will use the values from the last call (if any). Default value is false.
   * @return {Promise<Map<string:{ key: string, filename: string, path: string }>>}
   */


  localMigrationsMap({
    refresh = false
  } = {}) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      if (!_this3._localMigrationsMap || refresh) {
        const config = yield _this3.config();
        _this3._localMigrationsMap = new Map();
        yield _this3._scanFolderIntoLocalMigrationsMap(config, config.migrationsPath, {
          checkSubfolders: true
        });
      }

      return _this3._localMigrationsMap;
    })();
  }

  _scanFolderIntoLocalMigrationsMap(config, path, {
    checkSubfolders = true
  } = {}) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      for (let filename of yield FS.readdir(path)) {
        if ((yield FS.stat(Path.join(path, filename))).isDirectory()) {
          yield _this4._scanFolderIntoLocalMigrationsMap(config, Path.join(path, filename), {
            checkSubfolders: true
          });
        } else {
          const keySearch = filename.match(/(^[0-9]{12,14})/);

          if (keySearch) {
            const key = keySearch[1];

            _this4._localMigrationsMap.set(key, {
              key,
              filename,
              path: Path.join(config.migrationsPath, filename)
            });
          } else {
            const tidySearch = filename.match(/^[0-9]{4}-[0-9]{2}$/i);

            if (tidySearch) {
              console.log(`GOT HERE!!! ${tidySearch}`);
            }
          }
        }
      }
    })();
  }
  /**
   * Gets a map of migration status, including both applied and local migrations on disk independent of status.
   * @param {{ refresh: boolean }} opt - If refresh is true, will freshly fetch the migration status map, otherwise will use the values from the last call (if any). Default value is false.
   * @return {Promise<Map<string:{ applied: { key: string, filename: string, migrated_at: string }, local: { key: string, filename: string, path: string } }>>}
   */


  migrationStatusMap({
    refresh = false
  } = {}) {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      if (!_this5._migrationStatusMap || refresh) {
        const localMigrationsMap = yield _this5.localMigrationsMap();
        _this5._migrationStatusMap = new Map();

        for (let [key, migration] of localMigrationsMap) {
          _this5._migrationStatusMap.set(key, {
            local: migration
          });
        }

        const config = yield _this5.config();
        const conn = yield _this5.conn({
          bootstrap: true
        });
        const statuses = (yield conn.query(`select "key", "filename", "migrated_at" from "${config.migrationsTableName}" order by "migrated_at"`)).rows;

        for (let status of statuses) {
          _this5._migrationStatusMap.set(status.key, {
            applied: status,
            local: localMigrationsMap.get(status.key)
          });
        }

        ;
      }

      return _this5._migrationStatusMap;
    })();
  }
  /**
   * Sets a migration status.
   * @param {{ key: string, filename: string, path: string }} migration
   * @param {string} status - Must be either 'up' or 'down'.
   */


  setMigrationStatus(migration, status) {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      if (status != 'up' && status != 'down') {
        throw new Error(`Unhandled status, must be 'up' or 'down' but was: '${status}'`);
      }

      const config = yield _this6.config();
      const conn = yield _this6.conn({
        bootstrap: true
      });
      const migrationStatusMap = yield _this6.migrationStatusMap();

      if (status == 'up' && !migrationStatusMap.get(migration.key).applied) {
        yield conn.query(`insert into "${config.migrationsTableName}" (key, filename) values ($1, $2)`, [migration.key, Path.basename(migration.path, ".js")]);
      } else if (status == 'down' && migrationStatusMap.get(migration.key).applied) {
        yield conn.query(`delete from "${config.migrationsTableName}" where key = $1`, [migration.key]);
      }
    })();
  }
  /**
   * Acquires a global migration lock, so multiple agents trying to run migrations at the same time wont apply them multiple times.
   * @param {function} fn - Asynchronoush function is called while the migration lock is held. When the provided function ends, the migration lock is released.
   * @return {Promise}
   */


  withMigrationLock(fn) {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      if (_this7._withMigrationLock) {
        return yield fn();
      } else {
        const config = yield _this7.config();
        const conn = yield _this7.conn({
          bootstrap: true
        });
        _this7._withMigrationLock = true;
        yield conn.query(`select pg_advisory_lock(1) from "${config.migrationsTableName}"`);

        try {
          return yield fn();
        } finally {
          yield conn.query(`select pg_advisory_unlock(1) from "${config.migrationsTableName}"`);
          _this7._withMigrationLock = false;
        }
      }
    })();
  }
  /**
   * Starts a transaction for the duration of the provided asynchronous function. If any exceptions are thrown, the transaction is rolled back, otherwise, it is committed.
   * @param {function} fn - Asynchronoush function is called while the migration is open.
   * @return {Promise}
   */


  withTransaction(fn) {
    var _this8 = this;

    return _asyncToGenerator(function* () {
      if (_this8._withTransaction) {
        return yield fn();
      } else {
        const config = yield _this8.config();
        const conn = yield _this8.conn();
        _this8._withTransaction = true;
        yield conn.query(`begin`);

        try {
          let result = yield fn();
          yield conn.query("commit");
          return result;
        } catch (exception) {
          yield conn.query("rollback");
          throw exception;
        } finally {
          _this8._withTransaction = false;
        }
      }
    })();
  }

};
module.exports.CONFIG_FILENAME = CONFIG_FILENAME;
//# sourceMappingURL=migrations_host.js.map