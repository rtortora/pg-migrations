import Path from 'path';
import FS from 'async-file';
import Table from 'cli-table';
import map from 'lodash.map';
import forEach from 'lodash.foreach';
import log from '../lib/logger';
import bootstrap from '../lib/bootstrap';
import withMigrationLock from '../lib/with_migration_lock';
import discoverMigrationsStatus from '../lib/discover_migrations_status';

export default async function doRun() {
}
