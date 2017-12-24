"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = doStatus;

var _cliTable = _interopRequireDefault(require("cli-table"));

var _lodash = _interopRequireDefault(require("lodash.sortby"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

function doStatus(_x, _x2) {
  return _doStatus.apply(this, arguments);
}

function _doStatus() {
  _doStatus = _asyncToGenerator(function* (host, args) {
    const migrationStatusMap = yield host.migrationStatusMap();
    const sortedKeys = (0, _lodash.default)(Array.from(migrationStatusMap.keys()), [key => {
      return migrationStatusMap.get(key).applied ? 0 : 1;
    }, key => {
      return migrationStatusMap.get(key).applied ? migrationStatusMap.get(key).applied.migrated_at : key;
    }]);
    const table = new _cliTable.default({
      head: ["Key", "Status", "Path"]
    });

    for (let key of sortedKeys) {
      const status = migrationStatusMap.get(key);
      table.push([key, status.applied ? `up at ${status.applied.migrated_at}` : `down`, status.local ? status.local.filename : `*** NO FILE ***`]);
    }

    console.log(table.toString());
  });
  return _doStatus.apply(this, arguments);
}
//# sourceMappingURL=do_status.js.map