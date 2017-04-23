'use strict';

// TODO won't run at all yet

const
	_         = require('lodash'),
	async     = require('async'),
	assert    = require('assert'),
	bole      = require('bole'),
	completer = require('prefix-completer'),
	restify   = require('restify')
	;

const AutoComplete = module.exports = function AutoComplete(options)
{
	assert(options, 'you must pass an options object to the constructor');
	assert(options.hasOwnProperty('path') && _.isString(options.path), 'you must pass a `path` to mount the route on in the options');

	this.options = options;
	this.rules = options.rules;
	this.logger = bole('completer');

	this.tags = completer.create(options.tags);
	this.fandoms = completer.create(options.fandoms);
	this.people = completer.create(options.people);

	this.server = restify.createServer(options);
	this.server.use(restify.bodyParser());
	this.server.use(restify.queryParser());
	this.server.use(this.logEachRequest.bind(this));

	this.server.get(options.path + '/api/1/ac/fandoms', this.handleFandom.bind(this));
	this.server.get(options.path + '/api/1/ac/tags', this.handleTag.bind(this));
	this.server.get(options.path + '/api/1/ac/people', this.handlePerson.bind(this));
	this.server.get(options.path + '/api/1/ac/ping', this.handlePing.bind(this));
	this.server.get(options.path + '/api/1/ac/status', this.handleStatus.bind(this));
};

AutoComplete.prototype.server  = null;
AutoComplete.prototype.options = null;
AutoComplete.prototype.tags    = null;
AutoComplete.prototype.fandoms = null;
AutoComplete.prototype.handles = null;
AutoComplete.prototype.logger  = null;

AutoComplete.prototype.listen = function(port, host, callback)
{
	this.server.listen(port, host, callback);
};

AutoComplete.prototype.logEachRequest = function logEachRequest(request, response, next)
{
	this.logger.info(request.method, request.url);
	next();
};

AutoComplete.prototype.handlePing = function handlePing(request, response, next)
{
	response.send(200, 'OK');
	next();
};

AutoComplete.prototype.handleStatus = function handleStatus(request, response, next)
{
	var self = this;
	var actions = {
		tags: function(cb) { self.tags.statistics(cb); },
		fandoms: function(cb) { self.fandoms.statistics(cb); },
		people: function(cb) { self.people.statistics(cb); },
	};

	async.parallel(actions, function(err, results)
	{
		if (err)
		{
			self.logger.error('problem getting completer stats');
			self.logger.error(err);
		}
		var status = {
			pid:     process.pid,
			uptime:  process.uptime(),
			rss:     process.memoryUsage(),
			tags:    results.tags,
			fandoms: results.fandoms,
			people:  results.people,
		};
		response.json(200, status);
		next();
	});
};

AutoComplete.prototype.handleTag = function handleTag(request, response, next)
{
	var self = this;

	if (!request.params.q)
	{
		response.json(200, []);
		return next();
	}

	var prefix = request.params.q.trim();
	var decorate = false;
	if (prefix.match(/^#/))
	{
		prefix = prefix.replace(/^#/, '');
		decorate = true;
	}

	this.tags.complete(prefix, 15, function(err, prefix, completions)
	{
		if (err)
		{
			self.logger.error('tags autompletion error');
			self.logger.error(err);
			response.json(200, []);
		}
		else
		{
			if (decorate)
				completions = completions.map(function(item) { return '#' + item; });
			response.json(200, completions);
		}

		next();
	});
};

AutoComplete.prototype.handleFandom = function handleFandom(request, response, next)
{
	var self = this;
	if (!request.params.q)
	{
		response.json(200, []);
		return next();
	}

	var prefix = request.params.q.trim();
	var decorate = false;
	if (prefix.match(/^\(/))
	{
		prefix = prefix.replace(/^\(/, '');
		decorate = true;
	}

	this.fandoms.complete(prefix, 15, function(err, prefix, completions)
	{
		if (err)
		{
			self.logger.error('people autompletion error');
			self.logger.error(err);
			response.json(200, []);
		}
		else
		{
			if (decorate)
				completions = completions.map(function(item) { return '(' + item + ')'; });
			response.json(200, completions);
		}

		next();
	});
};

AutoComplete.prototype.handlePerson = function handlePerson(request, response, next)
{
	var self = this;

	if (!request.params.q)
	{
		response.json(200, []);
		return next();
	}

	var prefix = request.params.q.trim();
	var decorate = false;
	if (prefix.match(/^@/))
	{
		prefix = prefix.replace(/^@/, '');
		decorate = true;
	}

	this.people.complete(prefix, 15, function(err, prefix, completions)
	{
		if (err)
		{
			self.logger.error('people autompletion error');
			self.logger.error(err);
			response.json(200, []);
		}
		else
		{
			if (decorate)
				completions = completions.map(function(item) { return '@' + item; });
			response.json(200, completions);
		}

		next();
	});
};
