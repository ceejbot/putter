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

const DATA_API = `http://${process.env.HOST_DATA}:${process.env.PORT_DATA}`;
axios.defaults.baseURL = DATA_API;
axios.defaults.headers.post['content-type'] = 'application/json';

function getSignUp(request, response)
{
	// render the view
	response.status(501).send('not implemented');
}

function postSignUp(request, response)
{
	// TODO
	// validate input
	// use axios to make request to data api to create person
	// log the person in; send validation email;
	// redirect to create-handle page

	request.logger.info('------');
	request.logger.info(JSON.stringify(request.body));
	request.logger.info('------');

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

	axios.post(`${DATA_API}/v1/users/user`, ctx).then(response =>
	{
		response.redirect(301, '/create-handle');
	}).catch(err => 
	{
		request.logger.error(err);
		// TODO errors might include things like "email already in use"
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

	// validate input
	// use axios to make request to data api

	response.status(501).send('not implemented');
}

function postSignOut(request, response)
{
	// validate input
	// use axios to make request to data api to kill session
	// nuke cookie

	request.logger.info(JSON.stringify(request.body));
	response.status(501).send('not implemented');
}

module.exports = router;
