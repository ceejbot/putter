/*global describe:true, it:true, before:true, after:true */
'use strict';

var
	demand = require('must'),
	path   = require('path'),
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
