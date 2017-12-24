import sortBy from 'lodash.sortby';
import filter from 'lodash.filter';
import isFunction from 'lodash.isfunction';

export default async function doRun(project, migration, direction, args) {
  if (direction != "up" && direction != "down") {
    throw new Error(`Unhandled migration direction, must be 'up' or 'down' but was: '${direction}'`);
  }
  await project.withMigrationLock(async ()=>{
    const migrationStatusMap = await project.migrationStatusMap({ refresh: true });

    // Determine which migrations to run
    let migrations;
    if (migration) {
      if (args.force ||
          (direction == 'up' && !migrationStatusMap.get(migration.key).applied) ||
          (direction == 'down' && migrationStatusMap.get(migration.key).applied)) {
        migrations = [migration];
      } else {
        migrations = [];
      }
    } else if (direction == 'up') {
      migrations = [];
      const sortedUnappliedKeys = filter(Array.from(migrationStatusMap.keys()), (key)=>{
        return !migrationStatusMap.get(key).applied && migrationStatusMap.get(key).local;
      }).sort();
      for (let key of sortedUnappliedKeys) {
        migrations.push(migrationStatusMap.get(key).local);
      }
    } else if (direction == 'down') {
      const appliedKeys = filter(Array.from(migrationStatusMap.keys()), (key)=>{
        return migrationStatusMap.get(key).applied && migrationStatusMap.get(key).local;
      });
      const sortedKeys = sortBy(appliedKeys, (key)=>{
        return migrationStatusMap.get(key).applied.migrated_at;
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
    const conn = await project.conn();
    for (let migration of migrations) {
      const module = require(migration.path).default;
      if (isFunction(module[direction])) {
        console.log(`.... ${direction} ${migration.key} ${migration.path}`);
        await project.withTransaction(async()=>{
          await (module[direction].bind(module, conn)());
          await project.setMigrationStatus(migration, direction);
          console.log(`OKAY ${direction} ${migration.key} ${migration.path}`);
        });
      } else {
        await project.withTransaction(async()=>{
          await project.setMigrationStatus(migration, direction);
          console.log(`SKIP ${direction} ${migration.key} ${migration.path} (no such direction ${direction})`);
        });
      }
    }

    console.log(`Complete!`);
  });
}
