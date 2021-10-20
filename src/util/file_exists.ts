import { promises as fs, constants as fsConstants } from 'fs';

export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path, fsConstants.F_OK);
    return true;
  } catch(error) {
    return false;
  }
}
