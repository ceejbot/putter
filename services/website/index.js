'use strict';

const
	axios    = require('axios'),
	bole     = require('bole'),
	cookies  = require('cookie-parser'),
	conredis = require('connect-redis'),
	csurf    = require('csurf'),
	express  = require('express'),
	flash    = require('connect-flash'),
	helmet   = require('helmet'),
	logstr   = require('common-log-string'),
	session  = require('express-session'),
	uaparser = require('ua-parser-js'),
	uuid     = require('uuid'),
	logger   = bole('web')
	;

module.exports = function createServer(options)
{
	// TODO this is stupid hackery; fix eventually
	process.env.PORT = process.env.PORT_WEB;
	process.env.HOST = process.env.HOST_WEB;

	const app = express();

	const sessionOpts = {
		secret: process.env.SESSION_SECRET,
		store: new (conredis(session))({ url: process.env.REDIS }),
		resave: false,
		saveUninitialized: true,
		cookie: {},
	};

	if (app.get('env') === 'production')
	{
		app.set('trust proxy', 1);
		sessionOpts.cookie.secure = true;
	}

	app.set('views', `${__dirname}/../../templates`);
	app.set('view engine', 'pug');

	// TODO mount middleware after having selected it
	app.use(requestid);
	app.use(helmet());
	app.use(cookies(process.env.COOKIE_SECRET, {}));
	if (app.get('env') === 'production') app.use(csurf({ cookie: true }));
	app.use(session(sessionOpts));
	app.use(flash());

	app.use(afterhook);
	app.use(handleError);
	app.use(sessionContext);

	// TODO mount routes after having written them
	app.get('/', handleIndex);
	app.use('/', require('./auth'));
	app.use('/', require('./monitor'));

	if (process.env.STATIC_MOUNT === 'self')
	{
		app.use(express.static(`${__dirname}/../../public`));
		app.locals.static_mount = '';
	}
	else
		app.locals.static_mount = process.env.STATIC_MOUNT;
	app.locals.js_mount = process.env.JS_MOUNT;

	logger.info('express app configured');

	return app;
};

function requestid(request, response, next)
{
	request.id = uuid.v1();
	request.logger = bole(request.id);
	request.fetch = axios.create({
		baseURL: `http://${process.env.HOST_DATA}:${process.env.PORT_DATA}`,
		headers: {
			post: { 'content-type': 'application/json'},
			'x-request-id': request.id,
		}
	});

	next();
}

function sessionContext(request, response, next)
{
	response.locals.flash = {
		info: request.flash('info'),
		error: request.flash('error'),
		warning:  request.flash('warning'),
		success:  request.flash('success'),
	};

	if (!request.session || !request.session.user || !request.session.user.id) return next();

	const user = request.session.user;
	const ua = uaparser(request.headers['user-agent']);

	const data = {
		ip: request.socket.remoteAddress,
		os: `${ua.os.name}@${ua.os.version}`,
		browser: `${ua.browser.name}@${ua.browser.version}`,
	};
	// record when we saw this session, while validating it
	function validateStatus(code) { return code === 200 || code === 404; }
	request.fetch.post(`/v1/people/person/${user.id}/token/${user.token}/touch`, data, { validateStatus })
	.then(rez =>
	{
		if (rez.status === 200)
		{
			// And look up anything we think we might use every time for the session.
			response.locals.user = request.session.user.email;
		}
		else
		{
			// token's bunk. remove it from the session & move on.
			session.user = null;
		}

		next();

	}).catch(err =>
	{
		request.logger.error(`problem fetching session data: ${err.message}`);
		next();
	});
}

function afterhook(request, response, next)
{
	response._time = Date.now();
	request.on('end', () =>
	{
		request.logger.info(logstr(request, response));
	});
	next();
}

function handleIndex(request, response)
{
	request.flash('info', 'this is a test');
	// TODO oh so much context
	response.render('index', {
		title: 'puttering around',
	});
}

function handleError(err, request, response, next)
{
	logger.error(err);
	response.status(500).send('tragedy');
}
