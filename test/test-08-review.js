/*global describe:true, it:true, before:true, after:true */
'use strict';

var
	demand = require('must'),
	path   = require('path'),
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
