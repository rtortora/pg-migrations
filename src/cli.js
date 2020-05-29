#!/usr/bin/env node
const minimist = require('minimist');
const MigrationsHost = require('./migrations_host.js');
const doCreate = require('./commands/do_create');
const doInit = require('./commands/do_init');
const doRun = require('./commands/do_run');
const doStatus = require('./commands/do_status');
const doTidy = require('./commands/do_tidy');

const args = minimist(process.argv.slice(2));

(async ()=>{
  try {
    const host = new MigrationsHost(args.config || process.cwd());
    const command = args._.shift();

    if (command == 'init') {
      await doInit(host);
    } else if (command == 'create') {
      await doCreate(host, args);
    } else if (command == 'status') {
      await doStatus(host, args);
    } else if (command == 'up') {
      await doRun(host, null, 'up', args);
    } else if (command == 'down') {
      await doRun(host, null, 'down', args);
    } else if (command == 'tidy' || command == 'tidyup') {
      await doTidy(host, args);
    } else {
      const localMigrationsMap = await host.localMigrationsMap();
      if (localMigrationsMap.has(command)) {
        await doRun(host, localMigrationsMap.get(command), args._.shift(), args);
      } else {
        console.log(`Can't find migration by key '${command}'`);
        process.exit(1);
      }
    }
    process.exit(0);
  } catch(exception) {
    if (args.trace) {
      console.error(exception.stack);
    } else {
      console.error(`Run again with --trace to see the stacktrace.`);
    }
    console.error(exception.message);
    process.exit(1);
  }
})();