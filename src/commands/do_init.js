const FS = require('async-file');
const Path = require('path');
const { CONFIG_FILENAME } = require('../migrations_host');

module.exports = async function doInit(host) {
  const path = Path.join(host.rootPath, CONFIG_FILENAME);
  if (!(await FS.exists(path))) {
    await FS.writeFile(path, `module.exports = {
  migrationsTableName: "migrations",
  migrationsPath: "./migrations/",
  getConnection: async ()=>{
    const pg = /* do stuff to get a single pg client to your database */
    return pg;
  }
}
  `);
    console.log(`Wrote skeleton to ${path}`);
  } else {
    console.log(`Already configured at ${path}`);
  }
}
