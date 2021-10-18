import { loadContext } from './config';
import { hasClient, getClient } from './lib/pg_client';
import { doStatus } from './commands/do_status';

import minimist from 'minimist';

async function main() {
  const args = minimist(process.argv.slice(2));
  const context = await loadContext(args.path);
  const command = args._.shift();
  if (command === "status") {
    await doStatus(context);
  }
  if (hasClient()) {
    (await getClient(context)).end();
  }
}

main();
