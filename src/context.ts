import { Client } from 'pg';
import { FullConfig } from './lib/config_loader';

export type Context = {
  rootPath: string,
  client?: Client | null,
  hasMigrationLock?: boolean,
  transaction?: boolean,
} & FullConfig;
