import { Context } from "../context";

export function removeLines(context: Context, text: string, removalQualifier: (line: string)=>(boolean)): string {
  return text.split(/\r?\n/).filter((line: string)=>(!removalQualifier(line))).join(context.creation.lineEndings);
}
