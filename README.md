# pg-migrations

Are you using node-postgres and find [node-pg-migrate](https://github.com/salsita/node-pg-migrate) too much of a whole thing? Then maybe this is for you!

Nota Bene: You should probably just use [node-pg-migrate](https://github.com/salsita/node-pg-migrate) instead.

All migrations are run in a transaction. If any fail, it rolls the transaction back, and stops what it's doing.

pg-migrations uses advisory locks to ensure that multiple instances of your app won't run the same migrations at the same time (for multi-server deployments). That being said, it's not super tested.

## Installation

For these installation steps, I'm assuming you're using yarn and ES2015+ with async/await and import/export.

First install the library:

    yarn add git+ssh://git@github.com/rtortora/pg-migrations#stable

Then add this to the commands in your `package.json`:

```json
{
  "scripts": {
    "migrate": "node_modules/.bin/pg-migrations"
  }
}
```

If you are using typescript, make sure you have ts-node in your development dependencies, then instead add this to your commands in your `package.json`:

```json
{
  "scripts": {
    "migrate": "node_modules/.bin/pg-migrations-ts"
  }
}
```

Then run `yarn migrate init` to create a skeleton config file which looks like so:

```js
module.exports = {
  migrationsTableName: "migrations",
  migrationsPath: "./migrations/",
  getConnection: async ()=>{
    const pg = /* do stuff to get a single pg client to your database */
    return pg;
  }
}
```

Lastly, provide an implementation for the `getConnection` function. You can import any parts of your app to do so!

## Adding migrations

Run this:

    yarn migrate create

Which will create a blank migration at ./migrations/(datetime).js, looking something like this:

```js
module.exports = {
  up: async (pg)=>{
    // do whatever
  },
  down: async (pg)=>{
    // do whatever
  },
};
```

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
