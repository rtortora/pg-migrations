import { promises as FS } from 'fs';
import Path from 'path';
import { init } from '../src/commands/init';
import { loadConfig } from '../src/lib/config_loader';
import { DummyPgConfig } from './test_helpers/dummy_pg_config';
import { useMockFs } from './test_helpers/use_mock_fs';

jest.mock("fs");
const { workingDirectory } = useMockFs();

describe('init command', ()=>{
  test('can make a ts project', async ()=>{
    await init({
      workingDirectory,
      configType: 'ts',
      silent: true,
      libSrc: '../src/',
      pg: DummyPgConfig,
    });
    await FS.access(Path.join(workingDirectory, "migrations.config.ts"));
    await FS.access(Path.join(workingDirectory, "migrations"));
    await FS.access(Path.join(workingDirectory, "migrations/_template.ts"));

    const loaded = await loadConfig(workingDirectory);
    expect(loaded).not.toBeNull();
    expect(loaded.creation.defaultMigrationType).toBe('ts');
  });

  test('can make a js project', async ()=>{
    await init({
      workingDirectory,
      configType: 'js',
      silent: true,
      libSrc: '../src/',
      pg: DummyPgConfig,
    });
    await FS.access(Path.join(workingDirectory, "migrations.config.js"));
    await FS.access(Path.join(workingDirectory, "migrations"));
    await FS.access(Path.join(workingDirectory, "migrations/_template.js"));

    const loaded = await loadConfig(workingDirectory);
    expect(loaded).not.toBeNull();
    expect(loaded.creation.defaultMigrationType).toBe('js');
  });

  test('cannot make a sql project', async ()=>{
    await expect(init({
      workingDirectory,
      configType: 'sql',
      silent: true,
    })).rejects.toThrowError("Not implemented config type 'sql'");
  });
});
