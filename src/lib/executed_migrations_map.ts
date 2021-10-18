import { Context } from "../context";
import { getClient } from "./pg_client";

export type ExecutedMigration = {
  key: string,
  filename: string,
  migratedAt: Date,
};

export type ExecutedMigrationsMap = Map<string, ExecutedMigration>;

export async function getExecutedMigrationsMap(context: Context): Promise<ExecutedMigrationsMap> {
  const map: ExecutedMigrationsMap = new Map();
  const pg = await getClient(context);
  for (const row of (await pg.query(`
    select "key", "filename", "migrated_at" as "migratedAt"
    from "${context.migrationsTableName}"
    order by "migrated_at" asc
  `)).rows as ExecutedMigration[]) {
    map.set(row.key, row);
  }
  return map;
}
