'use strict';

const userroutes = module.exports = function mount(server)
{
	server.post('/v1/users/user/:user/login', postLogin);
	server.post('/v1/users/user', postUser);
};

function postUser(request, response, next)
{
	response.send(501, 'not implemented');
	next();
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
