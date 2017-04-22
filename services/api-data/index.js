require('dotenv').config({path: `${__dirname}/.env`, silent: true});
const
	bole   = require('bole'),
	logstr = require('common-log-string'),
	five   = require('take-five')
	;

var node;
const logger = bole('api-data');

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

/*

var APIServer = module.exports = function APIServer(options)
{
	assert(options, 'you must pass an options object to the constructor');
	assert(options.hasOwnProperty('path') && _.isString(options.path), 'you must pass a `path` to mount the route on in the options');

	this.options = options;
	this.rules = options.rules;
	this.logger = bole('data');

	this.server = restify.createServer(options);
	this.server.use(restify.bodyParser());
	this.server.use(restify.queryParser());
	this.server.on('after', this.logEachRequest.bind(this));

	this.server.get(options.path + '/api/1/data/ping', this.handlePing.bind(this));
	this.server.get(options.path + '/api/1/data/status', this.handleStatus.bind(this));
};
*/
