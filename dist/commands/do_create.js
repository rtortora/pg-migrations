"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const Path = require('path');

const FS = require('async-file');

module.exports =
/*#__PURE__*/
function () {
  var _doCreate = _asyncToGenerator(function* (migrationController, args) {
    const config = yield migrationController.config();
    const key = new Date().toISOString().replace(/:\d\d\..*/, '').replace(/[-T:]/g, '');
    const filename = `${key}.js`;
    const path = Path.join(config.migrationsPath, filename);
    yield FS.writeFile(path, `module.exports = {
  up: async (pg)=>{
  },
  down: async(pg)=>{
  },
};
`);
    console.log(`Wrote ${Path.join(config.migrationsPath, filename)}`);
  });

  function doCreate(_x, _x2) {
    return _doCreate.apply(this, arguments);
  }

  return doCreate;
}();
//# sourceMappingURL=do_create.js.map