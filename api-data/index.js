require('dotenv').config({path: `${__dirname}/.env`, silent: true});
const
	_         = require('lodash'),
	async     = require('async'),
	assert    = require('assert'),
	bole      = require('bole'),
	logstring = require('common-log-string'),
	restify   = require('restify'),
	Models    = require('../lib/models')
	;

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

APIServer.prototype.server  = null;
APIServer.prototype.options = null;
APIServer.prototype.logger  = null;

APIServer.prototype.listen = function(port, host, callback)
{
	this.server.listen(port, host, callback);
};

APIServer.prototype.afterHook = function afterHook(request, response, route, error)
{
	this.logger.info(logstring(request, response));
};

APIServer.prototype.handlePing = function handlePing(request, response, next)
{
	response.send(200, 'OK');
	next();
};

APIServer.prototype.handleStatus = function handleStatus(request, response, next)
{
	var status = {
		pid:     process.pid,
		uptime:  process.uptime(),
		rss:     process.memoryUsage(),
	};
	response.json(200, status);
	next();
};
