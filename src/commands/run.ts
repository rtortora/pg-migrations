import { Context } from "../context";
import { getMigrationStatusMap } from "../lib/migration_status_map";
import { withMigrationLock } from "../lib/with_migration_lock";
import { RunDirection, runLocalMigration } from '../lib/run_local_migration';

export interface IRunCommandArgs {
  key?: string,
  silent?: boolean,
};

type RunArgs = {
  direction: RunDirection,
} & IRunCommandArgs;

export async function run(context: Context, { direction, key, silent }: RunArgs): Promise<void> {
  await withMigrationLock(context, async ()=>{
    const migrationStatusMap = await getMigrationStatusMap(context);
    if (key && !migrationStatusMap.has(key)) {
      throw new Error(`Cannot run ${direction} ${key ? `on '${key}' ` : ''}because key does not exist`);
    } else if (key && !migrationStatusMap.get(key!)!.local) {
      throw new Error(`Cannot run ${direction} ${key ? `on '${key}' ` : ''}because cannot find local file ${JSON.stringify(migrationStatusMap.get(key), null, 2)}`);
    }
    if (direction === 'up' && !key) {
      let runCount: number = 0;
      for (const migrationStatus of migrationStatusMap.values()) {
        if (!migrationStatus.applied && migrationStatus.local) {
          await runLocalMigration({
            context,
            direction: 'up',
            localMigration: migrationStatus.local!,
            isRunningJustOne: false,
            silent,
          });
          runCount += 1;
        }
      }
      if (runCount === 0) {
        if (!silent) {
          console.log(`All migrations are up.`);
        }
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
      await runLocalMigration({
        context,
        direction: 'down',
        localMigration: latestApplied.local,
        isRunningJustOne: true,
        silent,
      });
    } else if (key) {
      await runLocalMigration({
        context,
        direction,
        localMigration: migrationStatusMap.get(key)!.local!,
        isRunningJustOne: true,
        silent,
      });
    } else {
      // nothing to do i think?
      throw new Error(`not implemented`);
    }
  });
}
