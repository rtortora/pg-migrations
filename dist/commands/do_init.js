"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const FS = require('async-file');

const Path = require('path');

const {
  CONFIG_FILENAME
} = require('../migrations_host');

module.exports =
/*#__PURE__*/
function () {
  var _doInit = _asyncToGenerator(function* (host) {
    const path = Path.join(host.rootPath, CONFIG_FILENAME);

    if (!(yield FS.exists(path))) {
      yield FS.writeFile(path, `module.exports = {
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

  function doInit(_x) {
    return _doInit.apply(this, arguments);
  }

  return doInit;
}();
//# sourceMappingURL=do_init.js.map