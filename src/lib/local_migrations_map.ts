import { Context } from '../context';
import { promises as FS } from 'fs';
import Path from 'path';
import { combineMaps } from '../util/combine_maps';

export type LocalScriptMigration = {
  type: 'ts' | 'js';
  key: string,
  path: string,
};

export type LocalSqlMigration = {
  type: 'sql';
  key: string,
  upPath?: string | null,
  downPath?: string | null,
};

export type LocalMigration = LocalScriptMigration | LocalSqlMigration;

export type MigrationType = LocalMigration['type'];

export type LocalMigrationsMap = Map<string, LocalMigration>;

export async function getLocalMigrationsMap(context: Context): Promise<LocalMigrationsMap> {
  return await scanFolderForLocalMigrations(Path.join(context.rootPath, context.migrationsRelPath));
}

async function scanFolderForLocalMigrations(scanPath: string): Promise<LocalMigrationsMap> {
  let scanned: LocalMigrationsMap = new Map();
  for (let filename of await FS.readdir(scanPath)) {
    const stat = await FS.stat(Path.join(scanPath, filename));
    if (stat.isDirectory()) {
      const subScan = await scanFolderForLocalMigrations(Path.join(scanPath, filename));
      scanned = combineMaps(scanned, subScan);
    } else {
      const keySearch = filename.match(/(^[0-9]{12,14})/);
      if (keySearch) {
        const key = keySearch[1];
        if (/[_-](up|down)\.sql$/i.test(filename)) {
          let prop: keyof(LocalSqlMigration) = /-down\.sql$/i.test(filename) ? "downPath" : "upPath";
          if (!scanned.has(key)) {
            scanned.set(key, { type: 'sql', key, [prop]: Path.join(scanPath, filename) });
          } else {
            if (scanned.get(key)!.type !== 'sql') {
              throw new Error(`Local migrations mismatch, can't mix sql up/down and ts/js`);
            }
            const sqlLocalMigration: LocalSqlMigration = scanned.get(key) as LocalSqlMigration;
            sqlLocalMigration[prop] = Path.join(scanPath, filename);
          }
        } else {
          if (/\.ts$/i.test(filename)) {
            scanned.set(key, { type: 'ts', key, path: Path.join(scanPath, filename) });
          } else if (/\.js$/i.test(filename)) {
            scanned.set(key, { type: 'js', key, path: Path.join(scanPath, filename) });
          }
        }
      }
    }
  }
  return scanned;
}
