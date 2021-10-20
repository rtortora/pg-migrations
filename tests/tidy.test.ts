import { LocalScriptMigration, MigrationType } from '../src/lib/local_migrations_map';
import { useMockFs } from './test_helpers/use_mock_fs';
import { createSimpleMigration } from './test_helpers/create_simple_migration';
import { getStandardSetup } from './test_helpers/get_standard_setup';
import { run } from '../src/commands/run';
import { closeLingeringClients, getClient } from '../src/lib/pg_client';
import { getMigrationStatusMap } from '../src/lib/migration_status_map';
import { tidy } from '../src/commands/tidy';
import Path from 'path';

jest.mock("pg");
jest.mock("fs");
const { workingDirectory } = useMockFs();

describe('up command', ()=>{
  afterEach(()=>{
    closeLingeringClients();
  });

  for (const migrationType of ['ts', 'js'] as MigrationType[]) {
    test(`can status on a ${migrationType} project`, async()=>{
      const configType = migrationType === 'sql' ? 'ts' : migrationType;
      const { context } = await getStandardSetup({ workingDirectory, configType });
      const migration1 = await createSimpleMigration({ context, migrationType,
        upSql: "create table salads (id serial primary key not null, name text not null);",
      });
      await run(context, { direction: 'up', silent: true });
      await tidy(context, { silent: true });
      const migrationStatusMap = await getMigrationStatusMap(context);
      expect(migrationStatusMap.get(migration1.key)).not.toBe(null);
      expect(migrationStatusMap.get(migration1.key)!.local).not.toBe(null);
      expect(migrationStatusMap.get(migration1.key)!.applied).not.toBe(null);

      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1);
      const expectPath = Path.join(workingDirectory, context.migrationsRelPath, `${year}${context.creation.fileNameSeperator}${month.toString().padStart(2, "0")}`, Path.basename(migration1.key) + `.${migrationType}`);
      expect((migrationStatusMap.get(migration1.key)!.local as LocalScriptMigration).path).toBe(expectPath);
    });
  }
});
