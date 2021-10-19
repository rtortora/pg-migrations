import Path from 'path';
import { promises as FS } from 'fs';
import { fileExists } from '../util/file_exists';
import { getLocalMigrationsMap, MigrationType } from '../lib/local_migrations_map';
import { Context } from '../context';
import { DefaultTemplateByType } from '../lib/default_templates';
import { RunDirection } from '../lib/run_local_migration';
import { removeLines } from '../util/remove_lines';

export type CreateArgs = {
  key?: string,
  name?: string,
  type?: MigrationType,
  silent?: boolean,
};

export async function create(context: Context, args: CreateArgs = {}) {
  const key = args.key || generateNewMigrationKey(context);
  const existing = await getLocalMigrationsMap(context);
  if (existing.has(key)) {
    throw new Error(`${args.key ? 'Key' : 'Generated key'} "${key}" is already in use${args.key ? '' : ', try again'}`);
  }

  args.type = args.type || context.creation.defaultMigrationType;
  if (args.type === "sql") {
    for (const direction of ["up", "down"] as RunDirection[]) {
      const filePath = getMigrationPath({ context, key, name: args.name, type: args.type, direction });
      const body = await getNewMigrationBody(context, args.type, direction);
      await FS.writeFile(filePath, body || "");
      if (!args.silent) {
        console.log(`Created ${filePath}`);
      }
    }
  } else {
    const filePath = getMigrationPath({ context, key, name: args.name, type: args.type });
    const body = await getNewMigrationBody(context, args.type);
    await FS.writeFile(filePath, body || "");
    if (!args.silent) {
      console.log(`Created ${filePath}`);
    }
  }
}

export function generateNewMigrationKey(context: Context) {
  let dateStr = (new Date()).toISOString();
  const match = dateStr.match(/^(?<year>\d\d\d\d)-(?<month>\d\d)-(?<day>\d\d)T(?<hour>\d\d):(?<minute>\d\d):(?<second>\d\d)\..*$/);
  if (!match) {
    throw new Error(`Could not parse ISO date string for key generation: '${dateStr}'`);
  }
  const {
    year,
    month,
    day,
    hour,
    minute,
    second,
  } = match.groups as {[key: string]: string};
  if (context.creation.includeSecondsInKeys) {
    return [year, month, day, hour, minute, second].join('');
  } else {
    return [year, month, day, hour, minute].join('');
  }
}

function getMigrationPath({
  context,
  key,
  name,
  type,
  direction,
}: {
  context: Context,
  key: string,
  name?: string,
  type: MigrationType,
  direction?: RunDirection,
}): string {
  const fileName = [key, name, direction].filter((part)=>(!!part)).join(context.creation.fileNameSeperator) + `.${type}`;
  const filePath = Path.join(context.rootPath, context.migrationsRelPath, fileName);
  return filePath;
}

async function getNewMigrationBody(context: Context, type: MigrationType, direction?: RunDirection): Promise<string | null> {
  const templatePath = Path.join(context.rootPath, context.migrationsRelPath, `_template${direction ? `${context.creation.fileNameSeperator}${direction}` : ''}.${type}`);

  let bodyText: string | null;
  if (await fileExists(templatePath)) {
    bodyText = (await FS.readFile(templatePath)).toString();
  } else {
    bodyText = DefaultTemplateByType[type];
  }

  if (bodyText) {
    return removeLines(context, bodyText, (line)=>(/^ *\/\/ *TEMPLATE:/i.test(line)));
  } else {
    return null;
  }
}
