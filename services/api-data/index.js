'use strict';

const
	bole   = require('bole'),
	dbconn = require('../../lib/db-conn'),
	logstr = require('common-log-string'),
	five   = require('take-five')
	;

var node;
const logger = bole('api-data');

module.exports = function createServer(nodename)
{
	// TODO this is stupid hackery; fix eventually
	process.env.PORT = process.env.PORT_DATA;
	process.env.HOST = process.env.HOST_DATA;

	node = nodename;
	const server = five();

	server.use(afterhook);
	server.use(authorize);
	server.get('/ping', handlePing);
	server.get('/status', handleStatus);

	require('./person')(server);
	require('./tokens')(server);

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

function authorize(request, response, next)
{
	if (!request.headers.authorization)
		return response.send(403, 'no authorization header');

	const [scheme, credentials] = request.headers.authorization.split(/\s+/);

	if (!scheme.match(/^bearer$/i))
		return response.send(403, 'no bearer token presented');

	if (credentials !== process.env.SHARED_SECRET)
		return response.send(403, 'bearer token is no good');

	// TODO either auth-as-user or auth-as-superuser

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
