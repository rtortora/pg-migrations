import minimist from 'minimist';
import find from 'lodash.find';
import log from './lib/logger';
import loadConfig from './lib/load_config';
import discoverMigrations from './lib/discover_migrations';
import doCreate from './commands/do_create';
import doInit from './commands/do_init';
import doStatus from './commands/do_status';

const args = minimist(process.argv.slice(2));

(async ()=>{
  try {
    const command = args._.shift();
    if (command == 'init') {
      await doInit({ args });
    } else {
      const config = await loadConfig(args.config || process.cwd());
      const migrations = await discoverMigrations(config);
      if (command == 'create') {
        await doCreate({ config, migrations, args });
      } else if (command == 'status') {
        await doStatus({ config, migrations, args });
      } else if (command == 'up') {
      } else if (command == 'down') {
      } else {
        const migration = find(migrations, (migration)=>{ return migration.key == command; });
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