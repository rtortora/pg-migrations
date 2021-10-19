import { Client } from 'pg';
import { Context } from '../context';
import { initMigrationsTable } from './init_migrations_table';

const createdClients: Client[] = [];

export async function closeLingeringClients(): Promise<void> {
  for (const client of createdClients) {
    await client.end();
  }
}

export async function getClient(context: Context): Promise<Client> {
  if (!context.client) {
    context.client = new Client({ ...context.pg });
    createdClients.push(context.client);
    await context.client.connect();
    await initMigrationsTable(context);
  }
  return context.client;
}
