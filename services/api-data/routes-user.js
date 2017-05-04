'use strict';

const
	bole    = require('bole'),
	Joi     = require('joi'),
	Person  = require('../../lib/models/person'),
	schemas = require('../../lib/schemas')
	;

const logger = bole('user-routes');

const userroutes = module.exports = function mount(server)
{
	server.post('/v1/users/user/:user/login', postLogin);
	server.post('/v1/users/user', postUser);
};

function postUser(request, response, next)
{
	const ctx = {
		email: request.body.email,
		password: request.body.password,
	};
	const {invalid, _} = Joi.validate(ctx, schemas.POST_USER_SIGNUP);
	if (invalid)
	{
		logger.info({ message: invalid.message, function: 'postUser'});
		response.send(400, invalid.message);
		return;
	}

	Person.create(ctx)
	.then(person =>
	{
		// TODO use handle from post to make first handle
		// TODO log the person in; send validation email;
		response.send(201);
		next();
	})
	.catch(Person.objects.Conflict, err =>
	{
		logger.info({ message: 'duplicate email address made it through', email: ctx.email });
		response.send(409, err.message);
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
