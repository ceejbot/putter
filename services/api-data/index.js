'use strict';

const
	bole   = require('bole'),
	dbconn = require('../../lib/db-conn'),
	logstr = require('common-log-string'),
	five   = require('take-five'),
	Person = require('../../lib/models/person')
	;

var node;
const logger = bole('api-data');

module.exports = function createServer(nodename)
{
	process.env.PORT = process.env.PORT_DATA;
	node = nodename;
	const server = five();

	server.use(afterhook);
	server.get('/ping', handlePing);
	server.get('/status', handleStatus);

	require('./routes-user')(server);

	dbconn();

	return server;
};

function handlePing(request, response, next)
{
	response.send(200, 'OK');
	next();
}

function handleStatus(request, response, next)
{
	var status = {
		pid:     process.pid,
		uptime:  process.uptime(),
		rss:     process.memoryUsage(),
		node:    node || 'api-data',
	};
	response.send(200, status);
	next();
}

function afterhook(request, response, next)
{
	request.on('end', () =>
	{
		response._time = Date.now();
		logger.info(logstr(request, response));
	});
	next();
}
