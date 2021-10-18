import type { Client } from "pg";

export type MigrationModule = {
  up?: (pg: Client)=>(Promise<void>),
  down?: (pg: Client)=>(Promise<void>),
};

export function isMigrationModule(obj: any): obj is MigrationModule {
  return obj &&
    ((obj.up && typeof(obj.up) === 'function') || (obj.down && typeof(obj.down) === 'function')) &&
    (!obj.up || typeof(obj.up) === 'function') &&
    (!obj.down || typeof(obj.down) === 'function')
    ;
}
