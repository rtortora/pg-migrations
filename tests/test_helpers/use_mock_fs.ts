import { vol, DirectoryJSON } from 'memfs';

export function useMockFs(): { workingDirectory: string }{
  beforeAll(async ()=>{
    // This is probably silly, but the first time we import this, it's
    // pretty slow, and I don't want it to show up on any timings of
    // any specific test. This is here because it's mocking FS that
    // prevents us from using dynamic import calls and instead requires
    // importing typescript and doing a live transpile of code modules
    // like a project config and migrations.
    await import("typescript");
  });

  beforeEach(async ()=>{
    try {
      vol.reset();
      vol.fromJSON({'./test/.keep': 'keep'}, '/tmp');
    } catch(error) {
      console.error(error);
      throw error;
    }
  });
  return {
    workingDirectory: '/tmp/test',
  };
}

export { fs as mockFs } from 'memfs';

export function getWorkingDirectory(): string {
  return '/tmp/test';
}

export function inspectFs(): DirectoryJSON {
  return vol.toJSON();
}
