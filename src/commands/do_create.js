import Path from 'path';
import FS from 'async-file';
import log from '../lib/logger';

export default async function doCreate(project, args) {
  const config = await project.config();
  const key = (new Date()).toISOString().replace(/:\d\d\..*/, '').replace(/[-T:]/g, '');
  const filename = `${key}.js`;
  const path = Path.join(config.migrationsPath, filename);
  await FS.writeFile(path, `export default {
  up: async (pg)=>{
  },
  down: async(pg)=>{
  },
};
`);
  log.info(`Wrote ${Path.join(config.migrationsPath, filename)}`);
}
