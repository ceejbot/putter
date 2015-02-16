var
    async = require('async'),
    marked = require('marked'),
    polyclay = require('polyclay'),
    util = require('util'),
    mixins = require('./mixins')
    ;

var Review = polyclay.Model.buildClass(
{
    properties:
    {
        _id: 'string', // couchdb key
        version: 'number',
        target: 'reference',
        tags: 'array', // of string
        title: 'string',
        content: 'string',
        rendered: 'string'
    },
    optional: [ '_rev' ],
    required: [ 'owner_id', 'target_id', ],
    singular: 'review',
    plural: 'reviews',
    initialize: function()
    {
        this.created = Date.now();
        this.version = 1;
    },
});

polyclay.persist(Review, '_id');
polyclay.mixin(Review, mixins.HasOwner);
polyclay.mixin(Review, mixins.HasTimestamps);

//-----------------------------------------------------------

Review.prototype.beforeSave = function()
{
    this.modified = Date.now();
    this.rendered = marked(this.content);
};

Review.prototype.excerpt = function()
{
    // TODO a better excerpting algorithm
    return this.rendered.substring(0, 250);
};

Review.design =
{
    views:
    {
        by_target: { map: "function(doc) {\n  emit(doc.target_id, doc);\n}", language: "javascript" },
        by_owner: { map: "function(doc) {\n  emit(doc.owner_id, doc);\n}", language: "javascript" },
        by_owner_target: { map: "function(doc) {\n  emit(doc.owner_id + '|' + doc.target_id, doc);\n}", language: "javascript" },
    }
};

Review.findByOwner = function(id, callback)
{
    if (typeof id === 'object')
        id = id.key;

    Review.adapter.db.view('reviews/by_owner', { key: id }, function(err, documents)
    {
        if (err) return callback(err);
        Review.constructMany(documents, callback);
    });
};

Review.findIDsByOwner = function(owner, callback)
{
    var value;

    if (typeof owner === 'object')
        owner = owner.key;

    Review.adapter.db.view('reviews/by_owner', { key: owner }, function(err, structs)
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

Review.removeByOwner = function(owner, callback)
{
    var makeRemoveFunc = function(id, rev)
    {
        return function(callback) { Review.adapter.db.remove(id, rev, callback); };
    };

    Review.findIDsByOwner(owner, function(err, structs)
    {
        var actionsList = [];
        for (var i = 0; i < structs.length; i++)
        {
            actionsList.push(makeRemoveFunc(structs[i].id, structs[i].rev));
        }

        async.parallel(actionsList, function(err, results)
        {
            callback(err, !err);
        });
    });
};

Review.findByTarget = function(id, callback)
{
    if (typeof id === 'object')
        id = id.key;

    Review.adapter.db.view('reviews/by_target', { key: id }, function(err, documents)
    {
        if (err) return callback(err);
        Review.constructMany(documents, callback);
    });
};

Review.findByOwnerTarget = function(owner_id, target_id, callback)
{
    var key =  owner_id + '|' + target_id;
    Review.adapter.db.view('reviews/by_owner_target', { 'key': key }, function(err, documents)
    {
        if (err) return callback(err);
        Review.constructMany(documents, callback);
    });
};

//-----------------------------------------------------------

module.exports = Review;
