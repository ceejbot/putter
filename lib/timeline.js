// Secondary index abstraction.
// Maintains a scored set of whatever you choose pass in.

const
	_      = require('lodash'),
	assert = require('assert')
	;

var Timeline = module.exports = function Timeline(options)
{
	assert(options, 'no options hash provided to Timeline()');
	assert(options.redis, 'no redis client provided to Timeline()');
	assert(options.name, 'no index name provided to Timeline()');

	this.redis = options.redis;

	this.keyspace = options.name;
	this.keyspace += ':index';

	this.cap = _.isDefined(options.cap) ? options.cap : -1;
};

Timeline.prototype.count = function(callback)
{
	this.redis.zcard(this.keyspace, callback);
};

Timeline.prototype.all = function(callback)
{
	this.redis.zrevrange(this.keyspace, 0, -1, callback);
};

Timeline.prototype.page = function(page, pagesize, callback)
{
	var end = page * pagesize;
	var start = end - pagesize;
	this.redis.zrevrange(this.keyspace, start, end - 1, callback);
};

Timeline.prototype.add = function(key, score, callback)
{
	this.redis.zadd(this.keyspace, score, key, callback);
};

Timeline.prototype.remove = function(key, callback)
{
	this.redis.zrem(this.keyspace, key, callback);
};
