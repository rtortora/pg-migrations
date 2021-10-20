import { MigrationType } from '../src/lib/local_migrations_map';
import { useMockFs } from './test_helpers/use_mock_fs';
import { createSimpleMigration } from './test_helpers/create_simple_migration';
import { getStandardSetup } from './test_helpers/get_standard_setup';
import { run } from '../src/commands/run';
import { closeLingeringClients, getClient } from '../src/lib/pg_client';
import { useMockPg } from './test_helpers/use_mock_pg';
import { getMigrationStatusMap } from '../src/lib/migration_status_map';
import { status } from '../src/commands/status';

jest.mock("pg");
useMockPg();

jest.mock("fs");
const { workingDirectory } = useMockFs();

describe('up command', ()=>{
  afterEach(()=>{
    closeLingeringClients();
  });

  for (const migrationType of ['ts', 'js', 'sql'] as MigrationType[]) {
    test(`can status on a ${migrationType} project`, async()=>{
      const configType = migrationType === 'sql' ? 'ts' : migrationType;
      const { context } = await getStandardSetup({ workingDirectory, configType });
      const migration1 = await createSimpleMigration({ context, migrationType,
        upSql: "create table salads (id serial primary key not null, name text not null);",
      });
      const migration2 = await createSimpleMigration({ context, migrationType,
        key: (parseInt(migration1.key) + 1).toString(),
        upSql: "insert into salads (name) values ('caesar');",
      });
      await run(context, { direction: 'up', key: migration1.key, silent: true });
      const migrationStatusMap = await getMigrationStatusMap(context);
      expect(migrationStatusMap.get(migration1.key)).not.toBe(null);
      expect(migrationStatusMap.get(migration2.key)).not.toBe(null);
      expect(migrationStatusMap.get(migration1.key)!.local).not.toBe(null);
      expect(migrationStatusMap.get(migration1.key)!.applied).not.toBe(null);
      expect(migrationStatusMap.get(migration2.key)!.local).not.toBe(null);
      expect(migrationStatusMap.get(migration2.key)!.applied).toBe(null);
      await status(context, { silent: true });
    });
  }
});
