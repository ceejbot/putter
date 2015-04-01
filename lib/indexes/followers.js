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

PeopleCatalog.prototype.socialGraph = function(pkey)
{
	return this.redback.createSocialGraph(pkey, '^people');
};

// public API starts here

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
