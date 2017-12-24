import minimist from 'minimist';
import find from 'lodash.find';
import log from './lib/logger';
import loadConfig from './lib/load_config';
import Project from './lib/project';
import discoverMigrations from './lib/discover_migrations';
import doCreate from './commands/do_create';
import doInit from './commands/do_init';
import doRun from './commands/do_run';
import doStatus from './commands/do_status';

const args = minimist(process.argv.slice(2));

(async ()=>{
  try {
    const project = new Project(args.config || process.cwd());
    const command = args._.shift();

    if (command == 'init') {
      await doInit(project);
    } else {
      if (command == 'create') {
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
        }
      }
    }
    process.exit(0);
  } catch(exception) {
    if (args.trace) {
      log.error(exception.stack);
    } else {
      log.error(`Run again with --trace to see the stacktrace.`);
    }
    log.error(exception.message);
    process.exit(1);
  }
})();