import { Client } from 'pg';
import { Config } from './config';
import { initMigrationsTable } from './init_migrations_table';

let client: Client | null = null;

export function hasClient(): boolean {
  return !!client;
}

export async function getClient(config: Config): Promise<Client> {
  if (!client) {
    client = new Client({ ...config.pg });
    await client.connect();
    await initMigrationsTable(config);
  }
  return client;
}
