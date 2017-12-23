# pg-migrations

Do you hate Sequelize, use node-postgres like a civilized human being, and find node-postgres-migration too much of a whole thing? Then buckle up.

## Installation

For these installation steps, I'm assuming you're using yarn and ES2015.

First install the library:

    yarn add git+ssh://git@github.com/rtortora/pg-migrations#stable

Then make a config file in the root of your directory called migrations.js like so:

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

Lastly, add this to the commands in your `package.json`:

```json
{
  commands: {
    "migrate": "node_modules/.bin/pg-migrations"
  }
}
```

## Adding migrations

Run this:

    yarn migrate create

Which will create a blank migration at ./migrations/(datetime).js, looking something like this:

```js
export default {
  up: async (pg)=>{
    // do whatever
  },
  down: async(pg)=>{
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

