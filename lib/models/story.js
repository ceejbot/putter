var
	libutils = require('../utilities'),
	marked   = require('marked'),
	polyclay = require('polyclay'),
	strftime = require('prettydate').strftime,
	util     = require('util'),
	mixins   = require('./mixins')
	;

// bitfield
var WARNINGS =
{
	0: 'none',
	1: 'major character death',
	2: 'graphic sex with characters under 18',
	4: 'author chooses not to warn'
};

// enum
var CATEGORIES =
[
	'uncategorizable',
	'gen',
	'het',
	'slash',
	'poly',
];

// enum
var RATINGS =
[
	'general',
	'teen',
	'mature',
	'explicit'
];

var Story = module.exports = polyclay.Model.buildClass(
{
	properties:
	{
		id: 'string',
		version: 'number',
		published: 'date',
		is_published: 'boolean',
		is_draft: 'boolean',
		hidden: 'boolean', // visible only to logged-in users
		authors: 'array',
		fandom: 'string',
		fandoms_additional: 'array',
		warnings: 'number',
		pairing: 'string',
		pairings_secondary: 'hash',
		characters: 'hash',
		title: 'string',
		summary: 'string',
		notes: 'string',
		tags: 'array',
		tags_user: 'array',
		series: 'string',
		format: 'string', // TODO feature; assume markdown for now
		language: 'string', // should be an enum
		wordcount: 'number'
	},
	enumerables:
	{
		category: CATEGORIES,
		rating: RATINGS,
	},
	required: [ 'owner_id', 'fandom', 'rating', 'category', 'title', 'content' ],
	singular: 'story',
	plural: 'stories',
	index: [ 'owner_id', 'owner_handle' ],
	initialize: function()
	{
		this.version = 1;
	},
});

polyclay.persist(Story, 'id');
polyclay.mixin(Story, mixins.HasOwner);
polyclay.mixin(Story, mixins.HasTimestamps);
Story.defineAttachment('content', 'text/plain');
Story.defineAttachment('rendered', 'text/html');

//----------------------------------------------------------------------
// document-specific behaviors

Story.prototype.beforeSave = function()
{
	this.modified = Date.now();
};

Story.prototype.isCrossover = function()
{
	// TODO store this as a bit in the document record itself
	// consult list of fandoms related to the main fandom: if all add'l
	// fandoms are on that list, this is not a crossover.
	// otherwise, set bit to true.
	// should hook this onto setting the fandoms lists & update().
	return this.fandoms_additional && (this.fandoms_additional.length > 0);
};

Story.prototype.printableDate = function()
{
	return strftime(this.published, '%B %d %Y');
};

Story.prototype.printableRating = function()
{
	if (this.rating === '')
		return 'explicit';
	return this.rating;
};

Story.prototype.printableCharacters = function()
{
	var item, prologue, fandom, charlist, result = [];

	var fandoms = Object.keys(this.characters);
	for (var j = 0; j < fandoms.length; j++)
	{
		fandom = fandoms[j];
		charlist = this.characters[fandom];
		prologue = '<a href="/fandoms/' + fandom + '/characters/';

		for (var i = 0; i < charlist.length; i++)
		{
			item = charlist[i];
			result.push(prologue +
					libutils.escapeForURL(item) +
					'">' + item + '</a>');
		}
	}

	return result.join(', ');
};

Story.prototype.pairingMain = function()
{
	return '<a href="/fandoms/' + this.fandom + '/pairings/' +
			libutils.escapeForURL(this.pairing) +
			'">' + this.pairing + '</a>';
};

Story.prototype.printablePairings = function()
{
	var i, j, item, prologue, fandom, plist, result = [];

	result.push(this.pairingMain());

	var fandoms = Object.keys(this.pairings_secondary);
	for (j = 0; j < fandoms.length; j++)
	{
		fandom = fandoms[j];
		plist = this.pairings_secondary[fandom].sort();
		prologue = '<a href="/fandoms/' + fandom + '/pairings/';

		for (i = 0; i < plist.length; i++)
		{
			item = plist[i];
			result.push(prologue +
					libutils.escapeForURL(item) +
					'">' + item + '</a>');
		}
	}

	return result.join(', ');
};

Story.prototype.printableFandoms = function()
{
	var tmp = [], p, result = [];

	tmp = [];
	if (this.fandoms_additional.length > 0)
		tmp = tmp.concat(this.fandoms_additional.sort());
	tmp.unshift(this.fandom);

	for (var i = 0; i < tmp.length; i++)
	{
		p = tmp[i];
		result.push('<a href="/fandoms/' +
				libutils.escapeForURL(p) +
				'">' + p + '</a>');
	}

	return result.join(', ');
};

Story.prototype.printableTags = function()
{
	var tmp = [], t;
	this.tags.sort();
	for (var i = 0; i < this.tags.length; i++)
	{
		t = this.tags[i];
		tmp.push('<a href="/tags/' +
				libutils.escapeForURL(t) +
				'">' + t + '</a>');

	}
	return tmp.join(', ');
};

//-----------------------------------------------------------

function setOwner(owner)
{
	/*jshint validthis:true */
	var newval = arguments['0'];
	this.owner_id = newval.key;
	this.__owner = newval;
	this.owner_handle = owner.handle; // the reason for the override
}

Story.prototype.__defineSetter__('owner', setOwner);

//-----------------------------------------------------------

var origcontentfunc = Story.prototype.set_content;
function setContent(body)
{
	/*jshint validthis:true */
	origcontentfunc.apply(this, arguments);
	this.rendered = marked(body);
	this.wordcount = libutils.countWords(body);
	this.__dirty = true;
}
Story.prototype.__defineSetter__('content', setContent);

Story.prototype.render = function(callback)
{
	this.fetch_rendered(callback);
};


//----------------------------------------------------------------
// search

Story.searchMapping =
{
	'stories':
	{
		properties:
		{
			'id': { type: 'string', index: 'not_analyzed', include_in_all: false },
			owner_id: {  type: 'string', index: 'not_analyzed', store: 'yes', include_in_all: false },
			owner_handle: { type: 'string', analyzer: 'keyword', store: 'yes', include_in_all: false},
			published: { type: 'date', index: 'not_analyzed', store: 'yes', include_in_all: false},
			fandom: { type: 'string', analyzer: 'keyword', store: 'yes', include_in_all: false },
			is_crossover: { type: 'boolean', index: 'not_analyzed', store: 'yes', include_in_all: false },
			warnings: { type: 'integer', index: 'not_analyzed', store: 'yes', include_in_all: false },
			category: { type: 'integer', index: 'not_analyzed', store: 'yes', include_in_all: false },
			rating: { type: 'integer', index: 'not_analyzed', store: 'yes', include_in_all: false },
			pairing: { type: 'string', analyzer: 'keyword', store: 'yes', include_in_all: false },
			title: { type: 'string', _boost: 5.0, analyzer: 'snowball', store: 'yes', include_in_all: true },
			summary: { type: 'string', _boost: 1.25, analyzer: 'english', store: 'yes', include_in_all: true} ,
			tag: { type: 'string', index_name: 'tag', _boost: 2.5, analyzer: 'keyword', store: 'yes', include_in_all: true},
			tags_user: { type: 'string', index_name: 'tags_user', _boost: 2.5, analyzer: 'keyword', store: 'yes', include_in_all: true},
			content: { type: 'string', analyzer: 'english', include_in_all: true},
		}
	},
};

Story.prototype.searchData = function()
{
	// Assumption for the moment: that you'll only be calling this when you
	// have all data already in memory (e.g., from a recent edit).
	var tmp = [];
	if (this.fandoms_additional.length > 0)
		tmp = tmp.concat(this.fandoms_additional.sort());
	tmp.unshift(this.fandom);

	return {
		type: this.plural,
		id: this.key,
		owner_id: this.owner_id,
		owner_handle: this.owner_handle,
		published: this.published,
		fandom: this.fandom,
		fandoms_additional: tmp,
		is_crossover: this.isCrossover(),
		warnings: this.warnings,
		rating: this.__attributes.rating,
		category: this.__attributes.category,
		pairing: this.pairing,
		summary: this.summary,
		tags: this.tags,
		tags_user: this.tags_user,
		title: this.title,
		content: this.content,
	};
};

Story.design =
{
	views:
	{
		by_fandom: { map: "function(doc) {\n  emit(doc.fandom, doc);\n}" },
		by_owner_handle: { map: "function(doc) {\n  emit(doc.owner_handle, doc);\n}" },
		drafts_by_owner: { map: "function(doc) {\n  if (doc.is_draft === true)\n    emit(doc.owner_id, doc);\n}" },
		drafts_by_handle: { map: "function(doc) {\n  if (doc.is_draft === true)\n    emit(doc.owner_handle, doc);\n}" },
	}
};

Story.draftsByOwner = function(id, callback)
{
	if (typeof id === 'object')
		id = id.key;

	Story.adapter.db.view('stories/drafts_by_owner', { key: id }, function(err, documents)
	{
		if (err) return callback(err);
		Story.constructMany(documents, callback);
	});
};


Story.byOwnerHandle = function(handle, callback)
{
	Story.adapter.db.view('stories/by_owner_handle', { key: handle }, function(err, documents)
	{
		if (err) return callback(err);
		Story.constructMany(documents, callback);
	});
};

Story.draftsByOwnerHandle = function(handle, callback)
{
	Story.adapter.db.view('stories/drafts_by_handle', { key: handle }, function(err, documents)
	{
		if (err) return callback(err);
		Story.constructMany(documents, callback);
	});
};
