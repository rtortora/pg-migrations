/**
 * @name GetConnectionCallback
 * @function
 * @return {object} A client as provided by the node-postgres library.
 */

/**
 * Represents a project configuration.
 * @typedef {object} Config
 * @property {string} path - Path of the config file itself, e.g., the root of the project.
 * @property {string} migrationsTableName - The name of the migrations table. Default value 'migrations'.
 * @property {string} migrationsPath - Relative path from the root of the project to the migrations folder. Default value './migrations/'.
 * @property {GetConnectionCallback} getConnection
 */
export default class Config {
  constructor(data) {
    this.path = data.path || process.cwd();
    this.migrationsTableName = data.migrationsTableName || "migrations";
    this.migrationsPath = data.migrationsPath || "./migrations/";
    this.getConnection = data.getConnection || (async ()=>{
      throw new Error(`No getConnection method provided in ${CONFIG_FILENAME}`);
    });
  }
}