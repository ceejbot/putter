var
    async = require('async'),
    marked = require('marked'),
    polyclay = require('polyclay'),
    util = require('util'),
    mixins = require('./mixins')
    ;

var Comment = polyclay.Model.buildClass(
{
    properties:
    {
        _id: 'string', // couchdb key
        version: 'number',
        target: 'reference',
        parent: 'reference',
        title: 'string',
        content: 'string',
        editable: 'boolean',
    },
    enumerables:
    {
        state: ['visible', 'hidden', 'deleted', 'usergone']
    },
    optional: [ '_rev' ],
    required: [ 'owner_id', 'target_id', 'parent_id', 'state'],
    singular: 'comment',
    plural: 'comments',
    initialize: function()
    {
        this.created = Date.now();
        this.modified = this.created;
        this.editable = true;
        this.version = 1;
        this.state = 0;
    },
});

polyclay.persist(Comment, '_id');
polyclay.mixin(Comment, mixins.HasOwner);
polyclay.mixin(Comment, mixins.HasTimestamps);

Comment.prototype.rendered = function()
{
    return marked(this.content);
};

Comment.parentID = function(id)
{
    if (!id)
        return '';
    var splitAt = id.lastIndexOf(':');
    if (splitAt === -1)
        return '';
    var parent = id.substring(0, splitAt);

    return parent;
};

Comment.prototype.parentID = function()
{
    return Comment.parentID(this.key);
};

Comment.commentListToTree = function(comments)
{
    var result = {};
    var current, previous, parent;

    while (comments.length > 0)
    {
        current = comments.shift();
        parent = current.parentID();
        if (!result[parent])
            result[parent] = [];
        result[parent].push(current);
    }

    return result;
};

//-----------------------------------------------------------
// None of these methods save the edited object.

Comment.prototype.canBeRepliedTo = function()
{
    return (this.state === 'visible');
};

Comment.prototype.edit = function(content, title)
{
    if (!this.editable)
        return false;

    this.content = content;
    this.title = title;
    this.touch();
    return true;
};

Comment.prototype.freeze = function()
{
    this.editable = false;
};

Comment.prototype.hide = function()
{
    // The owner of the commented-upon document has chosen to squelch this comment.
    // The permissions are enforced elsewhere; we just maintain internal data
    // consistency at this layer.
    this.state = 'hidden';
};

Comment.prototype.unhide = function()
{
    if (this.state === 'hidden')
        this.state = 'visible';
};

Comment.prototype.markAsDeleted = function(byWhom)
{
    // We don't delete the comment object because it might still be required
    // as a parent for sub-threads. We do remove its content, however.
    switch (byWhom)
    {
    case 'owner':
        this.content = '*This comment has been deleted by its author.*';
        break;

    case 'administrator':
        this.content = '*This comment has been deleted by an administrator.*';
        break;

    case 'usergone':
        this.content = '*The author of this comment has left the archive.*';
        break;

    default:
        this.content = '*This comment has been deleted.*';
    }

    this.title = '';
    this.state = 'deleted';
};

Comment.design =
{
    views:
    {
        by_target: { map: "function(doc) {\n  emit(doc.target_id, doc);\n}", language: "javascript" },
        by_owner: { map: "function(doc) {\n  emit(doc.owner_id, doc);\n}", language: "javascript" },
        by_owner_target: { map: "function(doc) {\n  emit(doc.owner_id + '|' + doc.target_id, doc);\n}", language: "javascript" },
    }
};

Comment.findByOwner = function(id, callback)
{
    if (typeof id === 'object')
        id = id.key;

    Comment.adapter.db.view('comments/by_owner', { key: id }, function(err, documents)
    {
        if (err) return callback(err);
        Comment.constructMany(documents, callback);
    });
};

Comment.findIDsByOwner = function(owner, callback)
{
    var value;

    if (typeof owner === 'object')
        owner = owner.key;

    Comment.adapter.db.view('comments/by_owner', { key: owner }, function(err, structs)
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

Comment.removeByOwner = function(owner, callback)
{
    var makeRemoveFunc = function(id, rev)
    {
        return function(callback) { Comment.adapter.db.remove(id, rev, callback); };
    };

    Comment.findIDsByOwner(owner, function(err, structs)
    {
        if (err) return callback(err);

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

Comment.findByTarget = function(id, callback)
{
    if (typeof id === 'object')
        id = id.key;

    Comment.adapter.db.view('comments/by_target', { key: id }, function(err, documents)
    {
        if (err) return callback(err);
        Comment.constructMany(documents, callback);
    });
};

Comment.findByOwnerTarget = function(owner_id, target_id, callback)
{
    var key =  owner_id + '|' + target_id;
    Comment.adapter.db.view('comments/by_owner_target', { 'key': key }, function(err, documents)
    {
        if (err) return callback(err);
        Comment.constructMany(documents, callback);
    });
};

module.exports = Comment;
