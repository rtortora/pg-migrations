import { Context } from "../context";
import { getClient } from "./pg_client";

export async function withTransaction<T = any>(context: Context, callback: ()=>(Promise<T>)): Promise<T> {
  if (context.transaction) {
    return await callback();
  } else {
    const pg = await getClient(context);
    await pg.query(`begin`);
    context.transaction = true;
    try {
      const results: T = await callback();
      await pg.query(`commit`);
      return results;
    } catch(error) {
      await pg.query("rollback");
      throw error;
    } finally {
      context.hasMigrationLock = false;
    }
  }
}
