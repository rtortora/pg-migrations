import { vol, DirectoryJSON } from 'memfs';

export function useMockFs(): { workingDirectory: string }{
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
