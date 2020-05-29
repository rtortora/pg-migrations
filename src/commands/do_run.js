module.exports = async function doRun(host, migrationName, direction, args) {
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
      const sortedKeys = new Array(appliedKeys);
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
