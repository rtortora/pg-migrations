import { Context } from "../context";
import { getClient } from "./pg_client";

export async function withMigrationLock<T = any>(context: Context, callback: ()=>(Promise<T>)): Promise<T> {
  if (context.hasMigrationLock) {
    return await callback();
  } else {
    const pg = await getClient(context);
    await pg.query(`select pg_advisory_lock(1) from "${context.migrationsTableName}"`);
    context.hasMigrationLock = true;
    try {
      return await callback();
    } finally {
      await pg.query(`select pg_advisory_unlock(1) from "${context.migrationsTableName}"`);
      context.hasMigrationLock = false;
    }
  }
}
