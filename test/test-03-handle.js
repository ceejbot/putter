/*global describe:true, it:true, before:true, after:true */
var
	demand = require('must'),
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
