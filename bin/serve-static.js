#!/usr/bin/env node

// Static assets are deliberately made inaccessible to the main express app to
// force me to serve them separately. E.g., with nginx. Don't run this in production.

const
    bistre  = require('bistre'),
    bole    = require('bole'),
    logstr  = require('common-log-string'),
    express = require('express')
	;

const logger  = bole('web');
const outputs = [];
var prettystream = require('bistre')({time: true});
prettystream.pipe(process.stdout);
outputs.push({ level:  'debug', stream: prettystream });
bole.output(outputs);

const app = express();
app.use(express.static('public'));
app.use(afterhook);

app.listen(3004, () =>
{
    logger.info('static app configured on port 3004');
});

function afterhook(request, response, next)
{
    request.on('end', () =>
    {
        response._time = Date.now();
    	logger.info(logstr(request, response));
    });
    next();
}
