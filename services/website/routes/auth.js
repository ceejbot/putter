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
	request.logger.info(JSON.stringify(request.body));

	const ctx = {
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

	requester.post(`/v1/users/email/${ctx.email}/login`, ctx)
	.then(rez =>
	{
		request.session.user_id = rez.data.id; // TODO verify that this is where it is
		request.session.save(err =>
		{
			if (err)
				request.logger.error(`problem saving session; proceeding; err=${err.message}`);
			response.cookie('user', ctx.email, { expires: new Date(Date.now() + 900000) });
			response.redirect(301, '/');
		});
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
