#!/usr/bin/env node
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const minimist = require('minimist');

const MigrationsHost = require('./migrations_host.js');

const doCreate = require('./commands/do_create');

const doInit = require('./commands/do_init');

const doRun = require('./commands/do_run');

const doStatus = require('./commands/do_status');

const args = minimist(process.argv.slice(2));

_asyncToGenerator(function* () {
  try {
    const host = new MigrationsHost(args.config || process.cwd());

    const command = args._.shift();

    if (command == 'init') {
      yield doInit(host);
    } else if (command == 'create') {
      yield doCreate(host, args);
    } else if (command == 'status') {
      yield doStatus(host, args);
    } else if (command == 'up') {
      yield doRun(host, null, 'up', args);
    } else if (command == 'down') {
      yield doRun(host, null, 'down', args);
    } else {
      const localMigrationsMap = yield host.localMigrationsMap();

      if (localMigrationsMap.has(command)) {
        yield doRun(host, localMigrationsMap.get(command), args._.shift(), args);
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