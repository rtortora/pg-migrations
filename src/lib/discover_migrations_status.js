import map from 'lodash.map';
import forEach from 'lodash.foreach';

export default async function discoverMigrationsStatus(config, migrations, conn) {
  const localMap = new Map();
  const migrationMap = new Map();
  forEach(migrations, (migration)=>{
    localMap.set(migration.key, migration);
    migrationMap.set(migration.key, { local: migration });
  });

  const statuses = (await conn.query(`select "key", "filename", "migrated_at" from "${config.migrationsTableName}" order by "migrated_at"`)).rows;
  forEach(statuses, (status)=>{
    migrationMap.set(status.key, { applied: status, local: localMap.get(status.key) });
  });

  return map(Array.from(migrationMap.keys()), (key)=>{
    const status = migrationMap.get(key);
    return {
      key,
      up: status.applied,
      local: status.local,
    ]);
  });
}
