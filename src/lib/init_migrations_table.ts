import { Context } from '../context';
import { getClient } from './pg_client';

export async function initMigrationsTable(context: Context): Promise<void> {
  const pg = await getClient(context);
  await pg.query(`
    create table if not exists "${context.migrationsTableName}" (
      "key" text primary key not null,
      "filename" text not null,
      "migrated_at" timestamp with time zone not null default timezone('utc'::text, now())
    );
    create unique index if not exists idx_${context.migrationsTableName}_key on "${context.migrationsTableName}" ("key");
  `);
}
