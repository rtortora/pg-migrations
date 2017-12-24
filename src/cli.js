import minimist from 'minimist';
import Project from './lib/project';
import doCreate from './commands/do_create';
import doInit from './commands/do_init';
import doRun from './commands/do_run';
import doStatus from './commands/do_status';

import find from 'lodash.find';

const args = minimist(process.argv.slice(2));

(async ()=>{
  try {
    const project = new Project(args.config || process.cwd());
    const command = args._.shift().toString();

    if (command == 'init') {
      await doInit(project);
    } else if (command == 'create') {
      await doCreate(project, args);
    } else if (command == 'status') {
      await doStatus(project, args);
    } else if (command == 'up') {
      await doRun(project, null, 'up', args);
    } else if (command == 'down') {
      await doRun(project, null, 'down', args);
    } else {
      const localMigrationsMap = await project.localMigrationsMap();
      if (localMigrationsMap.has(command)) {
        await doRun(project, localMigrationsMap.get(command), args._.shift(), args);
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