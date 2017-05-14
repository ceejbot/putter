'use strict';

const
	bole    = require('bole'),
	Handle  = require('../../lib/models/handle'),
	Joi     = require('joi'),
	Person  = require('../../lib/models/person'),
	schemas = require('../../lib/schemas'),
	session = require('@npm/pg-db-session'),
	Token   = require('../../lib/models/token')
	;

const logger = bole('user-routes');

const userroutes = module.exports = function mount(server)
{
	server.post('/v1/people/person', postPerson);
	server.get('/v1/people/email/:email', getPersonByEmail);
	server.post('/v1/people/email/:email/login', postLogin);
	server.post('/v1/people/person/:person/token', postPersonToken);
	server.get('/v1/people/person/:person/token/:token', getPersonToken);
	server.post('/v1/people/person/:person/token/:token/touch', postTokenTouch);
};

function getPersonByEmail(request, response, next)
{
	// TODO this needs an auth token to validate that the request is okay (or CORS to block it, pref both)
	const {invalid, _} = Joi.validate(request.body.email, Joi.string().isEmail());
	if (invalid)
	{
		logger.info({ message: invalid.message, function: getPersonByEmail});
		response.send(400, invalid.message);
	}

	Person.objects.get({ email: request.body.email })
	.then(p =>
	{
		response.send(200, p.serialize());
	})
	.catch(Person.objects.NotFound, () =>
	{
		response.send(404, 'not found');
	})
	.catch(err =>
	{
		logger.error({ message: err.message, function: 'getPersonByEmail'});
		response.send(500, err.message);
	});
}

function postPerson(request, response, next)
{
	const ctx = {
		email: request.body.email,
		password: request.body.password,
		handle: request.body.handle
	};
	const {invalid, _} = Joi.validate(ctx, schemas.POST_USER_SIGNUP);
	if (invalid)
	{
		logger.info({ message: invalid.message, function: 'postPerson'});
		response.send(400, invalid.message);
		return;
	}

	// TODO wrap this in a transaction!
	// session.transaction()

	Person.create(ctx)
	.then(person =>
	{
		return Handle.create({handle: ctx.handle, person});
	})
	.then(handle =>
	{
		logger.info(`person created; email=${ctx.email}; handle=${ctx.handle}`);
		// TODO log the person in; send validation email;
		response.send(201);
		next();
	})
	.catch(Person.objects.Conflict, err =>
	{
		logger.info({ message: `duplicate email address made it through: ${ctx.email}`, email: ctx.email });
		response.send(409, err.message);
	})
	.catch(Handle.objects.error, err =>
	{
		// boy do I want transactions right now
		logger.error({ message: err.message, function: 'postPerson'});
		response.send(500, err.message);
	})
	.catch(err =>
	{
		logger.error({ message: err.message, function: 'postPerson'});
		response.send(500, err.message);
	});
}

function postLogin(request, response, next)
{
	// TODO validate input
	const ctx = {
		email: request.body.email,
		password: request.body.password,
		otp: request.headers['x-putter-otp'],
	};

	Person.objects.get({ email: ctx.email, 'deleted:isNull': true, })
	.then(person =>
	{
		return person.authenticate(ctx);
	})
	.then(answer =>
	{
		return Token.create(answer, ['read', 'comment', 'post']);
	})
	.then(token =>
	{
		response.send(200, { token: token.serializeForAPI(), person: token.person.serializeForAPI() });
	})
	.catch(Person.Errors.OTPRequired, err =>
	{
		// prompt for otp using WWW-Authenticate
		response.setHeader('x-putter-otp', 'required');
		response.send(401, 'need otp');
		next();
	})
	.catch(Person.Errors.BadAuth, err =>
	{
		logger.info(`auth attempt failed; email=${ctx.email}`);
		response.setHeader('www-authenticate', 'basic');
		response.send(401, 'failed');
		next();
	})
	.catch(Person.objects.NotFound, err =>
	{
		logger.info(`login failed for not-found person; email=${ctx.email}`);
		response.setHeader('www-authenticate', 'basic');
		response.send(401, 'failed');
		next();
	})
	.catch(err =>
	{
		logger.error({ message: err.message, function: 'getPersonByEmail'});
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
userroutes.getPersonByEmail = getPersonByEmail;
userroutes.getPersonToken = getPersonToken;
userroutes.postLogin = postLogin;
userroutes.postPerson = postPerson;
userroutes.postPersonToken = postPersonToken;
userroutes.postTokenTouch = postTokenTouch;
