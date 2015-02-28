var
    async    = require('async'),
    bcrypt   = require('bcrypt'),
    polyclay = require('polyclay'),
    util     = require('util'),
    Story    = require('./story')
    ;

var DAY_MS = 24 * 60 * 60 * 1000;

var ReadingLogEntry = module.exports = polyclay.Model.buildClass(
{
    properties:
    {
        id:      'string',
        version:  'number',
        owner:    'reference',
        target:   'reference',
        created:  'date',
        modified: 'date',
        visits:   'number',
        feedback: 'reference',
        review:   'reference',
        liked:    'boolean',
    },
    enumerables:
    {
        state: ['incomplete', 'complete', 'hidden']
    },
    required: [ 'owner_id', 'target_id', ],
    index: [ 'owner_id', 'target_id' ],
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

polyclay.persist(ReadingLogEntry, 'id');

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
        by_owner_target: { map: "function(doc) {\n  emit(doc.owner_id, doc.target_id, doc);\n}", language: "javascript" },
    }
};

ReadingLogEntry.removeByOwner = function(owner, callback)
{
    // TODO
};
