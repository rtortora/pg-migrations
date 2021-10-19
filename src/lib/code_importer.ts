import { promises as FS } from 'fs';

export async function importCode<T = any>(pathToSrc: string): Promise<T> {
  // In actual practice we just use dynamic module loading to load a code
  // file, but I couldn't find any way to mock that for testing the library
  // itself, which sort of makes sense, so I use a more round-about way
  // that is mockable in the test environment.
  if (process.env.NODE_ENV === "test") {
    const ts = await import("typescript");
    const code = (await FS.readFile(pathToSrc)).toString();
    const transpiled = ts.transpile(code);
    const results = eval(transpiled);
    return { default: results } as unknown as T;
  } else {
    return import(pathToSrc);
  }
}
