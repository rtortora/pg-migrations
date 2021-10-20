# pg-migrations

A simple postgresql migration management tool for PostgreSQL with a focus on providing low-friction raw SQL migration file management.

Features:

* Migrations can be written in TypeScript, Javascript, or raw SQL. SQL migrations allow you to benefit from proper SQL color highlighting in your favorite editor.
* Migrations can be arbitarily nested into subfolders, and pg-migrations has a 'tidy' tool that will automatically group migrations by year and month and an option to automatically tidy newly created migrations.
* Easily controlled template for new migrations.
* Advisory locks are used to ensure that multiple instances of your app won't run the same migrations at the same time (for multi-server deployments).
* All migrations are run in a transaction. If any fail, it rolls the transaction back, and stops what it's doing.

Motivations:

A little bit on why this library exists, not relevant to understanding how to use it.

* While many migration tools allow for raw SQL, the vast majority have their own API and raw SQL is an afterthought. This tool provides low-friction raw SQL access using the pg gem directly, and even allows literal .sql files to serve as migrations. This allows you to write migrations without having to learn and later remember some tool-specific API.
* When a project gets old, the migrations folder tends to get out of control with too many files. This tool allows you to move local migration files without incurring them to re-run, as long as the filename itself remains unchanged. This tool also provides a `tidy` command to automatically organize your migrations, and an `autoTidy` project configuration option.
* Some migration tools don't have an automatic mechanism to prevent multiple migration attempts from running at the same time, and some don't run in a transaction, which can make production deployment scary. This tool uses pg_advisory_lock by default to ensure only one 'up/down' can run at a time, and always puts migrations in a transaction.

## Installation

Install the library:

    yarn add git+ssh://git@github.com/rtortora/pg-migrations#stable

Then add this to the commands in your `package.json`:

```json
{
  "scripts": {
    "migrate": "node_modules/.bin/pg-migrations"
  }
}
```

Then run `yarn migrate init` to create a skeleton config file and migrations folder. Edit the resulting migrations.config.ts/js to include your postgresql connection information.

## Adding migrations

Run this:

    yarn migrate create --name some_name

Which will create a blank migration at ./migrations/(datetime)_some_name.js.

Note that any string can follow after the datetime, so you are free to name your files anything. If you want to add a postfix in the create command, you can do `yarn migrate create postfix-here` or `yarn migrate create --name postfix-here`.

## Tidying Up

Once you've got a lot of migrations, it can be kind of annoying to have a folder with a thousand migrations in it. This library supports any number of subfolders in the migrations folder, so you can organize them however you like. The names of the subfolders don't matter, it always uses the filename's timestamp to order the resulting migrations.

Additionally, if you run:

    yarn migrate tidy

Then it will move all migrations in the root migration folder into subfolders based on the year and month of their timestamp.

## Operating Migrations

To see the status of all migrations, run:

   yarn migrate status

To run all outstanding migrations in order of the datetime field in the filename, run:

    yarn migrate up

To undo the most recent migration as determined by the time of migration (not the datetime field in the filename), run:

    yarn migrate down

To run a specific migration up or down, run:

    yarn migrate up/down (datetime)

For any up/down, you can --dryrun to see what files it will run first.

