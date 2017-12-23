import merge from 'lodash.merge';
import Path from 'path';
import FS from 'async-file';
import Config from '../models/config';

const CONFIG_FILENAME = "migrations.config.js";

/**
 * Loads a project config.
 * @param {string} workingPath - Current working path, defaults to current working directory.
 * @return {Config}
 */
export default async function loadConfig(workingPath = null) {
  workingPath = workingPath || process.cwd();
  const originalWorkingPath = workingPath;
  while (true) {
    if (await FS.exists(Path.join(workingPath, CONFIG_FILENAME), FS.constants.R_OK)) {
      break;
    }
    workingPath = Path.dirname(workingPath);
    if (workingPath == "/") {
      throw new Error(`Cannot find ${Path.join(originalWorkingPath, CONFIG_FILENAME)}`);
    }
  }
  const loadedConfig = require(Path.join(workingPath, CONFIG_FILENAME)).default;
  return new Config(merge({},
    { path: workingPath },
    loadedConfig,
  ));
}
