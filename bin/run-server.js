#!/usr/bin/env node

const
	bole = require('bole'),
	path = require('path');

const argv = require('yargs')
		.usage('run-server --node <nodename> <servertype>')
		.demand(1)
		.alias('n', 'node')
		.describe('n', 'a name for this node')
		.help('h')
		.alias('h', 'help')
		.example('run-server --node auth1 api-auth', 'run an auth server named auth1')
		.argv;

const kind =  argv._[0];
const createServer = require(path.join('..', kind));

const logger = bole('wrapper');
const outputs = [];
if (/^dev/.test(process.env.NODE_ENV))
{
	var prettystream = require('bistre')({time: true});
	prettystream.pipe(process.stdout);
	outputs.push({ level:  'debug', stream: prettystream });
}
else
	outputs.push({level: 'info', stream: process.stdout});
bole.output(outputs);

const server = createServer(argv.node);
server.listen(process.env.PORT, process.env.HOST, () =>
{
	logger.info(`${kind} service started at ${process.env.HOST}:${process.env.PORT}`);
});
