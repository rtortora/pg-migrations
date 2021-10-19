import { init } from "../../src/commands/init";
import { Context } from "../../src/context";
import { loadContext } from "../../src/lib/context_loader";
import { MigrationType } from "../../src/lib/local_migrations_map";
import TestDbConfig from '../../test_db_config';

export async function getStandardSetup({
  workingDirectory,
  configType = 'ts',
}: {
  workingDirectory: string,
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
