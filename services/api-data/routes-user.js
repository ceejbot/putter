'use strict';

const
	bole    = require('bole'),
	Handle  = require('../../lib/models/handle'),
	Joi     = require('joi'),
	Person  = require('../../lib/models/person'),
	schemas = require('../../lib/schemas'),
	session = require('@npm/pg-db-session')
	;

const logger = bole('user-routes');

const userroutes = module.exports = function mount(server)
{
	server.get('/v1/users/email/:email', getUserByEmail);
	server.post('/v1/users/user/:user/login', postLogin);
	server.post('/v1/users/user', postUser);
};

function getUserByEmail(request, response, next)
{
	// TODO this needs an auth token to validate that the request is okay (or CORS to block it, pref both)
	const {invalid, _} = Joi.validate(request.body.email, Joi.string().isEmail());
	if (invalid)
	{
		logger.info({ message: invalid.message, function: getUserByEmail});
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
		logger.error({ message: err.message, function: 'getUserByEmail'});
		response.send(500, err.message);
	});
}

function postUser(request, response, next)
{
	const ctx = {
		email: request.body.email,
		password: request.body.password,
		handle: request.body.handle
	};
	const {invalid, _} = Joi.validate(ctx, schemas.POST_USER_SIGNUP);
	if (invalid)
	{
		logger.info({ message: invalid.message, function: 'postUser'});
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
		logger.info(`user created; email=${ctx.email}; handle=${ctx.handle}`);
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
		logger.error({ message: err.message, function: 'postUser'});
		response.send(500, err.message);
	})
	.catch(err =>
	{
		logger.error({ message: err.message, function: 'postUser'});
		response.send(500, err.message);
	});
}

function postLogin(request, response, next)
{
	Person.authenticate({
		email: request.body.email,
		password: request.body.password,
		otp: request.headers['x-putter-otp'],
	}).then(answer =>
	{
		if (answer === 'no')
		{
			response.setHeader('www-authenticate', 'basic');
			response.send(401, 'failed');
		}
		else if (answer === 'otp_required')
		{
			// prompt for otp using WWW-Authenticate
			response.setHeader('x-putter-otp', 'required');
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

userroutes.postUser = postUser;
userroutes.postLogin = postLogin;
