import { Context } from "../context";
import { getMigrationStatusMap } from "../lib/migration_status_map";
import { getLocalMigrationDisplayPath } from "../lib/local_migration_paths";
import Table from 'cli-table';

export async function status(context: Context, {
  silent = false,
}: {
  silent?: boolean,
} = {}): Promise<Table> {
  const migrationStatusMap = await getMigrationStatusMap(context);
  const table = new Table({
    head: [ "Key", "Status", "Local Path" ],
  });
  for(const key of migrationStatusMap.keys()) {
    const status = migrationStatusMap.get(key)!;
    table.push([
      key,
      status.applied ? `up at ${status.applied.migratedAt.toISOString()}` : `down`,
      status.local ? getLocalMigrationDisplayPath(context, status.local) : `MISSING: ${status.applied?.filename}`,
    ]);
  }
  if (!silent) {
    console.log(table.toString());
  }
  return table;
}
