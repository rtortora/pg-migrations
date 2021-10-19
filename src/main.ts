import { loadContext } from './lib/context_loader';
import { closeLingeringClients } from './lib/pg_client';
import { status } from './commands/status';
import minimist from 'minimist';
import { run } from './commands/run';
import { create } from './commands/create';
import { init } from './commands/init';
import { tidy } from './commands/tidy';

async function main() {
  const args = minimist(process.argv.slice(2), {
    string: ["key", "name"],
  });
  const rootPath: string = args.path || process.cwd();
  const command = args._.shift();

  if (command === "init") {
    await init({
      workingDirectory: rootPath,
      configType: args['config-type'],
      migrationRelPath: args['migration-rel-path'],
    });
  } else {
    const context = await loadContext(rootPath);

    if (command === "status" || !command) {
      await status(context);
    } else if (command === "up") {
      await run(context, {
        direction: 'up',
        key: args.key,
      });
    } else if (command === "down") {
      await run(context, {
        direction: 'down',
        key: args.key,
      });
    } else if (command === "create") {
      await create(context, {
        key: args.key,
        name: args.name,
        type: args.type,
      });
    } else if (command === "tidy") {
      await tidy(context, {});
    } else {
      throw new Error(`No such command '${command}'`);
    }
  }

  closeLingeringClients();
}

main();
