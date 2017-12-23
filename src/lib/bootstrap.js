export default async function bootstrap(config, conn) {
  await conn.query(`
    create table if not exists "${config.migrationsTableName}" (
      "key" varchar(14) primary key not null,
      "filename" varchar(255) not null,
      "migrated_at" timestamp with time zone not null default timezone('utc'::text, now())
    );
  `);
}
