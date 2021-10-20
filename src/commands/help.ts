import { promises as FS } from 'fs';
import Path from 'path';

export async function help() {
  const helpContent = (await FS.readFile(Path.join(__dirname, "../../usage.md"))).toString();
  console.log(helpContent);
}
