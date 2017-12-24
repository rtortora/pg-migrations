import FS from 'async-file';
import Path from 'path';
import { CONFIG_FILENAME } from '../lib/project';

export default async function doInit(project) {
  const path = Path.join(project.rootPath, CONFIG_FILENAME);
  if (!(await FS.exists(path))) {
    await FS.writeFile(path, `export default {
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
