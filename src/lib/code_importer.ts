import Typescript from 'typescript';
import { promises as FS } from 'fs';
import Path from 'path';
import { fileExists } from '../util/file_exists';
import glob from 'glob';

// Typescript is just not working right now
// https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API#a-simple-transform-function

export async function importCode<T = any>(pathToSrc: string): Promise<T> {
  if (process.env.NODE_ENV === 'test') {
    // We always use this path in test mode because dynamic import doesn't appear
    // to be mockable
    const text = (await FS.readFile(pathToSrc)).toString();
    if (pathToSrc.endsWith(".js")) {
      const results = eval(text);
      return { default: results } as unknown as T;
    } else {
      throw new Error(`Cannot import file type ${pathToSrc}`);
    }
  } else {
    return import(pathToSrc);
  }
  /*
  if (pathToSrc.endsWith(".ts") || process.env.NODE_ENV === 'test') {
    // We always use this path in test mode because dynamic import doesn't appear
    // to be mockable
    const code = (await FS.readFile(pathToSrc)).toString();
    const tsconfig = await loadTsconfig(Path.dirname(pathToSrc));
    const currentWd = process.cwd();
    try {
      process.chdir(Path.dirname(tsconfig.path));
      const files = await getFiles(tsconfig.include || []);
      const createdFiles: Map<string, string> = new Map();
      const host = Typescript.createCompilerHost(tsconfig.compilerOptions || {});
      host.writeFile = (fileName: string, contents: string) => createdFiles.set(fileName, contents);
      const readFile: (fileName: string)=>(Promise<string>) = async (fileName: string)=>{
        console.log(`GOT HERE`, fileName);
        const buffer: Buffer = await FS.readFile(fileName);
        return buffer.toString();
      }
      //host.readFile = readFile;
      const program = Typescript.createProgram(files, tsconfig.compilerOptions || {}, host);
      console.log(program);
      const srcTarget = program.getSourceFile(pathToSrc);
      const emitResult = program.emit(srcTarget);
      console.log(emitResult);
      console.log(createdFiles);

      const evalTarget = [...createdFiles.values()][0];
      const safeEvalTarget = evalTarget.replace("exports.__esModule = true;", '');
      //console.log(`[eval target]`, safeEvalTarget);
      const results = eval(safeEvalTarget);
      //console.log(`[results]`, results);
      return { default: results } as unknown as T;
    } finally {
      process.chdir(currentWd);
    }
  } else {
    return import(pathToSrc);
  }*/
}

/*
type Tsconfig = {
  path: string,
  compilerOptions?: Typescript.CompilerOptions,
  include?: string[],
}

export async function loadTsconfig(path: string): Promise<Tsconfig> {
  if (await fileExists(Path.join(path, "tsconfig.json"))) {
    const tsconfigPath = Path.join(path, "tsconfig.json");
    const tsconfigText = (await FS.readFile(tsconfigPath)).toString();
    const tsconfigParsed = Typescript.parseConfigFileTextToJson(tsconfigPath, tsconfigText);

    if (tsconfigParsed.error) {
      //throw new Error(tsconfig.error.messageText.toString());
      throw tsconfigParsed.error;
    } else {
      const tsconfig: Tsconfig = {
        path: tsconfigPath,
        ...tsconfigParsed.config,
      };
      return tsconfig;
    }
  } else if (path === "/") {
    throw new Error(`Could not find tsconfig.json`);
  } else {
    return await loadTsconfig(Path.dirname(path));
  }
}

export async function getFiles(include: string[]): Promise<string[]> {
  let files: string[] = [];
  for (const includeLine of include) {
    files = [...files, ...(await new Promise<string[]>((resolve, reject)=>{
      glob(includeLine, {}, (err, files)=>{
        if (err) { reject(err); }
        else { resolve(files); }
      });
    }))];
  }
  return files;
}
*/