import { promises as FS } from 'fs';
import Path from 'path';
import { Config, CreationConfig, PgConfig } from '../config';
import { MigrationType } from '../lib/local_migrations_map';
import { fileExists } from '../util/file_exists';
import { DefaultTemplateByType } from '../lib/default_templates';
import { DefaultConfig } from '../lib/config_loader';

type StartingConfig = Partial<Pick<Config, "migrationsRelPath" | "pg" | "creation">>;

export interface IInitCommandArgs {
  migrationRelPath?: string,
  silent?: boolean,
};

type InitArgs = IInitCommandArgs & {
  workingDirectory: string,
  libSrc?: string,
  pg?: PgConfig
  creation?: CreationConfig,
};

export async function init(args: InitArgs): Promise<void> {
  const config = await writeStartingConfig(args);

  const migrationsPath = Path.join(args.workingDirectory, config.migrationsRelPath!);
  if (!(await fileExists(migrationsPath))) {
    await FS.mkdir(migrationsPath);
    if (!args.silent) {
      console.log(`Created ${migrationsPath}`);
    }
  }

  const defaultMigrationType = (args.creation ? args.creation.defaultMigrationType : null) || "js";

  const defaultTemplatePath = Path.join(migrationsPath, `_template.${defaultMigrationType}`);
  if (await fileExists(defaultTemplatePath)) {
    throw new Error(`Template file already exists at ${defaultTemplatePath}`);
  }
  await FS.writeFile(defaultTemplatePath, DefaultTemplateByType[defaultMigrationType]!);
  if (!args.silent) {
    console.log(`Created ${defaultTemplatePath}`);
  }
}

async function writeStartingConfig(args: InitArgs): Promise<Config> {
  const defaultMigrationType = (args.creation ? args.creation.defaultMigrationType : null) || "js";
  const startingConfig = getStartingConfig({
    migrationsRelPath: args.migrationRelPath || DefaultConfig.migrationsRelPath,
    pg: args.pg || { database: "" },
    creation: {
      defaultMigrationType,
      ...args.creation,
      ...(args.libSrc ? { libSrc: args.libSrc } : {}),
    },
  });
  const configPath = Path.join(args.workingDirectory, `migrations.config.js`);
  if (await fileExists(configPath)) {
    throw new Error(`Config file already exists at ${configPath}`);
  }
  await FS.writeFile(configPath, `module.exports = ${JSON.stringify(startingConfig, null, 2)};`);

  if (!args.silent) {
    console.log(`Created ${configPath}`);
  }

  return startingConfig;
}

function getStartingConfig(configByArgs: StartingConfig): Config {
  const config: Config = {
    migrationsTableName: "migrations",
    migrationsRelPath: "./migrations",
    pg: { database: "" },
    ...configByArgs,
  };
  return config;
};
