var
    marked = require('marked'),
    polyclay = require('polyclay'),
    util = require('util')
    ;

/*
Research topics:
    twitter integration
    tumblr integration

    whitelisting for allowed embeds
    analytics whitelist (I don't want to track stats)
*/

var Profile = polyclay.Model.buildClass(
{
    properties:
    {
        id: 'string',
        version: 'number',
        handle: 'string', // handle of owner
        created: 'date',
        modified: 'date',
        profile: 'string', // profile text
        banner: 'string', // url of image
        worksafe: 'boolean',
        promoted_fic: 'array', // array of fic ids, length-capped
        promoted_reviews: 'array', // array of review ids
        // integration with social networks via oauth
        twitter: 'hash',
        tumblr: 'hash',
    },
    required: [ 'handle',  ],
    singular: 'profile',
    plural: 'profiles',
    index: [ 'handle' ],
    initialize: function()
    {
        this.created = Date.now();
        this.version = 1;
    },
});

polyclay.persist(Profile, 'id');

Profile.prototype.rendered = function()
{
    return marked(this.profile);
};

Profile.searchMapping =
{
    'profiles':
    {
        properties:
        {
            'id': { type: 'string', index: 'not_analyzed', include_in_all: false },
            handle: { type: 'string', analyzer: 'keyword', store: 'yes'},
            profile: { type: 'string', store: 'yes'},
        }
    },
};

Profile.prototype.searchData = function()
{
    return {
        type: this.plural,
        id: this.key,
        handle: this.handle,
        profile: this.profile,
    };
};

Profile.design =
{
    views:
    {
        by_handle: { map: "function(doc) {\n  emit(doc.handle, doc);\n}" }
    }
};

module.exports = Profile;
