"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = doRun;

var _lodash = _interopRequireDefault(require("lodash.sortby"));

var _lodash2 = _interopRequireDefault(require("lodash.filter"));

var _lodash3 = _interopRequireDefault(require("lodash.isfunction"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

function doRun(_x, _x2, _x3, _x4) {
  return _doRun.apply(this, arguments);
}

function _doRun() {
  _doRun = _asyncToGenerator(function* (host, migration, direction, args) {
    if (direction != "up" && direction != "down") {
      throw new Error(`Unhandled migration direction, must be 'up' or 'down' but was: '${direction}'`);
    }

    yield host.withMigrationLock(
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      const migrationStatusMap = yield host.migrationStatusMap({
        refresh: true
      }); // Determine which migrations to run

      let migrations;

      if (migration) {
        if (args.force || direction == 'up' && !migrationStatusMap.get(migration.key).applied || direction == 'down' && migrationStatusMap.get(migration.key).applied) {
          migrations = [migration];
        } else {
          migrations = [];
        }
      } else if (direction == 'up') {
        migrations = [];
        const sortedUnappliedKeys = (0, _lodash2.default)(Array.from(migrationStatusMap.keys()), key => {
          return !migrationStatusMap.get(key).applied && migrationStatusMap.get(key).local;
        }).sort();

        for (let key of sortedUnappliedKeys) {
          migrations.push(migrationStatusMap.get(key).local);
        }
      } else if (direction == 'down') {
        const appliedKeys = (0, _lodash2.default)(Array.from(migrationStatusMap.keys()), key => {
          return migrationStatusMap.get(key).applied && migrationStatusMap.get(key).local;
        });
        const sortedKeys = (0, _lodash.default)(appliedKeys, key => {
          return migrationStatusMap.get(key).applied.migrated_at;
        });
        const targetKey = sortedKeys[sortedKeys.length - 1];

        if (targetKey) {
          migrations = [migrationStatusMap.get(targetKey).local];
        } else {
          migrations = [];
        }
      } else {
        throw new Error(`Unexpected`);
      }

      if (args.dryrun) {
        console.log(`Dry run, would run '${direction}' on these migrations in order: (x${migrations.length})`);

        for (let migration of migrations) {
          console.log(`${migration.key} ${migration.path}`);
        }

        return;
      } // Actually run the migrations


      const conn = yield host.conn();

      for (let migration of migrations) {
        const module = require(migration.path).default;

        if ((0, _lodash3.default)(module[direction])) {
          console.log(`.... ${direction} ${migration.key} ${migration.path}`);
          yield host.withTransaction(
          /*#__PURE__*/
          _asyncToGenerator(function* () {
            yield module[direction].bind(module, conn)();
            yield host.setMigrationStatus(migration, direction);
            console.log(`OKAY ${direction} ${migration.key} ${migration.path}`);
          }));
        } else {
          yield host.withTransaction(
          /*#__PURE__*/
          _asyncToGenerator(function* () {
            yield host.setMigrationStatus(migration, direction);
            console.log(`SKIP ${direction} ${migration.key} ${migration.path} (no such direction ${direction})`);
          }));
        }
      }

      console.log(`Complete!`);
    }));
  });
  return _doRun.apply(this, arguments);
}
//# sourceMappingURL=do_run.js.map