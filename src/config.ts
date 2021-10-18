import type { MigrationType } from './lib/local_migrations_map';

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
