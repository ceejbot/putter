const
	body    = require('body-parser'),
	express = require('express'),
	Joi     = require('joi'),
	schemas = require('../../lib/schemas')
	;

const formParser = body.urlencoded({ extended: false });
const router = express.Router();

const COOKIE_LIFESPAN = 2 * 365 * 24 * 60 * 60; // 2 years

router.get('/signup', getSignUp);
router.post('/signup', formParser, postSignUp);
router.get('/signin', getSignIn);
router.post('/signin', formParser, postSignIn);
router.post('/signout', formParser, postSignOut);

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
	const check = Joi.validate(ctx, schemas.POST_USER_SIGNUP);
	if (check.invalid)
	{
		request.flash('error', check.invalid);
		response.redirect(301, '/#signup');
		return;
	}

	function validateStatus(code) { return code === 201 && code === 409; }

	request.fetch.post('/v1/people/person', ctx, { validateStatus })
	.then(rez =>
	{
		if (rez.status === 409)
		{
			request.flash('error', 'email address in use; have you forgotten your password?');
			response.redirect(301, '/#signup');
			return;
		}

		request.flash('info', 'you\'ve signed up! email is on the way. now sign in');
		response.redirect(301, '/#signin');
	}).catch(err =>
	{
		request.logger.error(`unexpected error while creating user: ${err.message}; email: ${ctx.email}`);
		request.flash('error', 'something has gone wrong on signup; this was not your fault');
		response.redirect(301, '/#signup');
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
	const check = Joi.validate(ctx, schemas.POST_USER_SIGNIN);
	if (check.invalid)
	{
		request.flash('warning', check.invalid);
		response.redirect('/#signin');
		return;
	}

	// Non-error responses include OTP challenges & incorrect credentials.
	function validateStatus(code) { return code === 200 || code === 401 || code === 404; }

	request.fetch.post(`/v1/people/email/${ctx.email}/login`, ctx, { validateStatus })
	.then(rez =>
	{
		if (rez.status === 200)
		{
			request.session.user = {
				id: rez.data.person.id,
				email: rez.data.person.email,
				token: rez.data.token.token
			};
			request.session.save(err =>
			{
				if (err)
					request.logger.error(`problem saving session; proceeding; err=${err.message}`);
				request.logger.info(`successful login; email=${rez.data.person.email}`);
				response.cookie('login', ctx.email, { expires: new Date(Date.now() + COOKIE_LIFESPAN) });
				request.flash('info', 'welcome back!');
				response.redirect(301, '/');
			});
		}
		else if (rez.status === 401 && rez.header['x-putter-otp'])
		{
			// TODO prompt for OTP
			request.logger.info(`OTP prompt required for login; email=${rez.data.email}`);
			request.flash('info', 'we should prompt you for your OTP now');
			response.redirect(301, '/#otp');
		}
		else
		{
			// TODO everybody else gets a "who what?"
			request.logger.info(`login failure; email=${rez.data.email}`);
			request.flash('error', 'we could not log you in with those credentials');
			response.redirect(301, '/#signin');
		}
	}).catch(err =>
	{
		request.logger.error(`unexpected error while logging in: ${err.message}; email: ${ctx.email}`);
		request.flash('error', 'something has gone wrong on sign in; this was not your fault');
		response.redirect(301, '/#signin');
	});
}

function postSignOut(request, response)
{
	response.cookie('login', '', { expires: new Date(Date.now() + COOKIE_LIFESPAN) });
	request.flash('info', 'you have signed out');

	const user = request.session.user;
	request.session.user = {};
	request.session.save(err =>
	{
		if (err)
			request.logger.error(`problem saving session; proceeding; err=${err.message}`);

		request.fetch.delete(`/v1/people/person/${user.id}/token/${user.token}`)
		.then(r =>
		{
			response.redirect(301, '/');

		}).catch(err =>
		{
			request.logger.error(`problem deleting user auth token; proceeding; err=${err.message}`);
			response.redirect(301, '/');
		});
	});
}

module.exports = router;
