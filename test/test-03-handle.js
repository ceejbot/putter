/*global describe:true, it:true, before:true, after:true */
'use strict';

var
	demand = require('must'),
	path   = require('path'),
	Handle  = require('../lib/models/handle')
	;

describe('Handle', () =>
{
	it('exports a class', () =>
	{
		Handle.must.exist();
		Handle.must.be.a.function();
		(new Handle({})).must.be.instanceof(Handle);
	});

	it('has tests');
});
