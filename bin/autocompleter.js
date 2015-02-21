#!/usr/bin/env node

var
    assert = require('assert'),
    bole   = require('bole'),
    Server = require('../autocomplete')
    ;

require('toml-require').install();

var config = require('../config/autocomplete.toml');

if (process.env.PORT)
    config.port = process.env.PORT;

var logger = bole('wrapper');
var outputs = [];
if (process.env.NODE_ENV === 'dev')
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
    logger.info('autocomplete service started at ' + config.host + ':' + config.port);
});
