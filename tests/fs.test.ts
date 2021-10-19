import { promises as FS } from 'fs';
import { useMockFs } from './use_mock_fs';
import Path from 'path';

jest.mock("fs");
const { workingDirectory } = useMockFs();

describe('fs testing', ()=>{
  test('can read/write files', async ()=>{
    await FS.writeFile(Path.join(workingDirectory, "test.txt"), "hello");
    const readout = (await FS.readFile(Path.join(workingDirectory, "test.txt"))).toString();
    expect(readout).toBe("hello");
  });

  test('has an empty canvas at the start of each test', async ()=>{
    const files = await FS.readdir(workingDirectory);
    expect(files).toEqual([".keep"]);
  });
});
