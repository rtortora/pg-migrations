import Path from 'path';
import FS from 'async-file';

export default async function doCreate(migrationController, args) {
  const config = await migrationController.config();
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
  console.log(`Wrote ${Path.join(config.migrationsPath, filename)}`);
}
