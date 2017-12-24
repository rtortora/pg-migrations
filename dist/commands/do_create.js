"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = doCreate;

var _path = _interopRequireDefault(require("path"));

var _asyncFile = _interopRequireDefault(require("async-file"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

function doCreate(_x, _x2) {
  return _doCreate.apply(this, arguments);
}

function _doCreate() {
  _doCreate = _asyncToGenerator(function* (migrationController, args) {
    const config = yield migrationController.config();
    const key = new Date().toISOString().replace(/:\d\d\..*/, '').replace(/[-T:]/g, '');
    const filename = `${key}.js`;

    const path = _path.default.join(config.migrationsPath, filename);

    yield _asyncFile.default.writeFile(path, `export default {
  up: async (pg)=>{
  },
  down: async(pg)=>{
  },
};
`);
    console.log(`Wrote ${_path.default.join(config.migrationsPath, filename)}`);
  });
  return _doCreate.apply(this, arguments);
}
//# sourceMappingURL=do_create.js.map