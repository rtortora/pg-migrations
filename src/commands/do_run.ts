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



/*module.exports = async function doRun(host, migrationName, direction, args) {
  if (direction != "up" && direction != "down") {
    throw new Error(`Unhandled migration direction, must be 'up' or 'down' but was: '${direction}'`);
  }
  await host.withMigrationLock(async ()=>{
    const migrationStatusMap = await host.migrationStatusMap({ refresh: true });
    // Determine which migrations to run
    let migrations;
    if (migrationName) {
      const migration = localMigrationsMap.get(migrationName);
      if (!migration) {
        console.error(`No such migration: ${migrationName}`);
        return;
      }
      if (args.force ||
          (direction == 'up' && !migrationStatusMap.get(migration.key).applied) ||
          (direction == 'down' && migrationStatusMap.get(migration.key).applied)) {
        migrations = [migration];
      } else {
        migrations = [];
      }
    } else if (direction == 'up') {
      migrations = [];
      const sortedUnappliedKeys = Array.from(migrationStatusMap.keys()).filter((key)=>{
        return !migrationStatusMap.get(key).applied && migrationStatusMap.get(key).local;
      }).sort();
      for (let key of sortedUnappliedKeys) {
        migrations.push(migrationStatusMap.get(key).local);
      }
    } else if (direction == 'down') {
      const appliedKeys = Array.from(migrationStatusMap.keys()).filter((key)=>{
        return migrationStatusMap.get(key).applied && migrationStatusMap.get(key).local;
      });
      const sortedKeys = [...appliedKeys];
      sortedKeys.sort((a, b)=>{
        const statusA = migrationStatusMap.get(a);
        const statusB = migrationStatusMap.get(b);
        return statusA.applied.migrated_at.toISOString().localeCompare(statusB.applied.migrated_at.toISOString());
      });
      const targetKey = sortedKeys[sortedKeys.length - 1];
      if (targetKey) {
        migrations = [migrationStatusMap.get(targetKey).local];
      } else {
        migrations = [];
      }
    } else {
      throw new Error(`Unexpected`);
    }

    if (args.dryrun) {
      console.log(`Dry run, would run '${direction}' on these migrations in order: (x${migrations.length})`);
      for (let migration of migrations) {
        console.log(`${migration.key} ${migration.path}`);
      }
      return;
    }

    // Actually run the migrations
    const conn = await host.conn();
    for (let migration of migrations) {
      let module = require(migration.path);
      if (module.default) {
        module = module.default;
      }
      if (typeof(module[direction]) === 'function') {
        console.log(`.... ${direction} ${migration.key} ${migration.path}`);
        try {
          const execute = async()=>{
            await (module[direction].bind(module, conn)());
            await host.setMigrationStatus(migration, direction);
            console.log(`OKAY ${direction} ${migration.key} ${migration.path}`);
          };
          if (module.disableTransaction) {
            await execute();
          } else {
            await host.withTransaction(execute);
          }
        } catch(exception) {
          console.log(`FAIL ${direction} ${migration.key} ${migration.path}`);
          console.log(exception);
          process.exit(1);
        }
      } else {
        await host.withTransaction(async()=>{
          await host.setMigrationStatus(migration, direction);
          throw new Error(`${direction} ${migration.key} ${migration.path} (no such function ${direction})`);
        });
      }
    }

    console.log(`Complete!`);
  });
}
*/