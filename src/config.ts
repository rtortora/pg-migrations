import path from 'path';
import { fileExists } from './util/file_exists';
import type { MigrationType } from './lib/local_migrations_map';

const ConfigFileNames: string[] = [
  "migrations.config.ts",
  "migrations.config.js",
];

export type Config = {
  migrationsRelPath: string,
  migrationsTableName: string,
  autoTidy?: boolean,
  defaultMigrationType: MigrationType,
  pg: {
    user?: string,
    host?: string,
    database: string,
    password?: string,
    port?: number,
  },
};

export type Context = {
  rootPath: string
} & Config;

const DefaultConfig: Partial<Config> = {
  migrationsRelPath: "./migrations/",
  migrationsTableName: "migrations",
  defaultMigrationType: 'ts',
};

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function validateConfig(obj: any): obj is Config {
  if (!obj) { throw new Error(`No config provided`); }
  if (!obj.migrationsRelPath || typeof(obj.migrationsRelPath) !== "string") {
    throw new Error(`Config missing valid migrationsRelPath`);
  }
  if (!obj.migrationsTableName || typeof(obj.migrationsTableName) !== "string") {
    throw new Error(`Config missing valid migrationsTableName`);
  }
  if (!obj.pg || typeof(obj.pg) !== "object") {
    throw new Error(`Config missing valid pg`);
  }
  if (!obj.pg.database || typeof(obj.pg.database) !== "string") {
    throw new Error(`Config missing valid pg.database`);
  }
  return true;
}

export async function loadContext(workingDirectory: string | null = null): Promise<Context> {
  if (!workingDirectory) {
    workingDirectory = process.cwd();
  }
  for (const fileName of ConfigFileNames) {
    if (await fileExists(path.join(workingDirectory, fileName))) {
      return {
        ...(await loadConfigFromPath(path.join(workingDirectory, fileName))),
        rootPath: workingDirectory,
      };
    }
  }
  throw new ConfigValidationError(`Could not find migrations.config.ts/.js file at ${path.join(workingDirectory, ConfigFileNames[0])}`);
}

async function loadConfigFromPath(path: string): Promise<Config> {
  const imported = await import(path);
  const asConfig = {...DefaultConfig, ...imported.default};
  if (validateConfig(asConfig)) {
    return asConfig;
  } else {
    throw new ConfigValidationError(`Could not load ${path}`);
  }
}
