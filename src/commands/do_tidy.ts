import path from 'path';
import { promises as fs } from 'fs';
import { fileExists } from '../util/file_exists';

export type TidyArgs = {};

export async function doTidy(migrationController, args: TidyArgs = {}) {
  const config = await migrationController.config();
  for (const fileName of await fs.readdir(config.migrationsPath)) {
    const match = fileName.match(/^(\d\d\d\d)(\d\d).*\.js$/i);
    if (!match) {
      continue;
    }
    const [_, year, month] = match;
    const tidyPath = `${year}-${month}`;
    console.log(tidyPath);
    if (!(await fileExists(path.join(config.migrationsPath, tidyPath)))) {
      await fs.mkdir(path.join(config.migrationsPath, tidyPath));
    }
    await fs.rename(
      path.join(config.migrationsPath, fileName),
      path.join(config.migrationsPath, tidyPath, fileName)
    );
  }
}
