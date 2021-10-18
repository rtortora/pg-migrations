import { Context } from "../context";
import { getMigrationStatusMap } from "../lib/migration_status_map";
import { withMigrationLock } from "../lib/with_migration_lock";
import { RunDirection, runLocalMigration } from '../lib/run_local_migration';

export type RunArgs = {
  direction: RunDirection,
  key?: string,
};

export async function doRun(context: Context, { direction, key }: RunArgs): Promise<void> {
  await withMigrationLock(context, async ()=>{
    const migrationStatusMap = await getMigrationStatusMap(context);
    if (key && (!migrationStatusMap.has(key) || !migrationStatusMap.get(key!)!.local)) {
      throw new Error(`Cannot run ${direction} ${key ? `on '${key}' ` : ''}because cannot find local file`);
    }
    if (direction === 'up' && !key) {
      let runCount: number = 0;
      for (const migrationStatus of migrationStatusMap.values()) {
        if (!migrationStatus.applied && migrationStatus.local) {
          await runLocalMigration({ context, direction: 'up', migration: migrationStatus.local!, isRunningJustOne: false });
          runCount += 1;
        }
      }
      if (runCount === 0) {
        console.log(`All migrations are up.`);
      }
    } else if (direction === 'down' && !key) {
      const appliedMigrationStatuses = [...migrationStatusMap.values()].filter((migrationStatus)=>(migrationStatus.applied));
      const latestApplied = appliedMigrationStatuses[appliedMigrationStatuses.length - 1];
      if (!latestApplied) {
        throw new Error(`No applied migrations to down`);
      }
      if (!latestApplied.local) {
        throw new Error(`Cannot run down on ${latestApplied.applied!.key} "${latestApplied.applied!.filename}" because no local file`);
      }
      await runLocalMigration({ context, direction: 'down', migration: latestApplied.local, isRunningJustOne: true });
    } else if (key) {
      await runLocalMigration({
        context,
        direction,
        migration: migrationStatusMap.get(key)!.local!,
        isRunningJustOne: true,
      });
    } else {
      // nothing to do i think?
      throw new Error(`not implemented`);
    }
  });
}
