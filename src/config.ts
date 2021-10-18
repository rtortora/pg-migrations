import type { MigrationType } from './lib/local_migrations_map';

export type Config = {
  /**
   * Path to the folder that will contain migrations, relative to the project root.
   * Default value: "./migrations"
   */
  migrationsRelPath?: string,

  /**
   * Table name that pg-migrations can create and own in order to track the status of migrations.
   * Default value: "migrations"
   */
  migrationsTableName?: string,

  /**
   * If true, newly created migrations will automatically be put into a YEAR-MONTH
   * subfolder to keep migrations tidy. Whether or not this setting is true, the
   * pg-migrations tidy command can do this at any time in the future.
   * Default value: false
   */
  autoTidyNewMigrations?: boolean,

  /**
   * The default migration type when creating a new migration. Type can be overridden
   * at time of migration creation.
   * Default value: "sql"
   */
  defaultMigrationType?: MigrationType,

  /**
   * PG connection settings
   */
  pg: {
    database: string,

    user?: string,

    /**
     * Default value: "localhost"
     */
    host?: string,

    /**
     * Password can also be provided with the PGPASSWORD environment variable.
     */
    password?: string,

    /**
     * Default value: 5432
     */
    port?: number,
  },
};
