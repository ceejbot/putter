require('dotenv').config({path: `${__dirname}/.env`, silent: true});
const five = require('take-five');

const AuthServer = module.exports = function AuthServer(node)
{
	this.node = node;
	this.server = five();
	this.server.get('/ping', this.handlePing.bind(this));
	this.server.get('/status', this.handleStatus.bind(this));
};

AuthServer.prototype.listen = function listen(port, host, callback)
{
	this.server.listen(port, host, callback);
};

AuthServer.prototype.handlePing = function handlePing(request, response)
{
	response.send(200, 'OK');
};

AuthServer.prototype.handleStatus = function handleStatus(request, response, next)
{
	var status = {
		pid:     process.pid,
		uptime:  process.uptime(),
		rss:     process.memoryUsage(),
		node:    this.node,
	};
	response.send(200, status);
	next();
};
