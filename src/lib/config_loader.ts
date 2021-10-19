import Path from 'path';
import { fileExists } from '../util/file_exists';
import { Config } from "../config";
import { EOL } from 'os';

export type FullConfig = Required<Config> & {
  creation: Required<Config['creation']>
};

const ConfigFileNames: string[] = [
  "migrations.config.ts",
  "migrations.config.js",
];

const DefaultConfig: Partial<Config> = {
  migrationsRelPath: "./migrations",
  migrationsTableName: "migrations",
  creation: {
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
  for (const fileName of ConfigFileNames) {
    if (await fileExists(Path.join(workingDirectory, fileName))) {
      return await loadConfigFromPath(Path.join(workingDirectory, fileName));
    }
  }
  throw new ConfigValidationError(`Could not find migrations.config.ts/.js file at ${Path.join(workingDirectory, ConfigFileNames[0])}`);
}

async function loadConfigFromPath(path: string): Promise<FullConfig> {
  const imported = await import(path);
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
