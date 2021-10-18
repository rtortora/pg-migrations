import { Client } from 'pg';
import { Config } from './config';

export type Context = {
  rootPath: string,
  client: Client | null,
  hasMigrationLock?: boolean,
} & Config;
