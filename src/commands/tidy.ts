import Path from 'path';
import { promises as FS } from 'fs';
import { fileExists } from '../util/file_exists';
import { Context } from "../context";
import { getLocalMigrationsMap } from '../lib/local_migrations_map';
import { getLocalMigrationPaths } from '../lib/local_migration_paths';

export type TidyArgs = {
  silent?: boolean,
};

export async function tidy(context: Context, { silent }: TidyArgs = {}) {
  const localMigrations = await getLocalMigrationsMap(context);
  for (const localMigration of localMigrations.values()) {
    const match = localMigration.key.match(/^(?<year>\d\d\d\d)(?<month>\d\d)/i);
    if (!match) {
      continue;
    }
    for (const path of getLocalMigrationPaths(localMigration)) {
      const { year, month } = match.groups as {[key: string]: string};
      const tidyPath = `${year}${context.creation.fileNameSeperator}${month}`;
      if (!(await fileExists(Path.join(context.rootPath, context.migrationsRelPath, tidyPath)))) {
        if (!silent) {
          console.log(`Created ${Path.join(context.rootPath, context.migrationsRelPath, tidyPath)}`);
        }
        await FS.mkdir(Path.join(context.rootPath, context.migrationsRelPath, tidyPath));
      }

      const moveTo = Path.join(context.rootPath, context.migrationsRelPath, tidyPath, Path.basename(path));
      if (!silent) {
        console.log(`Moved ${moveTo}`);
      }
      await FS.rename(
        path,
        moveTo,
      );
    }
  }
}
