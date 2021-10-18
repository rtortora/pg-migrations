import { loadConfig } from './lib/config_loader';
import { Context } from './context';
import { getCreatedClients } from './lib/pg_client';
import { doStatus } from './commands/do_status';
import minimist from 'minimist';

async function main() {
  const args = minimist(process.argv.slice(2));
  const rootPath: string = args.path || process.cwd();
  const config = await loadConfig(rootPath);
  const context: Context = {
    ...config,
    rootPath,
    client: null,
    hasMigrationLock: false,
  };

  const command = args._.shift();
  if (command === "status") {
    await doStatus(context);
  }

  for (const client of getCreatedClients()) {
    await client.end();
  }
}

main();
