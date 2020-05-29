"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const Path = require('path');

const FS = require('async-file');

module.exports =
/*#__PURE__*/
function () {
  var _doTidy = _asyncToGenerator(function* (migrationController, args) {
    const config = yield migrationController.config();

    for (const fileName of yield FS.readdir(config.migrationsPath)) {
      const match = fileName.match(/^(\d\d\d\d)(\d\d).*\.js$/i);

      if (!match) {
        continue;
      }

      const [_, year, month] = match;
      const tidyPath = `${year}-${month}`;
      console.log(tidyPath);

      if (!(yield FS.exists(Path.join(config.migrationsPath, tidyPath)))) {
        yield FS.createDirectory(Path.join(config.migrationsPath, tidyPath));
      }

      yield FS.rename(Path.join(config.migrationsPath, fileName), Path.join(config.migrationsPath, tidyPath, fileName));
    }
  });

  function doTidy(_x, _x2) {
    return _doTidy.apply(this, arguments);
  }

  return doTidy;
}();
//# sourceMappingURL=do_tidy.js.map