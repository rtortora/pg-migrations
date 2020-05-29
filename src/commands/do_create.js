const Path = require('path');
const FS = require('async-file');

module.exports = async function doCreate(migrationController, args) {
  const config = await migrationController.config();
  const key = (new Date()).toISOString().replace(/:\d\d\..*/, '').replace(/[-T:]/g, '');
  const postfix = args.name || args._.join(' ');
  const filename = [key, postfix ? `-${postfix}` : '', '.js'].join('');
  const path = Path.join(config.migrationsPath, filename);
  await FS.writeFile(path, `module.exports = {
  up: async (pg)=>{
  },
  down: async(pg)=>{
  },
};
`);
  console.log(`Wrote ${Path.join(config.migrationsPath, filename)}`);
}
