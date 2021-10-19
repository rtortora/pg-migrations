import { Context } from "../context";
import { isMigration, Migration } from "../migration";
import { getLocalMigrationDirectionalPath, getLocalMigrationDisplayPath } from "./local_migration_paths";
import { LocalMigration, LocalScriptMigration, LocalSqlMigration } from "./local_migrations_map";
import { getClient } from "./pg_client";
import { withTransaction } from "./with_transaction";
import { promises as FS } from 'fs';

export type RunDirection = 'up' | 'down';

export async function runLocalMigration({
  context,
  direction,
  localMigration,
  isRunningJustOne,
}: {
  context: Context,
  direction: RunDirection,
  localMigration: LocalMigration,
  isRunningJustOne: boolean,
}) {
  await withTransaction(context, async ()=>{
    let migration: Migration;
    if (localMigration.type == 'sql') {
      migration = await loadLocalSqlMigration({ localMigration });
    } else {
      migration = await loadLocalScriptMigration({ localMigration });
    }

    const client = await getClient(context);
    if (migration[direction]) {
      console.log(`.... ${direction} ${localMigration.key} ${getLocalMigrationDirectionalPath(context, localMigration, direction)}`);
      await setMigrationStatusInControlTable({
        context,
        localMigration,
        status: direction,
      });
      try {
        await migration[direction]!(client);
        console.log(`DONE ${direction} ${localMigration.key} ${getLocalMigrationDirectionalPath(context, localMigration, direction)}`);
      } catch(error) {
        console.error(`FAIL ${direction} ${localMigration.key} ${getLocalMigrationDirectionalPath(context, localMigration, direction)}`);
        throw error;
      }

    } else {
      if (isRunningJustOne) {
        throw new Error(`Migration ${localMigration.key} has no direction ${direction}`);
      }
    }
  });
}

async function loadLocalScriptMigration({
  localMigration,
}: {
  localMigration: LocalScriptMigration,
}): Promise<Migration> {
  let imported: any = await import(localMigration.path);
  let module: Migration | null = null;
  if (isMigration(imported)) {
    // can this ever happen?
    module = imported as Migration;
  } else if (imported.default && isMigration(imported.default)) {
    module = imported.default as Migration;
  } else {
    throw new Error(`Cannot find migration module in script ${localMigration.path}`);
  }
  return module;
}

async function loadLocalSqlMigration({
  localMigration,
}: {
  localMigration: LocalSqlMigration,
}): Promise<Migration> {
  const [upSql, downSql] = await Promise.all([
    localMigration.upPath ? FS.readFile(localMigration.upPath).then((buffer)=>(buffer.toString())) : Promise.resolve(null),
    localMigration.downPath ? FS.readFile(localMigration.downPath).then((buffer)=>(buffer.toString())) : Promise.resolve(null),
  ]);
  return {
    up: async (pg)=>{
      if (upSql) {
        await pg.query(upSql);
      }
    },
    down: async (pg)=>{
      if (downSql) {
        await pg.query(downSql);
      }
    },
  };
}

async function setMigrationStatusInControlTable({
  context,
  localMigration,
  status,
}: {
  context: Context,
  localMigration: LocalMigration,
  status: RunDirection,
}): Promise<void> {
  const pg = await getClient(context);
  if (status === 'up') {
    await pg.query(`
      insert into "${context.migrationsTableName}" (key, filename) values ($1, $2)
    `, [
      localMigration.key,
      getLocalMigrationDisplayPath(context, localMigration),
    ]);
  } else if (status === 'down') {
    await pg.query(`
      delete from "${context.migrationsTableName}" where key = $1
    `, [
      localMigration.key,
    ]);
  } else {
    throw new Error(`Unexpected status`);
  }
}
