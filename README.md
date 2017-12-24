# pg-migrations

Are you using node-postgres and find [node-pg-migrate](https://github.com/salsita/node-pg-migrate) too much of a whole thing? Then maybe this is for you!

Nota Bene: You should probably just use [node-pg-migrate](https://github.com/salsita/node-pg-migrate) instead.

## Installation

For these installation steps, I'm assuming you're using yarn and ES2015+ with async/await and import/export.

First install the library:

    yarn add git+ssh://git@github.com/rtortora/pg-migrations#stable

Then add this to the commands in your `package.json`:

```json
{
  commands: {
    "migrate": "node_modules/.bin/pg-migrations"
  }
}
```

Then run `yarn migrate init` to create a skeleton config file which looks like so:

```js
export default {
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
export default {
  up: async (pg)=>{
    // do whatever
  },
  down: async (pg)=>{
    // do whatever
  },
};
```

Note that any string can follow after or before the datetime, so you are free to name your files anything.

## Operating Migrations

To see the status of all migrations, run:

   yarn migrate status

To run all outstanding migrations, run:

    yarn migrate up

To undo the most recent migration, run:

    yarn migrate down

To run a specific migration up or down, run:

    yarn migrate (datetime) up/down

For any up/down, you can --dryrun to see what files it will run first.

## Transactional Safety

All migrations are run in a transaction. If any fail, it rolls the transaction back, and stops what it's doing.

## Concurrency

pg-migrations uses advisory locks to ensure that multiple instances of your app won't run the same migrations at the same time (for multi-server deployments). That being said, it's not super tested.
