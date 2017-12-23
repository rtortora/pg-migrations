import FS from 'async-file';
import Path from 'path';

const CONFIG_FILENAME = "migrations.config.js";

export default async function doInit({ args }) {
  const path = Path.join(process.cwd(), CONFIG_FILENAME);
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
}
