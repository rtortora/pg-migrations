import { loadConfig } from './lib/config_loader';
import { Context } from './context';
import { getCreatedClients } from './lib/pg_client';
import { doStatus } from './commands/do_status';
import minimist from 'minimist';
import { doRun } from './commands/do_run';

async function main() {
  const args = minimist(process.argv.slice(2));
  const rootPath: string = args.path || process.cwd();
  const config = await loadConfig(rootPath);
  const context: Context = {
    ...config,
    rootPath,
  };

  const command = args._.shift();
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
  } else {
    throw new Error(`No such command '${command}'`);
  }

  for (const client of getCreatedClients()) {
    await client.end();
  }
}

main();
