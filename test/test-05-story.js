/*global describe:true, it:true, before:true, after:true */

var
	demand = require('must'),
	Story  = require('../lib/models/story')
	;

describe('Story', () =>
{
	it('exports a class', () =>
	{
		Story.must.exist();
		Story.must.be.a.function();
		(new Story({})).must.be.instanceof(Story);
	});

	it('has tests');
});
