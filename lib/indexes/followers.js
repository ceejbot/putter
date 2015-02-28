var
	_ = require('lodash'),
	async = require('async'),
	base = require('./base'),
	util = require('util')
	;

//----------------------------------------------------------------------
// people index / social graph


function PeopleCatalog() { }
util.inherits(PeopleCatalog, base.RedisProvider);

//----------------------------------------------------------------------

PeopleCatalog.prototype.keyGenerator = function()
{
	if (!this.keygen)
		this.keygen = this.redback.createKeyPair('^people');

	return this.keygen;
};

PeopleCatalog.prototype.socialGraph = function(pkey)
{
	return this.redback.createSocialGraph(pkey, '^people');
};

// public API starts here

PeopleCatalog.prototype.generateKey = function(handle, callback)
{
	// assumption is that handle is already cleaned
	this.keyGenerator().add(handle, callback);
};

PeopleCatalog.prototype.lookup = function(people, callback)
{
	if (parseInt(people, 10).toString() === people)
		return callback(null, people);
	if (typeof people === 'string')
		return this.keyGenerator().get(people, callback);
	if (!_.isArray(people))
		return callback(null, people.key);

	var lookuplist = {};
	for (var i = 0; i < people.length; i++)
	{
		if (parseInt(people[i], 10).toString() === people[i])
			people[i] = people[i];
		else if (typeof people[i] === 'string')
			lookuplist[people[i]] = i;
		else if (typeof people[i] === 'object')
			people[i] = people[i].key;
	}

	var toLookUp = Object.keys(lookuplist);
	if (toLookUp.length === 0)
		return callback(null, people);

	this.keyGenerator().get(toLookUp, function(err, results)
	{
		for (var i = 0; i < results.length; i++)
		{
			var idx = lookuplist[toLookUp[i]];
			people[idx] = results[i];
		}
		return callback(null, people);
	});
	return;
};

PeopleCatalog.prototype.idsToHandle = function(ids, callback)
{
	this.keyGenerator().getById(ids, callback);
};

PeopleCatalog.prototype.lookupByEmail = function(email, callback)
{
	this.redis.hget('^people:email', email, callback);
};

PeopleCatalog.prototype.recordEmail = function(person, email, callback)
{
	this.redis.hset('^people:email', email, person.key, callback);
};

PeopleCatalog.prototype.follow = function(person, users, callback)
{
	var self = this;
	self.lookup(person, function(err, pkey)
	{
		self.lookup(users, function(err, followees)
		{
			self.socialGraph(pkey).follow(followees, callback);
		});
	});
};

PeopleCatalog.prototype.unfollow = function(person, users, callback)
{
	var self = this;
	self.lookup(person, function(err, pkey)
	{
		self.lookup(users, function(err, followees)
		{
			self.socialGraph(pkey).unfollow(followees, callback);
		});
	});
};

PeopleCatalog.prototype.following = function(handle, callback)
{
	var self = this;
	self.lookup(handle, function(err, pkey)
	{
		self.socialGraph(pkey).getFollowing(callback);
	});
};

PeopleCatalog.prototype.followingByHandle = function(handle, callback)
{
	var self = this;
	self.lookup(handle, function(err, pkey)
	{
		self.socialGraph(pkey).getFollowing(function(err, ids)
		{
			self.idsToHandle(ids, callback);
		});
	});
};

PeopleCatalog.prototype.countFollowing = function(handle, callback)
{
	var self = this;
	self.lookup(handle, function(err, pkey)
	{
		self.socialGraph(pkey).countFollowing(callback);
	});
};

PeopleCatalog.prototype.followers = function(handle, callback)
{
	var self = this;
	self.lookup(handle, function(err, pkey)
	{
		self.socialGraph(pkey).getFollowers(callback);
	});
};

PeopleCatalog.prototype.followersByHandle = function(handle, callback)
{
	var self = this;
	self.lookup(handle, function(err, pkey)
	{
		self.socialGraph(pkey).getFollowers(function(err, ids)
		{
			self.idsToHandle(ids, callback);
		});
	});
};

PeopleCatalog.prototype.countFollowers = function(handle, callback)
{
	var self = this;
	self.lookup(handle, function(err, pkey)
	{
		self.socialGraph(pkey).countFollowers(callback);
	});
};

PeopleCatalog.prototype.isFollowing = function(handle, other, callback)
{
	var self = this;
	self.lookup(handle, function(err, pkey)
	{
		self.socialGraph(pkey).isFollowing(other, callback);
	});
};

PeopleCatalog.prototype.hasFollower = function(handle, other, callback)
{
	var self = this;
	self.lookup(handle, function(err, pkey)
	{
		self.socialGraph(pkey).hasFollower(other, callback);
	});
};

PeopleCatalog.prototype.getCommonFollowing = function(handle, users, callback)
{
	var self = this;
	self.lookup(handle, function(err, pkey)
	{
		self.socialGraph(pkey).getCommonFollowing(users, callback);
	});
};

PeopleCatalog.prototype.getCommonFollowers = function(handle, users, callback)
{
	var self = this;
	self.lookup(handle, function(err, pkey)
	{
		self.socialGraph(pkey).getCommonFollowers(users, callback);
	});
};

PeopleCatalog.prototype.getDifferentFollowing = function(handle, users, callback)
{
	var self = this;
	self.lookup(handle, function(err, pkey)
	{
		self.socialGraph(pkey).getDifferentFollowing(users, callback);
	});
};

PeopleCatalog.prototype.getDifferentFollowers = function(handle, users, callback)
{
	var self = this;
	self.lookup(handle, function(err, pkey)
	{
		self.socialGraph(pkey).getDifferentFollowers(users, callback);
	});
};

PeopleCatalog.prototype.removePerson = function(person, callback)
{
	var self = this;
	self.lookup(person, function(err, pkey)
	{
		if (err) return callback(err, false);

		var graph = self.socialGraph(pkey);
		graph.getFollowing(function(err, following)
		{
			graph.getFollowers(function(err, followers)
			{
				// TODO all followers should unfollow this guy
				var actions = [];
				actions.push(function(cb) { graph.unfollow(following, cb); });
				actions.push(function(cb) { self.removeAllLogs(person, cb); });
				actions.push(function(cb) { self.keyGenerator().delete(person.handle, cb); });

				async.series(actions, callback);
			});
		});
	});
};

//----------------------------------------------------------------------

function makeLogListKey(pkey)
{
	return '^people:loglist:' + pkey;
}

function makeLogLookupKey(pkey)
{
	return '^people:logs:' + pkey;
}

PeopleCatalog.prototype.recordLogEntry = function(person, document, entry, callback)
{
	var self = this;
	self.lookup(person, function(err, pkey)
	{
		var chain = self.redis.multi();

		chain.hset(makeLogLookupKey(pkey), document.key, entry.key);
		chain.zadd(makeLogListKey(pkey), entry.created.getTime(), entry.key);
		chain.exec(function(err, replies)
		{
			callback(err, !err);
		});
	});
};

PeopleCatalog.prototype.getLogEntry = function(person, document, callback)
{
	var self = this;
	self.lookup(person, function(err, pkey)
	{
		self.redis.hget(makeLogLookupKey(pkey), document.key, callback);
	});
};

PeopleCatalog.prototype.logEntryCount = function(person, callback)
{
	var self = this;
	self.lookup(person, function(err, pkey)
	{
		self.redis.hlen(makeLogLookupKey(pkey), callback);
	});
};

PeopleCatalog.prototype.logsByPage = function(person, page, pagesize, callback)
{
	var self = this;

	if (page < 1) page = 1;
	var end = page * pagesize;
	var start = end - pagesize;

	self.lookup(person, function(err, pkey)
	{
		self.redis.zrevrange(makeLogListKey(pkey), start, end - 1, callback);
	});
};

PeopleCatalog.prototype.removeAllLogs = function(person, callback)
{
	var chain = this.redis.multi();
	this.lookup(person, function(err, pkey)
	{
		chain.del(makeLogLookupKey(pkey));
		chain.del(makeLogListKey(pkey));
		chain.exec(function(err, replies)
		{
			callback(err);
		});
	});
};

//----------------------------------------------------------------------
exports.PeopleCatalog = PeopleCatalog;
