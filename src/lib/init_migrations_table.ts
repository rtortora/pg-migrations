import { Config } from '../config';
import { getClient } from './pg_client';

export async function initMigrationsTable(config: Config): Promise<void> {
  const pg = await getClient(config);
  await pg.query(`
    create table if not exists "${config.migrationsTableName}" (
      "key" text primary key not null,
      "filename" text not null,
      "migrated_at" timestamp with time zone not null default timezone('utc'::text, now())
    );
    create unique index if not exists idx_${config.migrationsTableName}_key on "${config.migrationsTableName}" ("key");
  `);
}
