import { promises as FS } from 'fs';
import Path from 'path';
import TestDbConfig from '../test_db_config';
import { init } from '../src/commands/init';
import { loadContext } from '../src/lib/context_loader';
import { create, generateNewMigrationKey } from '../src/commands/create';
import { Context } from '../src/context';
import { MigrationType } from '../src/lib/local_migrations_map';
import { EOL } from 'os';
import { useMockFs } from './use_mock_fs';

jest.mock("fs");
const { workingDirectory } = useMockFs();

async function getStandardSetup({
  configType = 'ts',
}: {
  configType?: MigrationType,
}): Promise<{ context: Context }> {
  await init({
    workingDirectory,
    configType,
    silent: true,
    libSrc: '../src/',
    pg: TestDbConfig,
  });
  const context = await loadContext(workingDirectory);
  return { context };
}

describe('create command', ()=>{
  for (const migrationType of ['ts'/*, 'js'*/] as MigrationType[]) {
    test(`can create a migration with ${migrationType} default`, async()=>{
      const { context } = await getStandardSetup({ configType: migrationType });
      const key = generateNewMigrationKey(context);
      await create(context, { key, name: "test", silent: true });
      await FS.access(Path.join(workingDirectory, "migrations", `${key}_test.${migrationType}`));
    });


    test(`can create a migration with ${migrationType} default using correct processed template`, async()=>{
      const { context } = await getStandardSetup({ configType: migrationType });
      await FS.writeFile(Path.join(workingDirectory, "migrations", `_template.${migrationType}`), [
        "// TEMPLATE: this line should be hidden",
        "template text",
      ].join(EOL));
      const key = generateNewMigrationKey(context);
      await create(context, { key, name: "test", silent: true });
      await FS.access(Path.join(workingDirectory, "migrations", `${key}_test.${migrationType}`));
      const content = (await FS.readFile(Path.join(workingDirectory, "migrations", `${key}_test.${migrationType}`))).toString();
      expect(content).toBe("template text");
    });

    test(`can create a migration with ${migrationType} default with no project template`, async ()=>{
      const { context } = await getStandardSetup({ configType: migrationType });
      await FS.rm(Path.join(workingDirectory, "migrations", `_template.${migrationType}`));
      const key = generateNewMigrationKey(context);
      await create(context, { key, name: "test", silent: true });
      await expect(FS.access(Path.join(workingDirectory, "migrations", `_template.${migrationType}`))).rejects.toThrowError();
      await FS.access(Path.join(workingDirectory, "migrations", `${key}_test.${migrationType}`));
      const content = (await FS.readFile(Path.join(workingDirectory, "migrations", `${key}_test.${migrationType}`))).toString();
      expect(content).not.toBe("");
    });
  }
});