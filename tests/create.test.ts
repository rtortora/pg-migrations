import { promises as FS } from 'fs';
import Path from 'path';
import TestDbConfig from '../test_db_config';
import { init } from '../src/commands/init';
import { loadContext } from '../src/lib/context_loader';
import { create, generateNewMigrationKey } from '../src/commands/create';
import { Context } from '../src/context';
import { MigrationType } from '../src/lib/local_migrations_map';
import { EOL } from 'os';
import { useMockFs } from './test_helpers/use_mock_fs';
import { getStandardSetup } from './test_helpers/get_standard_setup';

jest.mock("fs");
const { workingDirectory } = useMockFs();

describe('create command', ()=>{
  for (const migrationType of ['ts', 'js'] as MigrationType[]) {
    test(`can create a migration with ${migrationType} default`, async()=>{
      const { context } = await getStandardSetup({ workingDirectory, configType: migrationType });
      const key = generateNewMigrationKey(context);
      await create(context, { key, name: "test", silent: true });
      await FS.access(Path.join(workingDirectory, "migrations", `${key}_test.${migrationType}`));
    });

    test(`can create a migration with ${migrationType} default using correct processed template`, async()=>{
      const { context } = await getStandardSetup({ workingDirectory, configType: migrationType });
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
      const { context } = await getStandardSetup({ workingDirectory, configType: migrationType });
      await FS.rm(Path.join(workingDirectory, "migrations", `_template.${migrationType}`));
      const key = generateNewMigrationKey(context);
      await create(context, { key, name: "test", silent: true });
      await expect(FS.access(Path.join(workingDirectory, "migrations", `_template.${migrationType}`))).rejects.toThrowError();
      await FS.access(Path.join(workingDirectory, "migrations", `${key}_test.${migrationType}`));
      const content = (await FS.readFile(Path.join(workingDirectory, "migrations", `${key}_test.${migrationType}`))).toString();
      expect(content).not.toBe("");
    });

    test(`can create a migration with ${migrationType} and autotidy on`, async ()=>{
      const { context } = await getStandardSetup({
        workingDirectory,
        configType: migrationType,
        creation: {
          autoTidy: true,
        },
      });
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1);
      const key = generateNewMigrationKey(context, now);
      await create(context, { key, name: "test", silent: true });
      await FS.access(Path.join(workingDirectory, "migrations", `${year}${context.creation.fileNameSeperator}${month.toString().padStart(2, "0")}`, `${key}_test.${migrationType}`));
    });

    test(`can create a migration with a type other than ${migrationType} in a ${migrationType} project`, async ()=>{
      const swap: {[key in MigrationType]?: MigrationType} = { ts: 'js', js: 'ts' };
      const swapped = swap[migrationType]!;
      const { context } = await getStandardSetup({ workingDirectory, configType: migrationType });
      const key = generateNewMigrationKey(context);
      await create(context, { key, name: "test", type: swapped, silent: true });
      await FS.access(Path.join(workingDirectory, "migrations", `${key}_test.${swapped}`));
    });
  }
});