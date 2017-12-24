"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = doInit;

var _asyncFile = _interopRequireDefault(require("async-file"));

var _path = _interopRequireDefault(require("path"));

var _migrations_host = require("../migrations_host");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

function doInit(_x) {
  return _doInit.apply(this, arguments);
}

function _doInit() {
  _doInit = _asyncToGenerator(function* (host) {
    const path = _path.default.join(host.rootPath, _migrations_host.CONFIG_FILENAME);

    if (!(yield _asyncFile.default.exists(path))) {
      yield _asyncFile.default.writeFile(path, `export default {
migrationsTableName: "migrations",
migrationsPath: "./migrations/",
getConnection: async ()=>{
  const pg = /* do stuff to get a single pg client to your database */
  return pg;
}
}
  `);
      console.log(`Wrote skeleton to ${path}`);
    } else {
      console.log(`Already configured at ${path}`);
    }
  });
  return _doInit.apply(this, arguments);
}
//# sourceMappingURL=do_init.js.map