var
    async = require('async'),
    bcrypt = require('bcrypt'),
    polyclay = require('polyclay'),
    util = require('util'),
    Story = require('./story')
    ;

var DAY_MS = 24 * 60 * 60 * 1000;

var ReadingLogEntry = polyclay.Model.buildClass(
{
    properties:
    {
        _id: 'string', // couchdb key
        version: 'number',
        owner: 'reference',
        target: 'reference',
        created: 'date',
        modified: 'date',
        visits: 'number',
        feedback: 'reference',
        review: 'reference',
        liked: 'boolean',
    },
    enumerables:
    {
        state: ['incomplete', 'complete', 'hidden']
    },
    optional: [ '_rev' ],
    required: [ 'owner_id', 'target_id', ],
    singular: 'readinglog',
    plural: 'readinglogs',
    initialize: function()
    {
        this.created = Date.now();
        this.version = 1;
        this.state = 0;
        this.visits = 1;
    },
});

polyclay.persist(ReadingLogEntry, '_id');

//-----------------------------------------------------------
// None of these methods save the edited object.

ReadingLogEntry.prototype.hide = function()
{
    // The reader has chosen to squelch this reading log entry.
    // We won't record any more visits for this item.
    this.state = 'hidden';
};

ReadingLogEntry.prototype.recordAction = function(action, target)
{
    if (this.state === 'hidden')
        return;

    switch (action)
    {
    case 'visit':
        this.recordVisit();
        break;

    case 'review':
        this.recordReview(target);
        break;

    case 'feedback':
        this.feedback = target;
        this.state = 1;
        break;

    case 'like':
        this.liked = true;
        this.state = 1;
        break;

    case 'unlike':
        this.liked = false;
        if (!this.review_id && !this.feedback_id)
            this.state = 0;
        break;

    default:
        console.log('unknown reading log action: ' + action);
    }
};

ReadingLogEntry.prototype.recordVisit = function()
{
    if (this.state === 'hidden')
        return;

    var now = Date.now();
    if ((now - this.modified) < DAY_MS)
        return; // we only record one visit per 24-hour period

    this.modified = now;
    this.visits++;
};

ReadingLogEntry.prototype.fetchTarget = function(callback)
{
    if (!this.target_id)
        return callback('no target id');

    var self = this;
    Story.get(self.target_id, function(err, fic)
    {
        self.target = fic;
        callback(err, fic);
    });
};

ReadingLogEntry.prototype.recordReview = function(target)
{
    this.review = target;
    this.modified = Date.now();
    if (this.state === 'hidden')
        return;

    if (target)
        this.state = 'complete';
    else if (!this.liked && !this.feedback_id)
        this.state = 'incomplete';
};

ReadingLogEntry.design =
{
    views:
    {
        by_target: { map: "function(doc) {\n  emit(doc.target_id, doc);\n}", language: "javascript" },
        by_owner: { map: "function(doc) {\n  emit(doc.owner_id, doc);\n}", language: "javascript" },
        by_owner_target: { map: "function(doc) {\n  emit(doc.owner_id, doc.target_id, doc);\n}", language: "javascript" },
    }
};

ReadingLogEntry.findByOwner = function(id, callback)
{
    ReadingLogEntry.adapter.db.view('readinglogs/by_owner', { key: id }, function(err, documents)
    {
        if (err) return callback(err);
        ReadingLogEntry.constructMany(documents, callback);
    });
};

ReadingLogEntry.findIDsByOwner = function(owner, callback)
{
    var value;

    if (typeof owner === 'object')
        owner = owner.key;

    ReadingLogEntry.adapter.db.view('readinglogs/by_owner', { key: owner }, function(err, structs)
    {
        var results = [];
        for (var i = 0; i < structs.length; i++)
        {
            value = structs[i].value;
            results.push( { id: value._id, rev: value._rev});
        }
        callback(null, results);
    });
};

ReadingLogEntry.removeByOwner = function(owner, callback)
{
    var makeRemoveFunc = function(id, rev)
    {
        return function(callback) { ReadingLogEntry.adapter.db.remove(id, rev, callback); };
    };

    ReadingLogEntry.findIDsByOwner(owner, function(err, structs)
    {
        var actionsList = [];
        for (var i = 0; i < structs.length; i++)
            actionsList.push(makeRemoveFunc(structs[i].id, structs[i].rev));

        async.parallel(actionsList, function(err, results)
        {
            callback(err, !err);
        });
    });
};

ReadingLogEntry.findByTarget = function(id, callback)
{
    ReadingLogEntry.adapter.db.view('readinglogs/by_target', { key: id }, function(err, documents)
    {
        if (err) return callback(err);
        ReadingLogEntry.constructMany(documents, callback);
    });
};

//-----------------------------------------------------------

module.exports = ReadingLogEntry;
