import { MigrationType } from "../lib/local_migrations_map";

export const DefaultTemplateByType: {[type in MigrationType]: string | null} = {
  ts: `// TEMPLATE: This file is the default starting point for newly created migrations.
// TEMPLATE: Any comment starting with the text 'TEMPLATE:' is not copied.
import { MigrationModule } from 'pg-migrations';

const migration: MigrationModule = {
  up: async (pg)=>{
    await pg.query(\`
    \`);
  },
  down: async (pg)=>{
    await pg.query(\`
    \`);
  },
}

export default migration;
`,

  js: `// TEMPLATE: This file is the default starting point for newly created migrations.
// TEMPLATE: Any comment starting with the text 'TEMPLATE:' is not copied.
module.exports = {
  up: async (pg)=>{
    await pg.query(\`
    \`);
  },
  down: async (pg)=>{
    await pg.query(\`
    \`);
  },
}`,

  sql: null,
};
