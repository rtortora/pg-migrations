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
      const tidyPath = await ensureTidyPathForMigrationKey(context, localMigration.key);
      if (!tidyPath) {
        continue;
      }
      const moveTo = Path.join(tidyPath, Path.basename(path));
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

export function getTidyRelPath(context: Context, key: string): string | null {
  const match = key.match(/^(?<year>\d\d\d\d)(?<month>\d\d)/i);
  if (!match) {
    return null;
  }
  const { year, month } = match.groups as {[key: string]: string};
  const tidyPath = `${year}${context.creation.fileNameSeperator}${month}`;
  return tidyPath;
}

export async function ensureTidyPathForMigrationKey(context: Context, key: string): Promise<string | null> {
  const tidyRelPath = getTidyRelPath(context, key);
  if (!tidyRelPath) {
    return null;
  }
  const path = Path.join(context.rootPath, context.migrationsRelPath, tidyRelPath);
  if (!(await fileExists(path))) {
    await FS.mkdir(path);
  }
  return path;
}
