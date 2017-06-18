/*global describe:true, it:true, before:true, after:true */
'use strict';

var
	demand = require('must'),
	putil  = require('../lib/utilities')
	;

describe('utilities', () =>
{
	it('can generate a lot of random IDs', () =>
	{
		var gen;
		for (var i = 1; i < 200; i++)
		{
			gen = putil.randomID(i);
			gen.length.must.equal(i);
		}
	});

	it('can generate a long random ID', () =>
	{
		var gen = putil.randomID(500);
		gen.length.must.equal(500);
	});

	it('has tests for the cleanTagText function');
});
