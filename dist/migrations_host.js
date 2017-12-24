"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.CONFIG_FILENAME = void 0;

var _asyncFile = _interopRequireDefault(require("async-file"));

var _path = _interopRequireDefault(require("path"));

var _lodash = _interopRequireDefault(require("lodash.map"));

var _lodash2 = _interopRequireDefault(require("lodash.foreach"));

var _lodash3 = _interopRequireDefault(require("lodash.isfunction"));

var _lodash4 = _interopRequireDefault(require("lodash.merge"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const CONFIG_FILENAME = "migrations.config.js";
/**
 * Represents a host application using the pg-migrations library.
 */

exports.CONFIG_FILENAME = CONFIG_FILENAME;

class MigrationsHost {
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
          if (yield _asyncFile.default.exists(_path.default.join(_this.rootPath, CONFIG_FILENAME), _asyncFile.default.constants.R_OK)) {
            break;
          }

          _this.rootPath = _path.default.dirname(_this.rootPath);

          if (_this.rootPath == "/") {
            throw new Error(`Cannot find ${CONFIG_FILENAME}`);
          }
        }

        const loadedConfig = require(_path.default.join(_this.rootPath, CONFIG_FILENAME)).default;

        _this._config = (0, _lodash4.default)({
          configPath: _path.default.join(_this.rootPath, CONFIG_FILENAME),
          migrationsTableName: "migrations",
          migrationsRelPath: "./migrations"
        }, loadedConfig);
        _this._config.migrationsPath = _path.default.join(_this.rootPath, _this._config.migrationsRelPath);
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

        if (!(0, _lodash3.default)(config.getConnection)) {
          throw new Error(`${config.configPath} does not define a getConnection method`);
        }

        _this2._conn = yield config.getConnection();
        yield _this2._conn.connect();
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
        const files = yield _asyncFile.default.readdir(config.migrationsPath);
        _this3._localMigrationsMap = new Map();
        (0, _lodash2.default)(files, filename => {
          const keySearch = filename.match(/([0-9]{12,14})/);

          if (keySearch) {
            const key = keySearch[1];

            _this3._localMigrationsMap.set(key, {
              key,
              filename,
              path: _path.default.join(config.migrationsPath, filename)
            });
          }
        });
      }

      return _this3._localMigrationsMap;
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
    var _this4 = this;

    return _asyncToGenerator(function* () {
      if (!_this4._migrationStatusMap || refresh) {
        const localMigrationsMap = yield _this4.localMigrationsMap();
        _this4._migrationStatusMap = new Map();

        for (let [key, migration] of localMigrationsMap) {
          _this4._migrationStatusMap.set(key, {
            local: migration
          });
        }

        const config = yield _this4.config();
        const conn = yield _this4.conn({
          bootstrap: true
        });
        const statuses = (yield conn.query(`select "key", "filename", "migrated_at" from "${config.migrationsTableName}" order by "migrated_at"`)).rows;
        (0, _lodash2.default)(statuses, status => {
          _this4._migrationStatusMap.set(status.key, {
            applied: status,
            local: localMigrationsMap.get(status.key)
          });
        });
      }

      return _this4._migrationStatusMap;
    })();
  }
  /**
   * Sets a migration status.
   * @param {{ key: string, filename: string, path: string }} migration
   * @param {string} status - Must be either 'up' or 'down'.
   */


  setMigrationStatus(migration, status) {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      if (status != 'up' && status != 'down') {
        throw new Error(`Unhandled status, must be 'up' or 'down' but was: '${status}'`);
      }

      const config = yield _this5.config();
      const conn = yield _this5.conn({
        bootstrap: true
      });
      const migrationStatusMap = yield _this5.migrationStatusMap();

      if (status == 'up' && !migrationStatusMap.get(migration.key).applied) {
        yield conn.query(`insert into "${config.migrationsTableName}" (key, filename) values ($1, $2)`, [migration.key, _path.default.basename(migration.path, ".js")]);
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
    var _this6 = this;

    return _asyncToGenerator(function* () {
      if (_this6._withMigrationLock) {
        return yield fn();
      } else {
        const config = yield _this6.config();
        const conn = yield _this6.conn({
          bootstrap: true
        });
        _this6._withMigrationLock = true;
        yield conn.query(`select pg_advisory_lock(1) from "${config.migrationsTableName}"`);

        try {
          return yield fn();
        } finally {
          yield conn.query(`select pg_advisory_unlock(1) from "${config.migrationsTableName}"`);
          _this6._withMigrationLock = false;
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
    var _this7 = this;

    return _asyncToGenerator(function* () {
      if (_this7._withTransaction) {
        return yield fn();
      } else {
        const config = yield _this7.config();
        const conn = yield _this7.conn();
        _this7._withTransaction = true;
        yield conn.query(`begin`);

        try {
          let result = yield fn();
          yield conn.query("commit");
          return result;
        } catch (exception) {
          yield conn.query("rollback");
          throw exception;
        } finally {
          _this7._withTransaction = false;
        }
      }
    })();
  }

}

exports.default = MigrationsHost;
//# sourceMappingURL=migrations_host.js.map