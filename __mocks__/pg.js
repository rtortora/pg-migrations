const { newDb, DataType } = require('pg-mem');

function createNewDbClientClass() {
  const db = newDb();
  db.public.registerFunction({
    name: 'timezone',
    args: [DataType.text, DataType.date],
    returns: DataType.date,
    implementation: (x)=>(x),
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
  constructor(...args) {
    this.clientConstructorArgs = args;
  }

  connect(...args) {
    const Client = createNewDbClientClass();
    this.client = new Client(...this.clientConstructorArgs);
    return this.client.connect(...args);
  }

  query(...args) {
    return this.client.query(...args);
  }

  end() {
    this.client.end();
  }
}

module.exports = { Client: ClientWrapper};
