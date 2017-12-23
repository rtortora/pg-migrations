export default async function isMigrationUp(config, conn, migration) {
  const rawCountData = await conn.query(`select count(*) as count from "${config.migrationsTableName}" where "key" = $1`, migration.key);
  return rawCountData && rawCountData[0] && rawCountData[0].count > 0;
}
