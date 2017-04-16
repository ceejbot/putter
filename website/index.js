require('dotenv').config({path: `${__dirname}/.env`, silent: true});
const
	bole    = require('bole'),
	logstr  = require('common-log-string'),
	express = require('express'),
	logger  = bole('web')
	;

module.exports = function createServer(options)
{
	const app = express();

	app.set('views', `${__dirname}/views`);
	app.set('view engine', 'pug');

	app.locals.static_mount = process.env.STATIC_MOUNT;

	// TODO mount middleware after having selected it
	app.use(afterhook);
	app.use(handleError);

	// TODO mount routes after having written them
	app.get('/', handleIndex);
	app.get('/ping', handlePing);
	app.get('/status', handleStatus);

	logger.info('express app configured');

	return app;
};

function afterhook(request, response, next)
{
	request.on('end', () =>
	{
		response._time = Date.now();
		logger.info(logstr(request, response));
	});
	next();
}

function handleIndex(request, response)
{
	response.render('index', { title: 'putter fic', message: 'hello world' });
}

function handlePing(request, response)
{
	response.status(200).send('OK');
}

function handleStatus(request, response)
{
	var status = {
		pid:     process.pid,
		uptime:  process.uptime(),
		rss:     process.memoryUsage(),
	};
	response.status(200).send(status);
}

function handleError(err, request, response, next)
{
	logger.error(err);
	response.status(500).send('tragedy');
}
