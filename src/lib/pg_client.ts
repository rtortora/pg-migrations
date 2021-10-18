import { Client } from 'pg';
import { Context } from '../context';
import { initMigrationsTable } from './init_migrations_table';

const createdClients: Client[] = [];

export function getCreatedClients(): Client[] {
  return createdClients;
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
