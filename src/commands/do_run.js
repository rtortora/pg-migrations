import Path from 'path';
import FS from 'async-file';
import Table from 'cli-table';
import map from 'lodash.map';
import forEach from 'lodash.foreach';
import log from '../lib/logger';
import bootstrap from '../lib/bootstrap';
import withMigrationLock from '../lib/with_migration_lock';
import discoverMigrationsStatus from '../lib/discover_migrations_status';

export default async function doRun({ config, migration, migrations, direction, args }) {
  const conn = await config.getConnection();
  await conn.connect();
  await bootstrap(config, conn);
  await withMigrationLock(config, conn, async ()=>{
    const statuses = await discoverMigrationsStatus(config, migrations, conn);
    if (migration) {
    } else {
      if (direction == "up") {
      } else if (direction == "down") {
      } else {
        throw new Error(`Unexpected direction ${direction}`);
      }
    }
  }
  const statuses = (await conn.query(`select "key", "filename", "migrated_at" from "${config.migrationsTableName}" order by "migrated_at"`)).rows;

  if (migration) {
  } else {
  }
  const localMap = new Map();
  const migrationMap = new Map();
  forEach(migrations, (migration)=>{
    localMap.set(migration.key, migration);
    migrationMap.set(migration.key, { local: migration });
  });


  forEach(statuses, (status)=>{
    migrationMap.set(status.key, { applied: status, local: localMap.get(status.key) });
  });

  const table = new Table({
    head: [ "Key", "Status", "Path" ],
  });
  forEach(Array.from(migrationMap.keys()), (key)=>{
    const status = migrationMap.get(key);
    table.push([
      key,
      status.applied ? `up at ${status.applied.migrated_at}` : `down`,
      status.local ? status.local.filename : `*** NO FILE ***`,
    ]);
  });
  console.log(table.toString());
}
