'use strict';

const
	bole         = require('bole'),
	cookieParser = require('cookie-parser'),
	conredis     = require('connect-redis'),
	csurf        = require('csurf'),
	express      = require('express'),
	helmet       = require('helmet'),
	logstr       = require('common-log-string'),
	session      = require('express-session'),
	uuid         = require('uuid'),
	logger       = bole('web')
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

	app.set('views', `${__dirname}/views`);
	app.set('view engine', 'pug');

	// TODO mount middleware after having selected it
	app.use(requestid);
	app.use(helmet());
	app.use(cookieParser(process.env.COOKIE_SECRET, {}));
	// app.use(csurf({ cookie: true }));
	app.use(session(sessionOpts));

	app.use(afterhook);
	app.use(handleError);
	app.use(sessionContext);

	// TODO mount routes after having written them
	app.get('/', handleIndex);
	app.use('/', require('./routes/auth'));
	app.use('/', require('./routes/monitor'));

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
	next();
}

function sessionContext(request, response, next)
{
	if (!request.session || !request.session.user) return next();

	// TODO validate session token against data API

	// And look up anything we think we might use every time for the session.
	response.locals.user = request.session.user.email;
	next();
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
	response.render('index', { title: 'putter fic', message: '' });
}

function handleError(err, request, response, next)
{
	logger.error(err);
	response.status(500).send('tragedy');
}
