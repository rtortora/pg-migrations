import { init } from "../../src/commands/init";
import { CreationConfig } from "../../src/config";
import { Context } from "../../src/context";
import { loadContext } from "../../src/lib/context_loader";
import { MigrationType } from "../../src/lib/local_migrations_map";
import TestDbConfig from '../../test_db_config';

export async function getStandardSetup({
  workingDirectory,
  configType = 'ts',
  creation,
}: {
  workingDirectory: string,
  configType?: MigrationType,
  creation?: CreationConfig,
}): Promise<{ context: Context }> {
  await init({
    workingDirectory,
    configType,
    silent: true,
    libSrc: '../src/',
    pg: TestDbConfig,
    creation,
  });
  const context = await loadContext(workingDirectory);
  return { context };
}
