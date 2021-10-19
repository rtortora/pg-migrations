import { promises as FS } from 'fs';
import Path from 'path';
import { Config } from '../config';
import { MigrationType } from '../lib/local_migrations_map';
import { fileExists } from '../util/file_exists';
import { DefaultTemplateByType } from '../lib/default_templates';
import { DefaultConfig } from '../lib/config_loader';

type StartingConfig = Partial<Pick<Config, "migrationsRelPath">>;

export type InitArgs = {
  workingDirectory: string,
  migrationRelPath?: string,
  configType?: MigrationType,
};

export async function doInit(args: InitArgs): Promise<void> {
  args.configType = args.configType || "ts";
  if (!["ts", "js"].includes(args.configType)) {
    throw new Error(`Not implemented config type '${args.configType}'`);
  }

  const config = await writeStartingConfig(args);

  const migrationsPath = Path.join(args.workingDirectory, config.migrationsRelPath!);
  if (!(await fileExists(migrationsPath))) {
    await FS.mkdir(migrationsPath);
    console.log(`Created ${migrationsPath}`);
  }

  const defaultTemplatePath = Path.join(migrationsPath, `_template.${args.configType}`);
  if (await fileExists(defaultTemplatePath)) {
    throw new Error(`Template file already exists at ${defaultTemplatePath}`);
  }
  await FS.writeFile(defaultTemplatePath, DefaultTemplateByType[args.configType]!);
  console.log(`Created ${defaultTemplatePath}`);
}

async function writeStartingConfig(args: InitArgs): Promise<Config> {
  const startingConfig = getStartingConfig({
    migrationsRelPath: args.migrationRelPath || DefaultConfig.migrationsRelPath,
  });
  const configPath = Path.join(args.workingDirectory, `migrations.config.${args.configType!}`);
  if (await fileExists(configPath)) {
    throw new Error(`Config file already exists at ${configPath}`);
  }
  if (args.configType === 'ts') {
    await FS.writeFile(configPath, `import { Config } from 'pg-migrations';

const config: Config = ${JSON.stringify(startingConfig, null, 2)};

export default config;
`);
  } else if (args.configType === 'js') {
    await FS.writeFile(configPath, `module.exports = ${JSON.stringify(startingConfig, null, 2)};
`);
  } else {
    throw new Error(`not implemented`);
  }
  console.log(`Created ${configPath}`);

  return startingConfig;
}

function getStartingConfig(configByArgs: StartingConfig): Config {
  const config: Config = {
    migrationsTableName: "migrations",
    migrationsRelPath: "./migrations",
    pg: {
      database: "",
      user: "",
      password: process.env.PGPASSWORD,
      host: "localhost",
      port: 5432,
    },
    ...configByArgs,
  };
  return config;
};
