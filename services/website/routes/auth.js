'use strict';

const
	axios   = require('axios'),
	body    = require('body-parser'),
	express = require('express'),
	;

const router = express.Router();

router.use(body.urlencoded({ extended: false }));
router.use(body.json());
router.get('/signup', getSignUp);
router.post('/signup', postSignUp);
router.get('/signin', getSignIn);
router.post('/signin', postSignIn);
router.post('/signout', postSignOut);

function postSignUp(request, response)
{
	request.logger.info(JSON.stringify(request.body));

	// validate input
	// use axios to make request to data api
	// create person
	// save
	// redirect to home page

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
