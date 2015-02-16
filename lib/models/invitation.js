var
    assert = require('assert'),
    polyclay = require('polyclay'),
    util = require('util'),
    uuid = require('node-uuid'),
    mixins = require('./mixins')
    ;

//----------------------------------------------------------------------

var Invitation = polyclay.Model.buildClass(
{
    properties:
    {
        _id: 'string', // couchdb key
        version: 'number',
        creator: 'reference',
        consumer: 'reference',
        consumed: 'boolean',
    },
    optional: [ '_rev' ],
    required: [ 'creator_id', 'created', ],
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
polyclay.persist(Invitation, '_id');

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

Invitation.design =
{
    views:
    {
        by_creator: { map: 'function(doc) {\n  emit(doc.creator_id, doc);\n}' },
        by_consumer: { map: 'function(doc) {\n  emit(doc.consumer_id, doc);\n}' }
    }
};

Invitation.findByCreator = function(id, callback)
{
    if (typeof id === 'object')
        id = id.key;

    Invitation.adapter.db.view('invitations/by_creator', { key: id }, function(err, documents)
    {
        if (err) return callback(err);
        Invitation.constructMany(documents, callback);
    });
};

Invitation.findByConsumer = function(id, callback)
{
    if (typeof id === 'object')
        id = id.key;

    Invitation.adapter.db.view('invitations/by_consumer', { key: id }, function(err, documents)
    {
        if (err) return callback(err);
        Invitation.constructMany(documents, callback);
    });
};

//----------------------------------------------------------------------

module.exports = Invitation;
