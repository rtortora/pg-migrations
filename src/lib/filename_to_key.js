/**
 * Given a filename of a migration, e.g., 201701301015.js or 201701301015_my_migration.js or my_migration_201701301015.js, returns the key of the migration, e.g., the date time field, 201701301015.
 * @param {string} filename
 * @return {string}
 */
export default function filenameToKey(filename) {
  const match = filename.match(/([0-9]{12,14})/);
  if (match) {
    return match[1];
  } else {
    return null;
  }
}