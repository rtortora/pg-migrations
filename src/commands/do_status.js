import Path from 'path';
import FS from 'async-file';
import Table from 'cli-table';
import map from 'lodash.map';
import forEach from 'lodash.foreach';
import log from '../lib/logger';
import bootstrap from '../lib/bootstrap';
import discoverMigrationsStatus from '../lib/discover_migrations_status';

export default async function doStatus({ config, migrations, args }) {
  const conn = await config.getConnection();
  await conn.connect();
  await bootstrap(config, conn);
  const statuses = await discoverMigrationsStatus(config, migrations, conn);
  const table = new Table({
    head: [ "Key", "Status", "Path" ],
  });
  forEach(statuses, (status)=>{
    table.push([
      status.key,
      status.up ? `up at ${status.up.migrated_at}` : `down`,
      status.local ? status.local.filename : `*** NO FILE ***`,
    ]);
  });
  console.log(table.toString());
}
