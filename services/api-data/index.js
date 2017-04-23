'use strict';

const
	bole   = require('bole'),
	logstr = require('common-log-string'),
	five   = require('take-five'),
	Person  = require('../../lib/models/person')
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
	server.post('/v1/users/user/:user/login', postLogin);
	server.post('/v1/users/user', postUser);

	// TODO configure the database etc

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

// TODO start breaking out into separate files
function postUser(request, response, next)
{
	response.send(501, 'not implemented');
	next();
}

function postLogin(request, response, next)
{
	Person.authenticate({
		email: request.body.email,
		password: request.body.password
	}).then(answer =>
	{
		if (answer === 'no')
		{
			// failure
			// WWW-Authenticate required
			response.send(401, 'failed');
		}
		else if (answer === 'otp_required')
		{
			// prompt for otp using WWW-Authenticate
			response.send(401, 'need otp');
		}
		else if (answer instanceof Person)
		{
			// we got a person back!
			// save a login session etc etc
			// redirect to home page
		}
		next();
	});
}
