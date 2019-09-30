"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const sortBy = require('lodash.sortby');

module.exports =
/*#__PURE__*/
function () {
  var _doRun = _asyncToGenerator(function* (host, migration, direction, args) {
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
        const sortedUnappliedKeys = Array.from(migrationStatusMap.keys()).filter(key => {
          return !migrationStatusMap.get(key).applied && migrationStatusMap.get(key).local;
        }).sort();

        for (let key of sortedUnappliedKeys) {
          migrations.push(migrationStatusMap.get(key).local);
        }
      } else if (direction == 'down') {
        const appliedKeys = Array.from(migrationStatusMap.keys()).filter(key => {
          return migrationStatusMap.get(key).applied && migrationStatusMap.get(key).local;
        });
        const sortedKeys = sortBy(appliedKeys, key => {
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
        let module = require(migration.path);

        if (module.default) {
          module = module.default;
        }

        if (typeof module[direction] === 'function') {
          console.log(`.... ${direction} ${migration.key} ${migration.path}`);

          try {
            const execute =
            /*#__PURE__*/
            function () {
              var _ref2 = _asyncToGenerator(function* () {
                yield module[direction].bind(module, conn)();
                yield host.setMigrationStatus(migration, direction);
                console.log(`OKAY ${direction} ${migration.key} ${migration.path}`);
              });

              return function execute() {
                return _ref2.apply(this, arguments);
              };
            }();

            if (module.disableTransaction) {
              yield execute();
            } else {
              yield host.withTransaction(execute);
            }
          } catch (exception) {
            console.log(`FAIL ${direction} ${migration.key} ${migration.path}`);
            console.log(exception);
            process.exit(1);
          }
        } else {
          yield host.withTransaction(
          /*#__PURE__*/
          _asyncToGenerator(function* () {
            yield host.setMigrationStatus(migration, direction);
            throw new Error(`${direction} ${migration.key} ${migration.path} (no such function ${direction})`);
          }));
        }
      }

      console.log(`Complete!`);
    }));
  });

  function doRun(_x, _x2, _x3, _x4) {
    return _doRun.apply(this, arguments);
  }

  return doRun;
}();
//# sourceMappingURL=do_run.js.map