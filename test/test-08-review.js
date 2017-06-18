/*global describe:true, it:true, before:true, after:true */

var
	demand = require('must'),
	Review  = require('../lib/models/review')
	;

describe('Review', () =>
{
	it('exports a class', () =>
	{
		Review.must.exist();
		Review.must.be.a.function();
		(new Review({})).must.be.instanceof(Review);
	});

	it('has tests');
});
