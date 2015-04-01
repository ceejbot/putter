// All logic for managing invitations.

var
	_           = require('lodash'),
	async       = require('async'),
	bole        = require('bole'),
	models      = require('../models'),
	sparkyutils = require('../utilities'),
	util        = require('util')
	;

var MAX_INVITES = 20;

var InvitationController = module.exports = function InvitationController()
{
	this.logger = bole('invitations');
}

InvitationController.prototype.addToCreator = function(person, count, callback)
{
	/*jshint loopfunc:true */
	if (person.standing !== 'good')
	{
		this.logger.info('declining to add invitations to ' + person.key + '; standing=' + person.standing);
		return callback(null, false);
	}

	var self = this;
	self.unusedByCreator(person, function(err, unused)
	{
		if (err) return callback(err);
		if (unused.length >= MAX_INVITES)
			return callback(null, 0);

		var toAdd = Math.min(MAX_INVITES - unused.length, count);
		var actions = [];
		for (var i = 0; i < toAdd; i++)
			actions.push(function(cb) { models.Invitation.generate(person, cb); });

		async.series(actions, function(err, replies)
		{
			callback(err, replies.length);
		});
	});
};

InvitationController.prototype.unusedByCreator = function(person, callback)
{
	this.allByCreator(person, function(err, items)
	{
		if (err) return callback(err);
		var result = _.filter(items, function(item) { return item.isValid(); });
		callback(null, result);
	});
};

InvitationController.prototype.usedByCreator = function(person, callback)
{
	this.allByCreator(person, function(err, items)
	{
		if (err) return callback(err);
		items = _.filter(items, function(item) { return item.consumed; });
		var ids = _.map(items, function(item) { return item.consumer_id; });

		models.Person.get(ids, function(err, consumers)
		{
			if (err) return callback(err);
			var result = _.zip(items, consumers);
			callback(null, result);
		});
	});
};

InvitationController.prototype.allByCreator = function(person, callback)
{
	models.Invitation.findByCreator(person, callback);
};
