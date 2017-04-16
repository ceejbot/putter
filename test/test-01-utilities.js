/*global describe:true, it:true, before:true, after:true */

var
	demand = require('must'),
	path   = require('path'),
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

	it('can load TOML files', () =>
	{
		var result = putil.loadConfig(path.join(__dirname, 'fixtures', 'test-config.toml'));
		result.must.be.an.object();
		result.must.have.property('database');
		result.database.must.be.an.object();
	});

	it('has tests for the cleanTagText function');
});
