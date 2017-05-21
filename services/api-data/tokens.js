'use strict';

const
	bole    = require('bole'),
	Joi     = require('joi'),
	schemas = require('../../lib/schemas'),
	Token   = require('../../lib/models/token')
	;

const logger = bole('user-routes');

const userroutes = module.exports = function mount(server)
{
	server.get('/v1/people/person/:person/token', getPersonAllTokens);
	server.post('/v1/people/person/:person/token', postPersonToken);
	server.get('/v1/people/person/:person/token/:token', getPersonToken);
	server.delete('/v1/people/person/:person/token/:token', delPersonToken);
	server.post('/v1/people/person/:person/token/:token/touch', postTokenTouch);
};

function getPersonAllTokens(request, response, next)
{
	const ctx = { person_id: request.urlParams.person };

	Token.objects.filter(ctx)
	.then(tokens =>
	{
		var result = tokens.map(t =>
		{
			return t.serializeForAPI();
		})

		response.send(200, result);
		next();
	})
	.catch(err =>
	{
		logger.error({ message: err.message, function: 'getPersonAllTokens'});
		response.send(500, err.message);
		next();
	});
}

function postPersonToken(request, response, next)
{
	var perms = 0;
	request.body.perms.forEach(p =>
	{
		perms |= Token.PERMS[p];
	});

	const ctx = {
		person_id: request.body.user_id,
		permissions: perms,
	};

	Token.create(ctx)
	.then(t =>
	{
		response.send(200, t.token);
	})
	.catch(err =>
	{
		logger.error({ message: err.message, function: 'postPersonToken'});
		response.send(500, err.message);
		next();
	});
}

function getPersonToken(request, response, next)
{
	const ctx = {
		token: request.urlParams.token,
		person_id: request.urlParams.person,
	};

	Token.find(ctx)
	.then(token =>
	{
		if (!token)
			response.send(404, 'token not found');
		else
			response.send(200, token.serializeForAPI());
		next();
	})
	.catch(err =>
	{
		logger.error({ message: err.message, function: 'getPersonToken'});
		response.send(500, err.message);
		next();
	});
}

function delPersonToken(request, response, next)
{
	const ctx = {
		token: request.urlParams.token,
		person_id: request.urlParams.person,
	};
	Token.objects.filter(ctx).delete()
	.then(count =>
	{
		if (count < 1)
			response.send(404, 'token not found');
		else
			response.send(200, 'token removed');
		next();
	}).catch(err =>
	{
		logger.error({ message: err.message, function: 'delPersonToken'});
		response.send(500, err.message);
		next();
	});
}

function postTokenTouch(request, response, next)
{
	const ctx = {
		token: request.urlParams.token,
		person_id: request.urlParams.person,
	};
	const update = {
		ip: request.body.ip,
		os: request.body.os,
		browser: request.body.browser,
		ts: new Date(),
	};

	Token.find(ctx)
	.then(token =>
	{
		if (!token)
			response.send(404, 'token not found');
		else
			response.send(200, token.serializeForAPI());
		next();

		// out of band
		return token.touch(update).then(() =>
		{
			logger.debug('touched token');
		}).catch(err =>
		{
			logger.error(`caught error updating token; err=${err.message}; token=${token.id}`);
		});
	})
	.catch(err =>
	{
		logger.error({ message: err.message, function: 'getPersonToken'});
		response.send(500, err.message);
		next();
	});
}

// exposed for testing
userroutes.getPersonToken = getPersonToken;
userroutes.postPersonToken = postPersonToken;
userroutes.postTokenTouch = postTokenTouch;
userroutes.delPersonToken = delPersonToken;
