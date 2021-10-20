Show migration status:

    yarn migrate status

Run all migrations up which have not been run yet:

    yarn migrate up

Run the most recent migration down, as sorted by key:

    yarn migrate down

Run a specific migration up or down:

    yarn migrate up --key=<key>
    yarn migrate down --key=<key>

Create a new migration, all arguments are optional:

    yarn create --name <file_name> --type <ts/js>

Tidy up migrations on disk:

    yarn migrate tidy
