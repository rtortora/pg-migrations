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
    if (process.env.NODE_ENV === 'test') {
      // Ideally we wouldn't do this, but I couldn't figure out how to
      // reset a single pg-mem db instance every test.
      const { newDb, DataType } = require('pg-mem');
      const db = newDb();
      db.public.registerFunction({
        name: 'timezone',
        args: [DataType.text, DataType.date],
        returns: DataType.date,
        implementation: (x: any)=>(x),
      });
      db.public.registerFunction({
        name: 'pg_advisory_lock',
        args: [DataType.integer],
        returns: DataType.null,
        implementation: async (x: any)=>(null),
      });
      db.public.registerFunction({
        name: 'pg_advisory_unlock',
        args: [DataType.integer],
        returns: DataType.null,
        implementation: async (x: any)=>(null),
      });
      const PgMemPgAdapter = db.adapters.createPg();
      context.client = new PgMemPgAdapter.Client({ ...context.pg });
    } else {
      context.client = new Client({ ...context.pg });
    }
    createdClients.push(context.client!);
    await context.client!.connect();
    await initMigrationsTable(context);
  }
  return context.client!;
}
