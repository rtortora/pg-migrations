const Table = require('cli-table');

module.exports = async function doStatus(host, args) {
  const migrationStatusMap = await host.migrationStatusMap();
  const sortedKeys = Array.from(migrationStatusMap.keys());
  sortedKeys.sort((a, b)=>{
    const statusA = migrationStatusMap.get(a);
    const statusB = migrationStatusMap.get(b);
    if (statusA.applied && statusB.applied) {
      return statusA.applied.migrated_at.toISOString().localeCompare(statusB.applied.migrated_at.toISOString());
    } else if (statusA.applied && !statusB.applied) {
      return -1;
    } else {
      return 1;
    }
  });
  const table = new Table({
    head: [ "Key", "Status", "Path" ],
  });
  for(let key of sortedKeys) {
    const status = migrationStatusMap.get(key);
    table.push([
      key,
      status.applied ? `up at ${status.applied.migrated_at.toISOString()}` : `down`,
      status.local ? status.local.filename : `*** NO FILE ***`,
    ]);
  }
  console.log(table.toString());
}
