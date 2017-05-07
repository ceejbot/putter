'use strict';

const
	axios   = require('axios'),
	body    = require('body-parser'),
	express = require('express'),
	Joi     = require('joi'),
	schemas = require('../../../lib/schemas')
	;

const formParser = body.urlencoded({ extended: false });
const router = express.Router();

const COOKIE_LIFESPAN = 2 * 365 * 24 * 60 * 60; // 2 years

router.get('/signup', getSignUp);
router.post('/signup', formParser, postSignUp);
router.get('/signin', getSignIn);
router.post('/signin', formParser, postSignIn);
router.post('/signout', formParser, postSignOut);

const requester = axios.create({
	baseURL: `http://${process.env.HOST_DATA}:${process.env.PORT_DATA}`,
});
requester.defaults.headers.post['content-type'] = 'application/json';

function getSignUp(request, response)
{
	response.redirect('/#signup');
}

function postSignUp(request, response)
{
	const ctx = {
		handle: request.body.handle,
		email: request.body.email,
		password: request.body.password,
	};
	const {invalid, _} = Joi.validate(ctx, schemas.POST_USER_SIGNUP);
	if (invalid)
	{
		// TODO flash messages etc
		response.render('index', { title: 'putter fic', message: 'errors', errors: invalid });
		return;
	}

	function validateStatus(code) { return code !== 201 && code !== 409; }

	requester.post('/v1/users/user', ctx, { validateStatus })
	.then(rez =>
	{
		if (rez.status === 409)
		{
			// TODO flash messages etc
			// TOOD this is email address conflict
			response.render('index', { title: 'woops', message: 'email address in use' });
			return;
		}

		// TODO flash messages etc
		response.redirect(301, '/#signin');
	}).catch(err =>
	{
		request.logger.error(`unexpected error while creating user: ${err.message}; email: ${ctx.email}`);
		response.status(500).send('something has gone wrong');
	});
}

function getSignIn(request, response)
{
	response.redirect('/#signin');
}

function postSignIn(request, response)
{
	const ctx = {
		email: request.body.email,
		password: request.body.password,
	};
	const {invalid, _} = Joi.validate(ctx, schemas.POST_USER_SIGNIN);
	if (invalid)
	{
		// TODO flash messages etc
		response.render('index', { title: 'putter fic', message: 'errors', errors: invalid });
		return;
	}

	// Non-error responses include OTP challenges & incorrect credentials.
	function validateStatus(code) { return code === 200 || code === 401 || code === 404; }

	requester.post(`/v1/users/email/${ctx.email}/login`, ctx, { validateStatus })
	.then(rez =>
	{
		if (rez.status === 200)
		{
			// TODO response should also include session token!!
			request.session.user = {
				id: rez.data.id,
				email: rez.data.email,
				token: rez.data.token
			};
			request.session.save(err =>
			{
				if (err)
					request.logger.error(`problem saving session; proceeding; err=${err.message}`);
				request.logger.info(`successful login; email=${rez.data.email}`);
				response.cookie('login', ctx.email, { expires: new Date(Date.now() + COOKIE_LIFESPAN) });
				response.redirect(301, '/');
			});
		}
		else if (rez.status === 401 && rez.header['x-putter-otp'])
		{
			// TODO prompt for OTP
			request.logger.info(`OTP prompt required for login; email=${rez.data.email}`);
			response.render('index', { title: 'putter fic', message: 'we should prompt for your OTP now' });
			return;
		}
		else
		{
			// TODO everybody else gets a "who what?"
			request.logger.info(`login failure; email=${rez.data.email}`);
			response.render('index', { title: 'putter fic', message: 'could not log in with those credentials; try again' });
		}
	}).catch(err =>
	{
		request.logger.error(`unexpected error while logging in: ${err.message}; email: ${ctx.email}`);
		response.render('index', { title: 'putter fic', message: err.message });
	});
}

function postSignOut(request, response)
{
	// TODO validate csrf etc
	// use axios to make request to data api to kill session token
	request.session.user = {};
	request.session.save(err =>
	{
		if (err)
			request.logger.error(`problem saving session; proceeding; err=${err.message}`);
		response.cookie('login', '', { expires: new Date(Date.now() + COOKIE_LIFESPAN) });
		response.redirect(301, '/');
	});
}

module.exports = router;
