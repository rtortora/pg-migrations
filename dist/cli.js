#!/usr/bin/env node --require babel-register --require babel-polyfill
"use strict";

var _minimist = _interopRequireDefault(require("minimist"));

var _migrations_host = _interopRequireDefault(require("./migrations_host.js"));

var _do_create = _interopRequireDefault(require("./commands/do_create"));

var _do_init = _interopRequireDefault(require("./commands/do_init"));

var _do_run = _interopRequireDefault(require("./commands/do_run"));

var _do_status = _interopRequireDefault(require("./commands/do_status"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const args = (0, _minimist.default)(process.argv.slice(2));

_asyncToGenerator(function* () {
  try {
    const host = new _migrations_host.default(args.config || process.cwd());

    const command = args._.shift().toString();

    if (command == 'init') {
      yield (0, _do_init.default)(host);
    } else if (command == 'create') {
      yield (0, _do_create.default)(host, args);
    } else if (command == 'status') {
      yield (0, _do_status.default)(host, args);
    } else if (command == 'up') {
      yield (0, _do_run.default)(host, null, 'up', args);
    } else if (command == 'down') {
      yield (0, _do_run.default)(host, null, 'down', args);
    } else {
      const localMigrationsMap = yield host.localMigrationsMap();

      if (localMigrationsMap.has(command)) {
        yield (0, _do_run.default)(host, localMigrationsMap.get(command), args._.shift(), args);
      } else {
        console.log(`Can't find migration by key '${command}'`);
        process.exit(1);
      }
    }

    process.exit(0);
  } catch (exception) {
    if (args.trace) {
      console.error(exception.stack);
    } else {
      console.error(`Run again with --trace to see the stacktrace.`);
    }

    console.error(exception.message);
    process.exit(1);
  }
})();
//# sourceMappingURL=cli.js.map