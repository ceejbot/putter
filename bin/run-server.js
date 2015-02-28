#!/usr/bin/env node

var
    assert = require('assert'),
    bole   = require('bole'),
    path   = require('path'),
    argv   = require('yargs')
        .usage('run-server --node <nodename> <servertype>')
        .demand(1)
        .alias('n', 'node')
        .describe('n', 'a name for this node')
        .help('h')
        .alias('h', 'help')
        .argv
    ;

require('toml-require').install();
var type = argv._[0];
var segment = 'api-' + type;
var Server = require(path.join('..', segment));
var config = require(path.join(__dirname, '..', 'config', segment + '.toml'));
if (argv.n) config.name = argv.n;

if (process.env.PORT)
    config.port = process.env.PORT;

var logger = bole('wrapper');
var outputs = [];
if (process.env.NODE_ENV && process.env.NODE_ENV.match(/^dev/))
{
	var prettystream = require('bistre')({time: true});
	prettystream.pipe(process.stdout);
	outputs.push({ level:  'debug', stream: prettystream });
}
else
	outputs.push({level: 'info', stream: process.stdout});
bole.output(outputs);

var server = new Server(config);
server.listen(config.port, config.host, function()
{
    logger.info('data api service started at ' + config.host + ':' + config.port);
});
