var
	_           = require('lodash'),
	async       = require('async'),
	bole        = require('bole'),
	events      = require('events'),
	polyclay    = require('polyclay'),
	redis       = require('redis'),
	util        = require('util'),
	sparkyutils = require('../utilities'),
	models      = require('../models')
	;

function StreamController(options)
{
	// Three filters: people, tags, fandoms
	// On subscription creation, we add each match item from the subscription to the
	// filter. Person & Fandom subscriptions do not have their tags added, just the core
	// item that's being tracked. If a subscription has both person & a fandom criteria,
	// we treat it as a person subscription.
	events.EventEmitter.call(this);

	this.options = options;
	this.logger = bole('streams');
	this.redis = redis.createClient(options.port, options.host);

	this.redis.on('error', function(err)
	{
		this.logger.error('lost connection to redis @ ' + options.host + ':' + options.port);
	}.bind(this));

	this.redis.select(options.db, function(err, reply)
	{
		this.emit('ready');
	}.bind(this));
}
util.inherits(StreamController, events.EventEmitter);

StreamController.prototype.subscribe = function(options, callback)
{
	// Options is a hash containing all the info needed to build a subscription
	var self = this;

	var sub = new models.Subscription();
	sub.update(options);
	sub.key = sparkyutils.randomID();
	if (!sub.valid())
		return callback(sub.errors);

	// store subscription id in the relevant indexes: per owner, per tag, per fandom
	var actions = [];
	actions.push(function(cb) { sub.save(cb); });

	switch(sub.kind())
	{
	case 'person':
		actions.push(function(cb) { self.redis.sadd('psubs:'+sub.person_id, sub.key, cb); });
		break;

	case 'fandom':
		actions.push(function(cb) { self.redis.sadd('fsubs:'+sub.fandom_id, sub.key, cb); });
		break;

	case 'tags':
		var chain = this.redis.multi();
		for (var i = 0; i < sub.tags.length; i++)
			chain.sadd('tsubs:' + sub.tags[i], sub.key);
		actions.push(function(cb) { chain.exec(cb); });
		break;
	}

	async.parallel(actions, function(err, results)
	{
		if (err)
		{
			self.logger.error('problem saving subscription:', err.message);
			return callback(err);
		}

		callback(null, sub);
	});
};

StreamController.prototype.unsubscribe = function(sub, callback)
{
	var self = this;
	var actions = [];

	actions.push(function(cb) { sub.destroy(cb); });

	switch(sub.kind())
	{
	case 'person':
		actions.push(function(cb) { self.redis.srem('psubs:'+sub.person_id, sub.key, cb); });
		break;

	case 'fandom':
		actions.push(function(cb) { self.redis.srem('fsubs:'+sub.fandom_id, sub.key, cb); });
		break;

	case 'tags':
		var chain = this.redis.multi();
		for (var i = 0; i < sub.tags.length; i++)
			chain.srem('tsubs:' + sub.tags[i], sub.key);
		actions.push(function(cb) { chain.exec(cb); });
		break;
	}

	async.parallel(actions, function(err, results)
	{
		if (err)
		{
			self.logger.error('problem destroying subscription:', err.message);
			return callback(err);
		}

		callback(null, sub);
	});
};

StreamController.prototype.fanout = function(item, callback)
{
	// Things that can trigger subscriptions are Story, Review, Series
	// All have the HasOwner mixin.
	var self = this;

	var sets = [];
	sets.push('psubs:' + item.owner_id);
	if (item.fandom_id)
		sets.push('fsubs:' + item.fandom_id);
	if (item.tags && item.tags.length)
	{
		_.each(item.tags, function(t)
		{
			sets.push('tsubs:' + t);
		});
	}

	this.redis.sunion(sets, function(err, subids)
	{
		if (err)
		{
			self.logger.error('fetching subscription union for ' + sets.length + ' items');
			return callback(err);
		}

		if (!subids || !subids.length)
			return callback(null, 0);

		models.Subscription.get(subids, function(err, subscriptions)
		{
			if (err)
			{
				self.logger.error('fetching subscription list for ' + subids.length + ' items');
				return callback(err);
			}

			var matches = subscriptions.filter(function(s) { return s.match(item); });
			var targets = matches.map(function(s) { return s.owner_id; });
			targets = _.uniq(targets);
			if (!targets.length)
				return callback(null, 0);

			// targets contains the ids of all the people who need to have this item added to their streams
			var item_key = item.singular + ':' + item.key;
			self.logger.info('adding ' + item_key + ' to ' + targets.length + ' feeds');
			var chain = self.redis.multi();
			_.each(targets, function(id)
			{
				var fid = 'feed:' + id;
				chain.lpush(fid, item_key);
				chain.ltrim(fid, 0, 500);
			});

			chain.exec(function(err, replies)
			{
				if (err) return callback(err);

				callback(null, targets.length);
			});
		});
	});
};

StreamController.prototype.byPerson = function(person, callback)
{
	var self = this;
	if (typeof person === 'object')
		person = person.key;

	this.redis.lrange('feed:' + person, 0, -1, function(err, ids)
	{
		// Now we want to batch-fetch the objects from couch then reassemble them in the original order.
		var kinds = {};
		for (var i = 0; i < ids.length; i++)
		{
			var slices = ids[i].split(':');

			if (!kinds[slices[0]])
				kinds[slices[0]] = [];
			kinds[slices[0]].push(slices[1]);
		}

		var actions = [];
		if (kinds.story)
			actions.push(function(cb) { models.Story.get(kinds.story, cb); });
		if (kinds.review)
			actions.push(function(cb) { models.Review.get(kinds.review, cb); });
		if (kinds.series)
			actions.push(function(cb) { models.Series.get(kinds.series, cb); });

		async.parallel(actions, function(err, replies)
		{
			if (err)
			{
				self.logger.error('failure fetching feed for ' + person.key, '; err=' + err.message);
				return callback(err, []);
			}

			var allobjects = [];
			for (var i = 0; i < replies.length; i++)
				allobjects = allobjects.concat(replies[i]);

			var result = new Array(ids.length);
			for (i = 0; i < allobjects.length; i++)
			{
				var obj = allobjects[i];
				var k = obj.singular + ':' + obj.key;
				var idx = ids.indexOf(k);
				result[idx] = obj;
			}

			callback(null, result);
		});
	});
};

StreamController.prototype.removeAllByOwner = function(owner, callback)
{
	var self = this;
	if (typeof owner === 'object')
		owner = owner.key;

	models.Subscription.findByOwner(owner, function(err, subs)
	{
		async.each(subs, self.unsubscribe.bind(self), function(err)
		{
			self.redis.del('feed:' + owner, function(err, reply)
			{
				callback(err);
			});
		});
	});
};

module.exports = StreamController;
