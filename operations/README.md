# running it

Ansible roles for setting things up in production; bash scripts for setting things up on an OS X box.

Run `operations/bin/macos.sh` to install brew & use it to install a number of dependencies. This script will install the following
- nvm
- redis
- postgres
- nsq
- node 6 via nvm

To configure your development services, copy the `.env.example` file in the project root to `.env` and edit. In particular, generate some long random secrets. Then you can use any of the the `npm run run:<name>` scripts. Run `npm run` to get a dump of the other run scripts available. All services should be runnable via an npm script.

To create databases for development, run these npm scripts:

```
npm run db:create
npm run db:up
```

To create a new database migration: `npm run db:migration -- create <name>`. Then edit the newly-generated file in the `migrations/` directory.

To build assets for deploy, run `make css` or `make js` or `make all`. Compiled assets are committed to the `public/` directory. To run bankai in watch mode: `npm run run:bankai`.

To get a working development service cluster, create three terminal windows & run these npm scripts:

```
npm run run:web
npm run run:bankai
npm run run:data
```
