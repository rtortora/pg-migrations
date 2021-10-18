import type { MigrationModule } from './migration_module';

export type RegisteredMigration = {
  /**
   * Set to __filename
   */
   __filename: string,
} & MigrationModule;

export function registerMigration(migration: MigrationModule) {
}
