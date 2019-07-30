"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const Table = require('cli-table');

const sortBy = require('lodash.sortby');

module.exports =
/*#__PURE__*/
function () {
  var _doStatus = _asyncToGenerator(function* (host, args) {
    const migrationStatusMap = yield host.migrationStatusMap();
    const sortedKeys = sortBy(Array.from(migrationStatusMap.keys()), [key => {
      return migrationStatusMap.get(key).applied ? 0 : 1;
    }, key => {
      return migrationStatusMap.get(key).applied ? migrationStatusMap.get(key).applied.migrated_at : key;
    }]);
    const table = new Table({
      head: ["Key", "Status", "Path"]
    });

    for (let key of sortedKeys) {
      const status = migrationStatusMap.get(key);
      table.push([key, status.applied ? `up at ${status.applied.migrated_at}` : `down`, status.local ? status.local.filename : `*** NO FILE ***`]);
    }

    console.log(table.toString());
  });

  function doStatus(_x, _x2) {
    return _doStatus.apply(this, arguments);
  }

  return doStatus;
}();
//# sourceMappingURL=do_status.js.map