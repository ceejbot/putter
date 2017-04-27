/*global describe:true, it:true, before:true, after:true */
'use strict';

var
	demand = require('must'),
	path   = require('path'),
	Token  = require('../lib/models/token')
	;

describe('Token', () =>
{
	it('exports a class', () =>
	{
		Token.must.exist();
		Token.must.be.a.function();
		(new Token({})).must.be.instanceof(Token);
	});

	it('has tests');
});
