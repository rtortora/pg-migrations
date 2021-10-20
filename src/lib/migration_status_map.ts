import { Context } from "../context";
import { ExecutedMigration, getExecutedMigrationsMap } from "./executed_migrations_map";
import { getLocalMigrationsMap, LocalMigration } from "./local_migrations_map";

export type MigrationStatus = {
  local: LocalMigration | null,
  applied: ExecutedMigration | null,
}

export type MigrationStatusMap = Map<string, MigrationStatus>;

export async function getMigrationStatusMap(context: Context): Promise<MigrationStatusMap> {
  const map: MigrationStatusMap = new Map();
  for (const local of (await getLocalMigrationsMap(context)).values()) {
    map.set(local.key, { local, applied: null });
  }
  for (const applied of (await getExecutedMigrationsMap(context)).values()) {
    if (!map.has(applied.key)) {
      map.set(applied.key, { local: null, applied });
    } else {
      map.get(applied.key)!.applied = applied;
    }
  }
  return sortMigrationStatusMap(map);
}

function sortMigrationStatusMap(map: MigrationStatusMap): MigrationStatusMap {
  const sortedKeys = Array.from(map.keys());
  sortedKeys.sort((a, b)=>{
    const statusA = map.get(a)!;
    const statusB = map.get(b)!;
    if (statusA.applied && statusB.applied) {
      return statusA.applied.migratedAt.toISOString().localeCompare(statusB.applied.migratedAt.toISOString());
    } else if (statusA.applied && !statusB.applied) {
      return -1;
    } else {
      return 1;
    }
  });

  const sorted: MigrationStatusMap = new Map();
  for (const key of sortedKeys) {
    sorted.set(key, map.get(key)!);
  }
  return sorted;
}
