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
	// render the view
	response.status(501).send('not implemented');
}

function postSignUp(request, response)
{
	const ctx = {
		handle: request.body.signup_handle,
		email: request.body.signup_email,
		password: request.body.signup_password,
	};
	const {invalid, _} = Joi.validate(ctx, schemas.POST_USER_SIGNUP);
	if (invalid)
	{
		// TODO flash messages etc
		response.render('index', { title: 'putter fic', message: 'errors', errors: invalid });
		return;
	}

	request.logger.info(ctx);

	function validateStatus(code) { return code !== 201 && code !== 409; }

	requester.post(`/v1/users/user`, ctx, { validateStatus }).then(rez =>
	{
		if (rez.status === 409)
		{
			// TODO flash messages etc
			// TOOD this is email address conflict
			response.render('index', { title: 'woops', message: 'email address in use' });
			return;
		}

		// TODO flash messages etc
		response.redirect(301, '/');
	}).catch(err =>
	{
		request.logger.error(`unexpected error while creating user: ${err.message}; email: ${ctx.email}`);
		response.status(500).send('something has gone wrong');
	});
}

function getSignIn(request, response)
{
	// render the view
	response.status(501).send('not implemented');
}

function postSignIn(request, response)
{
	request.logger.info(JSON.stringify(request.body));

	const ctx = {
		email: request.body.signin_email,
		password: request.body.signin_password,
	};
	const {invalid, _} = Joi.validate(ctx, schemas.POST_USER_SIGNUP);
	if (invalid)
	{
		// TODO flash messages etc
		response.render('index', { title: 'putter fic', message: 'errors', errors: invalid });
		return;
	}

	request.logger.info(ctx);
	request.logger.info(`/v1/users/email/${ctx.email}/login`);

	requester.post(`/v1/users/email/${ctx.email}/login`, ctx)
	.then(rez =>
	{
		console.log(rez);
		response.session.user_id = rez.body.id; // TODO verify that this is where it is
		response.render('index', { title: 'putter fic', message: 'probably we just logged in' });
	}).catch(err =>
	{
		request.logger.error(`unexpected error while logging in: ${err.message}; email: ${ctx.email}`);
		response.status(500).send('something has gone wrong');
	});
}

function postSignOut(request, response)
{
	// validate input
	// use axios to make request to data api to kill session token
	// nuke cookie

	request.logger.info(JSON.stringify(request.body));
	response.status(501).send('not implemented');
}

module.exports = router;
