import { Context } from "../context";
import { isMigrationModule, MigrationModule } from "../migration_module";
import { getLocalMigrationDirectionalPath, getLocalMigrationDisplayPath } from "./local_migration_paths";
import { LocalMigration, LocalScriptMigration, LocalSqlMigration } from "./local_migrations_map";
import { getClient } from "./pg_client";
import { withTransaction } from "./with_transaction";

export type RunDirection = 'up' | 'down';

export async function runLocalMigration({
  context,
  direction,
  migration,
  isRunningJustOne,
}: {
  context: Context,
  direction: RunDirection,
  migration: LocalMigration,
  isRunningJustOne: boolean,
}) {
  await withTransaction(context, async ()=>{
    let migrationModule: MigrationModule;
    if (migration.type == 'sql') {
      migrationModule = await loadSqlMigrationModule({ migration });
    } else {
      migrationModule = await loadScriptMigrationModule({ migration });
    }

    const client = await getClient(context);
    if (migrationModule[direction]) {
      console.log(`.... ${direction} ${migration.key} ${getLocalMigrationDirectionalPath(context, migration, direction)}`);
      await setMigrationStatusInControlTable({
        context,
        migration,
        status: direction,
      });
      try {
        await migrationModule[direction]!(client);
        console.log(`DONE ${direction} ${migration.key} ${getLocalMigrationDirectionalPath(context, migration, direction)}`);
      } catch(error) {
        console.error(`FAIL ${direction} ${migration.key} ${getLocalMigrationDirectionalPath(context, migration, direction)}`);
        throw error;
      }

    } else {
      if (isRunningJustOne) {
        throw new Error(`Migration ${migration.key} has no direction ${direction}`);
      }
    }
  });
}

async function loadScriptMigrationModule({
  migration,
}: {
  migration: LocalScriptMigration,
}): Promise<MigrationModule> {
  let imported: any = await import(migration.path);
  let module: MigrationModule | null = null;
  if (isMigrationModule(imported)) {
    // can this ever happen?
    module = imported as MigrationModule;
  } else if (imported.default && isMigrationModule(imported.default)) {
    module = imported.default as MigrationModule;
  } else {
    throw new Error(`Cannot find migration module in script ${migration.path}`);
  }
  return module;
}

async function loadSqlMigrationModule({
}: {
  migration: LocalSqlMigration,
}): Promise<MigrationModule> {
  throw new Error(`not implemented`);
}

async function setMigrationStatusInControlTable({
  context,
  migration,
  status,
}: {
  context: Context,
  migration: LocalMigration,
  status: RunDirection,
}): Promise<void> {
  const pg = await getClient(context);
  if (status === 'up') {
    await pg.query(`
      insert into "${context.migrationsTableName}" (key, filename) values ($1, $2)
    `, [
      migration.key,
      getLocalMigrationDisplayPath(context, migration),
    ]);
  } else if (status === 'down') {
    await pg.query(`
      delete from "${context.migrationsTableName}" where key = $1
    `, [
      migration.key,
    ]);
  } else {
    throw new Error(`Unexpected status`);
  }
}
