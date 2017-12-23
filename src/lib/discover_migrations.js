import map from 'lodash.map';
import Path from 'path';
import FS from 'async-file';
import Migration from '../models/migration';
import filenameToKey from './filename_to_key';

/**
 * Discovers all migration files.
 * @param {Config} config
 * @return {Promise<Migration[]>}
 */
export default async function discoverMigrations(config) {
  const migrationsPath = Path.join(config.path, config.migrationsPath);
  const files = await FS.readdir(migrationsPath);
  return map(files, (filename)=>{
    return new Migration({
      filename,
      path: Path.join(config.path, config.migrationsPath, filename),
      key: filenameToKey(filename),
    });
  });
}
