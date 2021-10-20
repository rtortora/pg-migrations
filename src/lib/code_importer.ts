import Typescript from 'typescript';
import { promises as FS } from 'fs';
import Path from 'path';
import { fileExists } from '../util/file_exists';

export async function importCode<T = any>(pathToSrc: string): Promise<T> {
  if (process.env.NODE_ENV === 'test') {
    // In actual practice we just use dynamic module loading to load a code
    // file, but I couldn't find any way to mock that for testing the library
    // itself, which sort of makes sense, so I use a more round-about way
    // that is mockable in the test environment.
    // NOTE: this method doesn't work super well if the pathToSrc file is
    // including other local files
    const code = (await FS.readFile(pathToSrc)).toString();
    const compilerOptions = await findCompilerOptions(Path.dirname(pathToSrc));
    const transpiled = Typescript.transpile(code, compilerOptions);
    const results = eval(transpiled);
    return { default: results } as unknown as T;
  } else {
    return await import(pathToSrc);
  }
}

// TODO RT: this isn't really needed for testing and is only called during testing, maybe remove this?
export async function findCompilerOptions(path: string): Promise<Typescript.CompilerOptions | undefined> {
  if (await fileExists(Path.join(path, "tsconfig.json"))) {
    const tsconfigPath = Path.join(path, "tsconfig.json");
    const tsconfigText = (await FS.readFile(tsconfigPath)).toString();
    const tsconfig = Typescript.parseConfigFileTextToJson(tsconfigPath, tsconfigText);
    if (tsconfig.error) {
      throw new Error(tsconfig.error.messageText.toString());
    } else {
      return tsconfig.config.compilerOptions;
    }
  } else if (path === "/") {
    return undefined;
  } else {
    return await findCompilerOptions(Path.dirname(path));
  }
}
