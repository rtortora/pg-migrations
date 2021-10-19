import { Context } from "../context";
import { LocalMigration } from "./local_migrations_map";
import { RunDirection } from './run_local_migration';

export function getLocalMigrationDisplayPath(context: Context, localMigration: LocalMigration) {
  let usePath: string | null;
  if (localMigration.type === 'sql') {
    usePath = localMigration.upPath || null;
  } else {
    usePath = localMigration.path;
  }
  if (usePath && usePath.startsWith(context.rootPath)) {
    return usePath.substr(context.rootPath.length);
  } else {
    return usePath;
  }
}

export function getLocalMigrationDirectionalPath(context: Context, localMigration: LocalMigration, direction: RunDirection): string | null {
  if (localMigration.type === 'sql') {
    if (direction === 'up') { return localMigration.upPath || null; }
    else { return localMigration.downPath || null; }
  } else {
    return localMigration.path;
  }
}

export function getLocalMigrationPaths(localMigration: LocalMigration): string[] {
  if (localMigration.type === 'sql') {
    return [
      localMigration.upPath,
      localMigration.downPath,
    ].filter((path)=>(!!path)) as string[];
  } else {
    return [localMigration.path];
  }
}
