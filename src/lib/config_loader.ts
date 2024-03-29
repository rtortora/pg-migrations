import Path from 'path';
import { fileExists } from '../util/file_exists';
import { Config } from "../config";
import { EOL } from 'os';
import { promises as FS } from 'fs';
import { importCode } from './code_importer';

export type FullConfig = Required<Config> & {
  creation: Required<Config['creation']>
};

const ConfigFileName = "migrations.config.js";

export const DefaultConfig: Partial<Config> = {
  migrationsRelPath: "./migrations",
  migrationsTableName: "migrations",
  creation: {
    libSrc: 'pg-migrations',
    autoTidy: false,
    defaultMigrationType: 'ts',
    fileNameSeperator: '_',
    includeSecondsInKeys: false,
    lineEndings: EOL,
  },
};

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function validateConfig(obj: any): obj is FullConfig {
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
  if (!obj.creation) {
    throw new Error(`No settings for creation`);
  }
  return true;
}

export async function loadConfig(workingDirectory: string): Promise<FullConfig> {
  if (await fileExists(Path.join(workingDirectory, ConfigFileName))) {
    return await loadConfigFromPath(Path.join(workingDirectory, ConfigFileName));
  }
  throw new ConfigValidationError(`Could not find ${Path.join(workingDirectory, ConfigFileName)}`);
}

async function loadConfigFromPath(path: string): Promise<FullConfig> {
  const imported = await importCode(path);
  const fullConfig: FullConfig = {
    ...DefaultConfig,
    ...imported.default,
    creation: {
      ...DefaultConfig.creation,
      ...imported.default.creation,
    },
  };
  if (validateConfig(fullConfig)) {
    return fullConfig;
  } else {
    throw new ConfigValidationError(`Could not load ${path}`);
  }
}
