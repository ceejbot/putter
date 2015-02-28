/*global describe:true, it:true, before:true, after:true */

var
	demand = require('must'),
	path   = require('path'),
	Putter = require('../lib/controllers/putter'),
	putil  = require('../lib/utilities')
	;

describe('putter', function()
{
	var config = putil.loadConfig(__dirname + '/fixtures/test-config.toml');
	var controller;

	it('requires a configuration object', function()
	{
		function shouldThrow() { return new Putter(); }
		shouldThrow.must.throw(/configuration object/);
	});

	it('can be constructed', function()
	{
		controller = new Putter(config);
		controller.must.be.an.object();
	});
	

	it('has tests');
});
