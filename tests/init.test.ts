import { promises as FS } from 'fs';
import Path from 'path';
import { init } from '../src/commands/init';
import { loadConfig } from '../src/lib/config_loader';
import { DummyPgConfig } from './test_helpers/dummy_pg_config';
import { useMockFs } from './test_helpers/use_mock_fs';

jest.mock("fs");
const { workingDirectory } = useMockFs();

describe('init command', ()=>{
  test('can make a new project', async ()=>{
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
});
