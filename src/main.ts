import { loadContext } from './lib/context_loader';
import { closeLingeringClients } from './lib/pg_client';
import { status } from './commands/status';
import { parse } from 'ts-command-line-args';
import { run, IRunCommandArgs } from './commands/run';
import { create, ICreateCommandArgs } from './commands/create';
import { init, IInitCommandArgs } from './commands/init';
import { tidy } from './commands/tidy';
import { help } from './commands/help';
import { MigrationType } from './lib/local_migrations_map';
import { RunDirection } from './lib/run_local_migration';

interface IMainArgs {
  command?: string,
  path?: string,
};

// TODO RT: validating this would be better
const MigrationTypeArgType = (input: string)=>(input as MigrationType);

async function main() {
  const mainArgs = parse<IMainArgs>({
    command: { type: String, optional: true, defaultOption: true },
    path: { type: String, optional: true },
  }, {
     partial: true,
  });

  // TODO RT: is this a ts-command-line-args bug? it looks like
  // _unknown should exist when partial: true but it's just not
  const argv = (mainArgs as any)._unknown || [];

  const rootPath: string = mainArgs.path || process.cwd();
  const command = mainArgs.command;

  if (command === "init") {
    const initArgs = parse<IInitCommandArgs>({
      configType: { type: MigrationTypeArgType, optional: true },
      migrationRelPath: { type: String, optional: true },
      silent: { type: Boolean, optional: true },
    }, { argv });
    await init({
      workingDirectory: rootPath,
      ...initArgs,
    });
  } else {
    const context = await loadContext(rootPath);

    if (!command || /^statu?s$/i.test(command)) {
      await status(context);
    } else if (/^(up|down)$/.test(command)) {
      const runArgs = parse<IRunCommandArgs>({
        key: { type: String, optional: true },
        silent: { type: Boolean, optional: true },
      }, { argv });
      await run(context, {
        direction: command as RunDirection,
        ...runArgs,
      });
    } else if (/^create$/i.test(command)) {
      const createArgs = parse<ICreateCommandArgs>({
        key: { type: String, optional: true },
        name: { type: String, optional: true, defaultOption: true },
        type: { type: MigrationTypeArgType, optional: true },
        silent: { type: Boolean, optional: true },
      }, { argv });
      await create(context, createArgs);
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
