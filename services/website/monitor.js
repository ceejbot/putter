const
	exec    = require('child_process').exec,
	express = require('express');

const router = express.Router();
var message, triedMessage;

router.get('/ping', handlePing);
router.get('/status', handleStatus);

function handlePing(request, response)
{
	response.status(200).send('OK');
}

function handleStatus(request, response)
{
	var status = {
		pid:    process.pid,
		uptime: process.uptime(),
		rss:    process.memoryUsage(),
		git:    fetchCommit(),
	};
	response.status(200).send(status);
}

function fetchCommit()
{
	// we're going to fetch this lazily; won't have it the first time
	if (!message && !triedMessage)
	{
		exec('git log --oneline --abbrev-commit  -n 1', (err, stdout, stderr) =>
		{
			if (!err && stdout) message = stdout.trim();
		});
		triedMessage = true;
	}

	return message || '';
}

fetchCommit();
module.exports = router;
