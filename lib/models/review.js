var
    async = require('async'),
    marked = require('marked'),
    polyclay = require('polyclay'),
    util = require('util'),
    mixins = require('./mixins')
    ;

var Review = module.exports = polyclay.Model.buildClass(
{
    properties:
    {
        id: 'string',
        version: 'number',
        target: 'reference',
        tags: 'array', // of string
        title: 'string',
        content: 'string',
        rendered: 'string'
    },
    required:   [ 'owner_id', 'target_id', ],
    index:      [ 'owner_id', 'target_id', ],
    singular:   'review',
    plural:     'reviews',
    initialize: function()
    {
        this.created = Date.now();
        this.version = 1;
    },
});

polyclay.persist(Review, 'id');
polyclay.mixin(Review, mixins.HasOwner);
polyclay.mixin(Review, mixins.HasTimestamps);

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
        by_owner_target: { map: "function(doc) {\n  emit(doc.owner_id + '|' + doc.target_id, doc);\n}", language: "javascript" },
    }
};

Review.removeByOwner = function(owner, callback)
{
    // TODO
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
