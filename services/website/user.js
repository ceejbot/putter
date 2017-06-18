const
	// body    = require('body-parser'),
	crypto  = require('crypto'),
	express = require('express')
	;

// const formParser = body.urlencoded({ extended: false });
const router = express.Router();

router.get('/you', getProfile);
router.get('/you/sessions', getSessions);

function getProfile(request, response)
{
	response.render('you', {
		title: 'all about you',
	});
}

function getSessions(request, response)
{
	request.fetch.get(`/v1/people/person/${request.session.user.id}/token`)
	.then(rez =>
	{
		const sanitized = rez.data.map(t =>
		{
			t.hash = crypto.createHash('sha256').update(t.token).digest('hex');
			t.token = '***-' + t.token.substring(t.token.length - 4);
			return t;
		});
		response.render('you', {
			title: 'sessions',
			sessions: sanitized,
		});

	}).catch(err =>
	{
		request.logger.error(`unexpected error fetching sessions: ${err.message}; email: ${request.session.user.email}`);
		request.flash('error', 'something has gone wrong fetching your sessions; this was not your fault');
		response.redirect(301, '/you');
	});
}

module.exports = router;
