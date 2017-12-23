/**
 * Represents a migration.
 * @typedef {object} Migration
 * @property {string} filename
 * @property {string} path
 * @property {string} key
 */
export default class Migration {
  constructor(data) {
    this.filename = data.filename;
    this.path = data.path;
    this.key = data.key;
  }
}