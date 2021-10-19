throw new Error(`not working`);

/*
const { newDb, DataType } = require('pg-mem');
const db = newDb();
const initialState = db.backup();
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
module.exports = { Client, db, initialState };
*/