var
	_ = require('lodash'),
	async = require('async'),
	polyclay = require('polyclay'),
	util = require('util'),
	mixins = require('./mixins')
	;

var Subscription = module.exports = polyclay.Model.buildClass(
{
	properties:
	{
		id: 'string', // couchdb key
		version: 'number',
		person: 'reference',
		tags: 'array',
		fandom: 'reference',
		active: 'boolean',
	},
	required: [ 'owner_id', ],
	singular: 'subscription',
	plural: 'subscriptions',
	initialize: function()
	{
		this.created = Date.now();
		this.modified = this.created;
		this.tags = [];
		this.active = true;
		this.version = 1;
	},
});

polyclay.persist(Subscription, 'id');
polyclay.mixin(Subscription, mixins.HasOwner);
polyclay.mixin(Subscription, mixins.HasTimestamps);

Subscription.prototype.kind = function()
{
	if (this.person_id)
		return 'person';
	if (this.fandom_id)
		return 'fandom';

	return 'tags';
};

Subscription.prototype.match = function(item)
{
	// true if complete match, false otherwise
	if (this.person_id && (this.person_id !== item.owner_id))
		return false;

	var fandom = item.fandom || item.fandom_id;
	if (this.fandom_id && (this.fandom_id !== fandom))
		return false;

	if (this.tags.length === 0)
		return true;

	var missing = _.difference(this.tags, item.tags || []);
	return missing.length === 0;
};

Subscription.prototype.validator = function()
{
	if (this.person_id)
		return true;

	if (this.fandom_id)
		return true;

	if (this.tags.length)
		return true;

	if (!this.errors) this.errors = {};
	this.errors.kind = 'subscription needs a person, fandom, or at least one tag';
	return false;
};

Subscription.design =
{
	views:
	{
		by_owner: { map: 'function(doc) {\n  emit(doc.owner_id, doc);\n}', language: 'javascript' },
	}
};

Subscription.findByOwner = function(id, callback)
{
	if (typeof id === 'object')
		id = id.key;

	Subscription.adapter.db.view('subscriptions/by_owner', { key: id }, function(err, documents)
	{
		if (err) return callback(err);
		Subscription.constructMany(documents, callback);
	});
};

Subscription.findIDsByOwner = function(owner, callback)
{
	var value;

	if (typeof owner === 'object')
		owner = owner.key;

	Subscription.adapter.db.view('subscriptions/by_owner', { key: owner }, function(err, structs)
	{
		if (err) return callback(err);

		var results = [];
		for (var i = 0; i < structs.length; i++)
		{
			value = structs[i].value;
			results.push( { id: value._id, rev: value._rev});
		}
		callback(null, results);
	});
};

Subscription.removeByOwner = function(owner, callback)
{
	// TODO
};
