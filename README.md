# pg-migrations

A simple postgresql migration management tool.

Features:

* Migrations can be written in TypeScript, Javascript, or raw SQL. SQL migrations allow you to benefit from proper SQL color highlighting in your favorite editor.
* Migrations can be arbitarily nested into subfolders, and pg-migrations has a 'tidy' tool that will automatically group migrations by year and month and an option to automatically tidy newly created migrations.
* Easily controlled template for new migrations.
* Advisory locks are used to ensure that multiple instances of your app won't run the same migrations at the same time (for multi-server deployments).
* All migrations are run in a transaction. If any fail, it rolls the transaction back, and stops what it's doing.

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

# Development

