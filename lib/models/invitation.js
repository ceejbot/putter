var
	assert   = require('assert'),
	polyclay = require('polyclay'),
	util     = require('util'),
	uuid     = require('node-uuid'),
	mixins   = require('./mixins')
	;

var Invitation = module.exports = polyclay.Model.buildClass(
{
	properties:
	{
		id:       'string',
		version:  'number',
		creator:  'reference',
		consumer: 'reference',
		consumed: 'boolean',
	},
	required: [ 'creator_id', 'created', ],
	index: [ 'creator_id', 'consumer_id' ],
	singular: 'invitation',
	plural: 'invitations',
	initialize: function()
	{
		this.created = Date.now();
		this.consumed = false;
		this.version = 1;
	},
});

polyclay.mixin(Invitation, mixins.HasTimestamps);
polyclay.persist(Invitation, 'id');

Invitation.generate = function(creator, callback)
{
	assert(creator);
	var invitation = new Invitation();
	invitation.key = uuid.v4();
	invitation.creator = creator;

	invitation.save(function(err, resp)
	{
		callback(err, invitation);
	});
};

Invitation.prototype.consume = function(consumer, callback)
{
	this.consumed = true;
	this.consumer = consumer;
	this.modified = Date.now();
	this.save(callback);
};

Invitation.prototype.isValid = function()
{
	return !this.consumed;
};

Invitation.isValid = function(key, callback)
{
	Invitation.get(key, function(err, invite)
	{
		if (err && err.error === 'not_found') return callback(null, 'Invitation code invalid.', false);
		if (err) return callback(err);
		if (!invite) return callback(null, 'Invitation not found.', false);
		if (!invite.isValid()) return callback(null, 'That invitation code has already been used.', false);

		callback(null, null, invite);
	});
};

//----------------------------------------------------------------------

module.exports = Invitation;
