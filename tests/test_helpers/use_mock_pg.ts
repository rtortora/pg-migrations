import { closeLingeringClients } from '../../src/lib/pg_client';

export function useMockPg() {
  afterEach(()=>{
    closeLingeringClients();
  });
}
