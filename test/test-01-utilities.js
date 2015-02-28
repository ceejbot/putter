/*global describe:true, it:true, before:true, after:true */

var
	demand = require('must'),
	path   = require('path'),
	putil  = require('../lib/utilities')
	;

describe('utilities', function()
{
	it('can generate a lot of random IDs', function()
	{
		var gen;
		for (var i = 1; i < 200; i++)
		{
			gen = putil.randomID(i);
			gen.length.must.equal(i);
		}
	});

	it('can generate a long random ID', function()
	{
		var gen = putil.randomID(500);
		gen.length.must.equal(500);
	});

	it('can load TOML files', function()
	{
		var result = putil.loadConfig(path.join(__dirname, 'fixtures', 'test-config.toml'));
		result.must.be.an.object();
		result.must.have.property('database');
		result.database.must.be.an.object();
	});

	it('has tests for the logger function');
});
