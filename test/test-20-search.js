/*global describe:true, it:true, before:true, after:true */

var
	demand = require('must'),
	path   = require('path'),
	putil  = require('../lib/utilities')
	;

describe('search', function()
{
	it('has tests');

/*
	it('can find the test user by searching for its handle', function(done)
	{
		controller.searchdb.searchTypeByField('people', 'handle', [person.handle], function(err, results)
		{
			demand(err).not.exist();
			results.people.length.must.equal(1);
			done();
		});
	});

	it('can find users by handle using the freeform search', function(done)
	{
		var terms = { freeform: [person.handle] };
		controller.searchdb.searchFreeform(terms, function(err, results)
		{
			demand(err).not.exist();
			results.people.length.must.equal(1);
			done();
		});
	});

	it('can find users by handle using searchPeople()', function(done)
	{
		controller.searchdb.searchPeople([person.handle], function(err, results)
		{
			demand(err).not.exist();
			results.people.length.must.equal(1);
			done();
		});
	});


	it('can find the test user via GET', function(done)
	{
		var searcher = controller.searchdb;
		var requester = searcher.requester()
			.method('GET')
			.path('/sparky/people/' + person.id);
		requester.execute(function(err, resp, body)
		{
			demand(err).not.exist();
			body.id.must.equal(person.id);
			body._source.handle.must.equal(person.handle);
			done();
		});
	});

	*/
});
