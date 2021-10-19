import { Context } from "../context";
import { loadConfig } from "./config_loader";

export async function loadContext(rootPath: string): Promise<Context> {
  const config = await loadConfig(rootPath);
  const context: Context = {
    ...config,
    rootPath,
  };
  return context;
}
