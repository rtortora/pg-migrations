export default async function withMigrationLock(config, conn, fn) {
  await conn.query(`select pg_advisory_lock(1) from "${config.migrationsTableName}"`);
  try {
    await fn();
  } finally {
    await conn.query(`select pg_advisory_unlock(1) from "${config.migrationsTableName}"`);
  }
}