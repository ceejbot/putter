/*global describe:true, it:true, before:true, after:true */

var
	demand = require('must'),
	StoryComment  = require('../lib/models/storycomment')
	;

describe('StoryComment', () =>
{
	it('exports a class', () =>
	{
		StoryComment.must.exist();
		StoryComment.must.be.a.function();
		(new StoryComment({})).must.be.instanceof(StoryComment);
	});

	it('has tests');
});
