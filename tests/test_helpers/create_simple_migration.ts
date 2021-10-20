import { create, generateNewMigrationKey } from "../../src/commands/create";
import { Context } from "../../src/context";
import { MigrationType } from "../../src/lib/local_migrations_map";
import { promises as FS } from 'fs';

export async function createSimpleMigration({
  context,
  key,
  migrationType,
  name,
  upSql,
  downSql,
}: {
  context: Context,
  key?: string,
  migrationType?: MigrationType,
  name?: string,
  upSql?: string,
  downSql?: string,
}): Promise<{ key: string }> {
  key = key || generateNewMigrationKey(context);
  const { paths } = await create(context, { key, name, type: migrationType, silent: true });
  if (migrationType === 'ts') {
    await FS.writeFile(paths[0], `import { Migration } from '${context.creation.libSrc}';
const migration: Migration = {
  up: async (pg)=>{ ${upSql ? `await pg.query(\`${upSql}\`);` : ''} },
  down: async (pg)=>{ ${downSql ? `await pg.query(\`${downSql}\`);` : ''} },
}
export default migration;
`);
  } else if (migrationType === 'js') {
    await FS.writeFile(paths[0], `module.exports = {
  up: async (pg)=>{ ${upSql ? `await pg.query(\`${upSql}\`);` : ''} },
  down: async (pg)=>{ ${downSql ? `await pg.query(\`${downSql}\`);` : ''} },
};
`);
  } else if (migrationType === 'sql') {
    if (upSql) {
      await FS.writeFile(paths[0], upSql);
    }
    if (downSql) {
      await FS.writeFile(paths[1], downSql);
    }
  } else {
    throw new Error(`Unsupported migration type '${migrationType}'`);
  }
  return { key };
}