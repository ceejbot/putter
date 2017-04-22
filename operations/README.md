# operations

Ansible roles for setting things up in production; bash scripts for setting things up on an OS X box.

Run `operations/bin/macos.sh` to install brew & use it to install a number of dependencies. This script will install the following
- nvm
- redis
- postgres
- nsq
- node 6 via nvm

To create databases for development, run these npm scripts:

```
npm run db:create
npm run db:up
```

For now, to run any service copy the `.env.example` file in its root directory to `.env`, edit, and then run `./bin/run-server.js <dirname>`.

The env file starts looking like this:

```
NODE_ENV=development
HOST=localhost
PORT=3000
```

Run `npm run` to get a dump of the run scripts available. All services should be runnable via an npm script. To build assets right now, run `make css` or `make js` or `make all`. (TODO only css works right now.) Assets are checked in. To run bankai in watch mode: `npm run run:bankai`.

```
Lifecycle scripts included in putter:
  test
    nyc mocha -t 10000 --check-leaks -R spec test/test-*.js

available via `npm run-script`:
  report:cov
    nyc report --reporter=text-lcov | coveralls
  run:auth
    bin/run-server.js api-auth
  run:completer
    bin/run-server.js api-completer
  run:data
    bin/run-server.js api-data
  run:static
    bin/serve-static.js
  test:cov
    nyc mocha -t 10000 --check-leaks -R spec test/test-*.js
  test:style
    xo
  test:travis
    npm run test:cov && npm run test:style
```
