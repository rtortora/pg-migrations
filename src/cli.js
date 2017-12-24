#!/usr/bin/env node --require babel-register --require babel-polyfill
import minimist from 'minimist';
import MigrationsHost from './migrations_host.js';
import doCreate from './commands/do_create';
import doInit from './commands/do_init';
import doRun from './commands/do_run';
import doStatus from './commands/do_status';

const args = minimist(process.argv.slice(2));

(async ()=>{
  try {
    const host = new MigrationsHost(args.config || process.cwd());
    const command = args._.shift().toString();

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