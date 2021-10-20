import type { Client } from "pg";

export type Migration = {
  up?: (pg: Client)=>(Promise<void>),
  down?: (pg: Client)=>(Promise<void>),
};

export function isMigration(obj: any): obj is Migration {
  return obj &&
    ((obj.up && typeof(obj.up) === 'function') || (obj.down && typeof(obj.down) === 'function')) &&
    (!obj.up || typeof(obj.up) === 'function') &&
    (!obj.down || typeof(obj.down) === 'function')
    ;
}
