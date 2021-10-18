import { Context } from "../config";
import { LocalMigration } from "../lib/local_migrations_map";
import { getMigrationStatusMap } from "../lib/migration_status_map";
import Table from 'cli-table';

export async function doStatus(context: Context) {
  const migrationStatusMap = await getMigrationStatusMap(context);
  const sortedKeys = Array.from(migrationStatusMap.keys());
  sortedKeys.sort((a, b)=>{
    const statusA = migrationStatusMap.get(a)!;
    const statusB = migrationStatusMap.get(b)!;
    if (statusA.applied && statusB.applied) {
      return statusA.applied.migratedAt.toISOString().localeCompare(statusB.applied.migratedAt.toISOString());
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
    const status = migrationStatusMap.get(key)!;
    table.push([
      key,
      status.applied ? `up at ${status.applied.migratedAt.toISOString()}` : `down`,
      status.local ? displayFilename(context, status.local) : `MISSING: ${status.applied?.filename}`,
    ]);
  }
  console.log(table.toString());
}

function displayFilename(context: Context, localMigration: LocalMigration) {
  let usePath: string | null;
  if (localMigration.type === 'sql') {
    usePath = localMigration.upPath || null;
  } else {
    usePath = localMigration.path;
  }
  if (usePath && usePath.startsWith(context.rootPath)) {
    return usePath.substr(context.rootPath.length);
  } else {
    return usePath;
  }
}
