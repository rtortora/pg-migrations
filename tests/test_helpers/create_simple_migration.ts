import { create, generateNewMigrationKey } from "../../src/commands/create";
import { Context } from "../../src/context";
import { MigrationType } from "../../src/lib/local_migrations_map";
import { promises as FS } from 'fs';

export async function createSimpleMigration({
  context,
  migrationType,
  name,
  upSql,
  downSql,
}: {
  context: Context,
  migrationType?: MigrationType,
  name?: string,
  upSql?: string,
  downSql?: string,
}): Promise<void> {
  const key = generateNewMigrationKey(context);
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
  } else if (migrationType === 'sql') {
  } else {
    throw new Error(`Unsupported migration type '${migrationType}'`);
  }
}