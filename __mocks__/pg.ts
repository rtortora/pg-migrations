import { newDb, DataType } from 'pg-mem';

function createNewDbClientClass(): any {
  const db = newDb();
  db.public.registerFunction({
    name: 'timezone',
    args: [DataType.text, DataType.date],
    returns: DataType.date,
    implementation: (_tz, date)=>(date),
  });
  db.public.registerFunction({
    name: 'pg_advisory_lock',
    args: [DataType.integer],
    returns: DataType.null,
    implementation: async (x)=>(null),
  });
  db.public.registerFunction({
    name: 'pg_advisory_unlock',
    args: [DataType.integer],
    returns: DataType.null,
    implementation: async (x)=>(null),
  });
  const { Client } = db.adapters.createPg();
  return Client;
}

class ClientWrapper {
  private clientConstructorArgs: any;
  private client: any;

  constructor(...args: any) {
    this.clientConstructorArgs = args;
  }

  connect(...args: any) {
    const Client = createNewDbClientClass();
    this.client = new Client(...this.clientConstructorArgs);
    return this.client.connect(...args);
  }

  query(...args: any) {
    return this.client.query(...args);
  }

  end() {
    this.client.end();
  }
}

module.exports = { Client: ClientWrapper};
