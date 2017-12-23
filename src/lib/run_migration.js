import Path from 'path';
import isFunction from 'lodash.isfunction';
import log from './logger';
import discoverMigrations from './discover_migrations';
import isMigrationUp from './is_migration_up';

/**
 * Runs a migration.
 * @param {Config} config
 * @param {Migration} migration
 * @param {string} direction - Direction of the migration, either 'up' or 'down'.
 */
export default async function runMigration(config, migration, direction = 'up') {
  log.debug(`starting ${migration.filename} ${direction}`);

  if (direction != 'up' && direction != 'down') {
    throw new Error(`Direction must be 'up' or 'down' but was '${direction}'`);
  }

  const migrationModule = require(migration.path).default;
  if (!isFunction(migrationCode[direction])) {
    log.warn(`migration ${migration.filename} has no direction ${direction}`);
    return false;
  }

  const conn = config.getConnection();
  await conn.query(`select pg_advisory_lock(1) from "${config.migrationsTableName}"`);
  await conn.query("begin");
  try {
    const isUp = await isMigrationUp(config, conn, migration);
    if ((isUp && direction == 'down') || (!isUp && direction == 'up')) {
      await migrationModule[direction].bind(migrationModule, conn)();
      await conn.query("commit");
      log.info(`migration ${migration.filename} now ${direction}`);
      return true;
    } else {
      await conn.query("commit");
      log.debug(`migration ${migration.filename} was already ${direction}`);
      return false;
    }
  } catch(exception) {
    await conn.query("rollback");
    throw exception;
  } finally {
    await conn.query(`select pg_advisory_unlock(1) from "${config.migrationsTableName}"`);
  }
}
