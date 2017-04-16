require('dotenv').config({path: `${__dirname}/.env`, silent: true});
const
	bole   = require('bole'),
	five   = require('take-five'),
	logstr = require('common-log-string')
	;

var node;
const logger = bole('api-auth');

module.exports = function createServer(nodename)
{
	node = nodename;
	const server = five();
	server.use(afterhook);

	server.get('/ping', handlePing);
	server.get('/status', handleStatus);

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
		node,
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
