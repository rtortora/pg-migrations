import Typescript from 'typescript';
import { promises as FS } from 'fs';

export async function importCode<T = any>(pathToSrc: string): Promise<T> {
  const code = (await FS.readFile(pathToSrc)).toString();
  const transpiled = Typescript.transpile(code);
  const results = eval(transpiled);
  return { default: results } as unknown as T;
}
