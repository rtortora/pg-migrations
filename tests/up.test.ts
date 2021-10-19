import { MigrationType } from '../src/lib/local_migrations_map';
import { useMockFs } from './test_helpers/use_mock_fs';
import { createSimpleMigration } from './test_helpers/create_simple_migration';
import { getStandardSetup } from './test_helpers/get_standard_setup';
import { run } from '../src/commands/run';
import { closeLingeringClients, getClient } from '../src/lib/pg_client';
import { execSync } from 'child_process';

jest.mock("fs");
const { workingDirectory } = useMockFs();

describe('up command', ()=>{
  beforeEach(()=>{
    execSync("dropdb pgm_test && createdb pgm_test --owner=pgm");
  });

  afterEach(()=>{
    closeLingeringClients();
  });

  for (const migrationType of ['ts'] as MigrationType[]) {
    test(`can run up on a migration with ${migrationType}`, async()=>{
      const { context } = await getStandardSetup({ workingDirectory, configType: migrationType });
      await createSimpleMigration({
        context,
        migrationType,
        upSql: "create table salads (id serial primary key not null, name text not null);",
      });
      await run(context, {
        direction: 'up',
        silent: true,
      });
      const pg = await getClient(context);
      await pg.query(`insert into salads (name) values ('caesar')`);
    });
  }
});
