const Table = require('cli-table');
const sortBy = require('lodash.sortby');

module.exports = async function doStatus(host, args) {
  const migrationStatusMap = await host.migrationStatusMap();
  const sortedKeys = sortBy(Array.from(migrationStatusMap.keys()), [
    (key)=>{ return migrationStatusMap.get(key).applied ? 0 : 1 },
    (key)=>{ return migrationStatusMap.get(key).applied ? migrationStatusMap.get(key).applied.migrated_at : key },
  ]);
  const table = new Table({
    head: [ "Key", "Status", "Path" ],
  });
  for(let key of sortedKeys) {
    const status = migrationStatusMap.get(key);
    table.push([
      key,
      status.applied ? `up at ${status.applied.migrated_at}` : `down`,
      status.local ? status.local.filename : `*** NO FILE ***`,
    ]);
  }
  console.log(table.toString());
}
