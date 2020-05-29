const Path = require('path');
const FS = require('async-file');

module.exports = async function doTidy(migrationController, args) {
  const config = await migrationController.config();
  for (const fileName of await FS.readdir(config.migrationsPath)) {
    const match = fileName.match(/^(\d\d\d\d)(\d\d).*\.js$/i);
    if (!match) {
      continue;
    }
    const [_, year, month] = match;
    const tidyPath = `${year}-${month}`;
    console.log(tidyPath);
    if (!(await FS.exists(Path.join(config.migrationsPath, tidyPath)))) {
      await FS.createDirectory(Path.join(config.migrationsPath, tidyPath));
    }
    await FS.rename(
      Path.join(config.migrationsPath, fileName),
      Path.join(config.migrationsPath, tidyPath, fileName)
    );
  }
}
