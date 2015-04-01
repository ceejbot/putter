/*global describe:true, it:true, before:true, after:true */

var
	_      = require('lodash'),
	async  = require('async'),
	demand = require('must'),
	models = require('../lib/models'),
	path   = require('path'),
	Putter = require('../lib/controllers/putter'),
	putil  = require('../lib/utilities')
	;

describe('teardown', function()
{
	var config = putil.loadConfig(__dirname + '/fixtures/test-config.toml');
	var controller;

	it('can be constructed', function()
	{
		controller = new Putter(config);
		controller.must.be.an.object();
	});

	it('tears down the db', function(done)
	{
		var adapter = models.Person.adapter;

		adapter.Rethink
			.dbDrop(config.database.database)
			.run(adapter.connection, function(err, results)
		{
			demand(err).not.exist();
			done();
		});
	});

	it('tears down the search index', function(done)
	{
		var actions = _.map(models, function(model, name)
		{
			if (!model.searchMapping) return;
			var f = function(cb) { controller.searchdb.dropDocumentType(model, cb); };
			return f;
		});

		actions.push(function(cb) { controller.searchdb.dropTagIndex(cb); });
		async.parallel(actions, function(err, results)
		{
			console.log(err);
			// demand(err).not.exist();
			done();
		});
	});
});
