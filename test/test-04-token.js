/*global describe:true, it:true, before:true, after:true */
'use strict';

var
	demand = require('must'),
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

	it('exports permissions and properties', () =>
	{
		Token.PERMS.must.be.an.object();
		Token.PROPS.must.be.an.array();
	});

	it('must be constructable', () =>
	{
		const t = new Token({ person_id: 1, token: 'deadbeef' });
		t.must.be.instanceof(Token);
		t.person_id.must.equal(1);
		t.token.must.equal('deadbeef');
		t.serialize.must.be.a.function();
		t.serializeForAPI.must.be.a.function();
	});
});
