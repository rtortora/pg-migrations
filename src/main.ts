import { loadConfig } from './lib/config_loader';
import { Context } from './context';
import { getCreatedClients } from './lib/pg_client';
import { doStatus } from './commands/status';
import minimist from 'minimist';
import { doRun } from './commands/run';
import { doCreate } from './commands/create';
import { doInit } from './commands/do_init';

async function main() {
  const args = minimist(process.argv.slice(2));
  const rootPath: string = args.path || process.cwd();
  const command = args._.shift();

  if (command === "init") {
    await doInit({
      workingDirectory: rootPath,
      configType: args['config-type'],
      migrationRelPath: args['migration-rel-path'],
    });
  } else {
    const config = await loadConfig(rootPath);
    const context: Context = {
      ...config,
      rootPath,
    };

    if (command === "status") {
      await doStatus(context);
    } else if (command === "up") {
      await doRun(context, {
        direction: 'up',
        key: args.key,
      });
    } else if (command === "down") {
      await doRun(context, {
        direction: 'down',
        key: args.key,
      });
    } else if (command === "create") {
      await doCreate(context, {
        key: args.key,
        name: args.name,
        type: args.type,
      });
    } else {
      throw new Error(`No such command '${command}'`);
    }
  }

  for (const client of getCreatedClients()) {
    await client.end();
  }
}

main();
