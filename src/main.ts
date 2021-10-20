import { loadContext } from './lib/context_loader';
import { closeLingeringClients } from './lib/pg_client';
import { status } from './commands/status';
import minimist from 'minimist';
import { run } from './commands/run';
import { create } from './commands/create';
import { init } from './commands/init';
import { tidy } from './commands/tidy';
import { help } from './commands/help';

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

    if (!command || /^statu?s$/i.test(command)) {
      await status(context);
    } else if (/^up$/.test(command)) {
      await run(context, {
        direction: 'up',
        key: args.key,
      });
    } else if (/^down$/i.test(command)) {
      await run(context, {
        direction: 'down',
        key: args.key,
      });
    } else if (/^create$/i.test(command)) {
      await create(context, {
        key: args.key,
        name: args.name,
        type: args.type,
      });
    } else if (/^tidy$/i.test(command)) {
      await tidy(context, {});
    } else if (/^help$/i.test(command)) {
      await help();
    } else {
      throw new Error(`No such command '${command}'`);
    }
  }

  closeLingeringClients();
}

main();
