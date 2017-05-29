'use strict';

const
	assert    = require('assert'),
	async     = require('async'),
	bole      = require('bole'),
	completer = require('prefix-completer'),
	five      = require('take-five'),
	logstr    = require('common-log-string')
	;

const logger = bole('completer');
var tags, fandoms, people;

module.exports = function createServer(nodename)
{
	// TODO this is stupid hackery; fix eventually
	process.env.PORT = process.env.PORT_COMPLETER;
	process.env.HOST = process.env.HOST_COMPLETER;

	// TODO put this config into env vars
	tags = completer.create({
		db: 1,
		key: 't:',
		redis: process.env.REDIS,
	});
	fandoms = completer.create({
		db: 2,
		key: 'f:',
		redis: process.env.REDIS,
	});
	people = completer.create({
		db: 3,
		key: 'p:',
		redis: process.env.REDIS,
	});

	const server = five();

	server.use(afterhook);
	server.get('/ping', handlePing);
	server.get('/status', handleStatus);

	server.get('/api/1/ac/fandoms/:q', handleFandom);
	server.get('/api/1/ac/tags/:q', handleTag);
	server.get('/api/1/ac/people/:q', handlePerson);

	return server;
};

function handlePing(request, response, next)
{
	response.send(200, 'OK');
	next();
}

function handleStatus(request, response, next)
{
	const status = {
		pid   : process.pid,
		uptime: process.uptime(),
		rss   : process.memoryUsage(),
		node  : 'api-completer',
	};

	const actions = {
		tags   : cb => { tags.statistics(cb); },
		fandoms: cb => { fandoms.statistics(cb); },
		people : cb => { people.statistics(cb); },
	};

	async.parallel(actions, (err, results) =>
	{
		if (err)
		{
			status.warning = err.message;
			logger.error('problem contacting redis to get completer stats');
			logger.error(err);
		}
		else
		{
			status.tags = results.tags;
			status.fandoms = results.fandoms;
			status.people = results.people;
		}

		response.send(200, status);
		next();
	});
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

function handleTag(request, response, next)
{
	if (!request.urlParams.q)
	{
		response.send(200, []);
		return next();
	}

	var prefix = request.urlParams.q.trim();
	var decorate = false;
	if (prefix.match(/^#/))
	{
		prefix = prefix.replace(/^#/, '');
		decorate = true;
	}

	tags.complete(prefix, 15, (err, prefix, completions) =>
	{
		if (err)
		{
			logger.error('tags autompletion error');
			logger.error(err);
			response.send(200, []);
		}
		else
		{
			if (decorate)
				completions = completions.map(function(item) { return '#' + item; });
			response.send(200, completions);
		}

		next();
	});
}

function handleFandom(request, response, next)
{
	if (!request.urlParams.q)
	{
		response.send(200, []);
		return next();
	}

	var prefix = request.urlParams.q.trim();
	var decorate = false;
	if (prefix.match(/^\(/))
	{
		prefix = prefix.replace(/^\(/, '');
		decorate = true;
	}

	fandoms.complete(prefix, 15, (err, prefix, completions) =>
	{
		if (err)
		{
			logger.error('people autompletion error');
			logger.error(err);
			response.send(200, []);
		}
		else
		{
			if (decorate)
				completions = completions.map(item => { return '(' + item + ')'; });
			response.send(200, completions);
		}

		next();
	});
}

function handlePerson(request, response, next)
{
	if (!request.urlParams.q)
	{
		response.send(200, []);
		return next();
	}

	var prefix = request.urlParams.q.trim();
	var decorate = false;
	if (prefix.match(/^@/))
	{
		prefix = prefix.replace(/^@/, '');
		decorate = true;
	}

	people.complete(prefix, 15, (err, prefix, completions) =>
	{
		if (err)
		{
			logger.error('people autompletion error');
			logger.error(err);
			response.send(200, []);
		}
		else
		{
			if (decorate)
				completions = completions.map(item => { return '@' + item; });
			response.send(200, completions);
		}

		next();
	});
}
