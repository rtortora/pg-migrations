import { Context } from "./config";
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
  return map;
}
