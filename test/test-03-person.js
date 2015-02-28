/*global describe:true, it:true, before: true, after:true */

var
	_       = require('lodash'),
	demand  = require('must'),
	helpers = require('./helpers'),
	Person  = require('../lib/models/person'),
	putil   = require('../lib/utilities'),
	Rethink = require('polyclay-rethink'),
	Putter  = require('../lib/controllers/putter')
	;

describe('Person model', function()
{
	var controller;
	var people = [];
	var fixtures = [];
	var savedID, idToCheck, person, person2, config;

	before(function(done)
	{
		var config = putil.loadConfig(__dirname + '/fixtures/test-config.toml');
		controller = new Putter(config);

		fixtures.push(helpers.readFixture('person1'));
		fixtures.push(helpers.readFixture('person2'));
		fixtures.push(helpers.readFixture('person3'));
		controller.once('ready', done);
		controller.provision();
	});

	it('can be constructed', function()
	{
		person = new Person();
		person.update(fixtures[0]);
		person.created = Date.now();
		person.setPassword('test');
		people.push(person);
	});

	it('can save the test user', function(done)
	{
		controller.savePerson(person, function(err, response)
		{
			demand(err).not.exist();
			person.key.must.exist();
			person.key.must.be.a.string();
			done();
		});
	});

	it('salts and hashes the password', function()
	{
		person.p_password.must.not.equal('test');
	});

	it('can retrieve the test user from the db by id', function(done)
	{
		controller.personByID(person.key, function(err, retrieved)
		{
			demand(err).not.exist();
			retrieved.must.exist();
			retrieved.key.must.equal(person.key);
			retrieved.handle.must.equal(fixtures[0].handle);
			retrieved.email.must.equal(fixtures[0].email);
			done();
		});
	});

	it('can retrieve the test user from the db by email', function(done)
	{
			controller.personByEmail(fixtures[0].email, function(err, retrieved)
		{
			demand(err).not.exist();
			retrieved.must.exist();
			retrieved.email.must.equal(fixtures[0].email);
			retrieved.id.must.equal(person.id);
			done();
		});
	});

	it('the controller can retrieve the person', function(done)
	{
		controller.personByHandle(person.handle, function(err, retrieved)
		{
			demand(err).not.exist();
			retrieved.must.exist();
			retrieved.id.must.equal(person.id);
			retrieved.handle.must.equal(fixtures[0].handle);
			done();
		});
	});

	it('can create and save a second person', function(done)
	{
		person2 = new Person();
		person2.update(fixtures[1]);
		person2.created = Date.now();
		person2.setPassword('test');
		controller.savePerson(person2, function(err, response)
		{
			demand(err).not.exist();
			person2.key.must.exist();
			person2.key.must.be.a.string();
			people.push(person2);
			done();
		});
	});

/*
	it('adds handles to the autocompletion database', function(done)
	{
		var prefix = person.handle.substring(0, person.handle.length/2) + ' ';
		controller.autocompleteHandle(person.handle, function(err, completions)
		{
			demand(err).not.exist();
			completions.must.be.an.array();
			completions.length.must.be.above(0);
			completions.indexOf(person.handle).must.be.above(-1);
			done();
		});
	});

*/

/*
	describe('following & notifications', function()
	{
		it('one person can follow another', function(done)
		{
			controller.follow(person2, [person, person2], function(err, result)
			{
				demand(err).not.exist();
				done();
			});
		});

		it('the target appears in the following list', function(done)
		{
			controller.following(person2.handle, function(err, following)
			{
				demand(err).not.exist();
				helpers.findCouchModelInList(person.id, following).must.not.equal(-1);
				done();
			});
		});

		it('the follower appears in the target\'s followers list', function(done)
		{
			controller.followers(person.handle, function(err, result)
			{
				demand(err).not.exist();
				helpers.findCouchModelInList(person2.id, result).must.not.equal(-1);
				done();
			});
		});

		it('can fetch followers as handles', function(done)
		{
			controller.followersByHandle(person, function(err, result)
			{
				demand(err).not.exist();
				result.indexOf(person2.handle).must.not.equal(-1);
				done();
			});
		});

		it('can fetch following as handles', function(done)
		{
			controller.followingByHandle(person2, function(err, result)
			{
				demand(err).not.exist();
				result.indexOf(person2.handle).must.not.equal(-1);
				done();
			});
		});

		it('can unfollow by handle', function(done)
		{
			controller.unfollow(person2, person.handle, function(err, result)
			{
				demand(err).not.exist();

				controller.followers(person, function(err, followers)
				{
					demand(err).not.exist();
					followers.must.exist();
					followers.must.be.an.array();
					helpers.findCouchModelInList(person2, followers).must.equal(-1);
					done();
				});
			});
		});

		it('can unfollow by id', function(done)
		{
			controller.unfollow(person2.id, person2.id, function(err, result)
			{
				demand(err).not.exist();
				controller.followers(person2, function(err, followers)
				{
					helpers.findCouchModelInList(person2, followers).must.equal(-1);
					done();
				});
			});
		});

		// notification system tests

	});

*/
});
