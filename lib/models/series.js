var
	polyclay = require('polyclay'),
	strftime = require('prettydate').strftime,
	util = require('util'),
	mixins = require('./mixins')
	;

var Series = module.exports = polyclay.Model.buildClass(
{
	properties: {
		id:          'string', // couchdb key
		version:      'number',
		created:      'date',
		modified:     'date',
		is_published: 'boolean',
		title:        'string',
		summary:      'string',
		notes:        'string',
		stories:      'array',
		banner:       'string',
	},
	required: [ 'owner_id', 'title' ],
	index: [ 'owner_id', 'owner_handle' ],
	singular: 'series',
	plural: 'series',
	initialize: function()
	{
		this.created = Date.now();
		this.version = 1;
	},
});

polyclay.persist(Series, 'id');
polyclay.mixin(Series, mixins.HasOwner);

//-----------------------------------------------------------
// search

Series.searchMapping =
{
	'series':
	{
		properties:
		{
			'id': { type: 'string', index: 'not_analyzed', include_in_all: false },
			owner_id: {  type: 'string', index: 'not_analyzed', store: 'yes', include_in_all: false },
			owner_handle: { type: 'string', analyzer: 'keyword', store: 'yes', include_in_all: false},
			published: { type: 'date', index: 'not_analyzed', store: 'yes', include_in_all: false},
			title: { type: 'string', boost: 2.0, analyzer: 'snowball', store: 'yes', include_in_all: true},
			summary: { type: 'string', analyzer: 'english', store: 'yes', include_in_all: true},
		}
	},
};

Series.prototype.searchData = function()
{
	return {
		type: this.plural,
		id: this.key,
		owner_id: this.owner_id,
		owner_handle: this.owner_handle,
		published: this.published,
		summary: this.summary,
		title: this.title,
	};
};
