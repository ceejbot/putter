/*global describe:true, it:true, before:true, after:true */
'use strict';

var
	demand = require('must'),
	path   = require('path'),
	Chapter  = require('../lib/models/chapter')
	;

describe('Chapter', () =>
{
	it('exports a class', () =>
	{
		Chapter.must.exist();
		Chapter.must.be.a.function();
		(new Chapter({})).must.be.instanceof(Chapter);
	});

	it('has tests');
});
