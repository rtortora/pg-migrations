import { doStatus } from './commands/do_status';
import { loadContext } from './config';
import { getLocalMigrationsMap } from './local_migrations_map';
import { hasClient, getClient } from './pg_client';

import minimist from 'minimist';

async function main() {
  const args = minimist(process.argv.slice(2));

  const context = await loadContext(args.path);
  const localMigrationsMap = await getLocalMigrationsMap(context);
  for (const key of localMigrationsMap.keys()) {
    console.log(`${key}: ${JSON.stringify(localMigrationsMap.get(key))}`);
  }

  const command = args._.shift();

  if (command === "status") {
    await doStatus(context);
  }

  if (hasClient()) {
    (await getClient(context)).end();
  }
}

main();
