'use strict';

const
	bole     = require('bole'),
	libutils = require('../utilities'),
	orm      = require('ormnomnom'),
	Handle   = require('./handle'),
	strftime = require('prettydate').strftime
	;

const logger = bole('story');

class Story
{
	constructor({ id, author, author_id, status, title, summary, notes, is_complete, wordcount, tags, published, created, modified, deleted,  } = {})
	{
		this.id = id;
		this.author = author;
		this.author_id = author_id;
		this.status = status; // 'visible', 'hidden', 'usergone'
		this.title = title;
		this.summary = summary;
		this.notes = notes;
		this.is_complete = is_complete;
		this.wordcount = wordcount;
		this.tags = tags;
		this.published = published;
		this.created = created;
		this.modified = modified;
		this.deleted = deleted;
	}
}

Story.objects = orm(Story, {
	id: orm.joi.number(),
	author_id: orm.fk(Handle),
	status: orm.joi.string().required(),
	title: orm.joi.string().required(), // TODO limits
	summary: orm.joi.string().required(), // TODO limits
	notes: orm.joi.string().required(), // TODO limits
	is_complete: orm.joi.boolean(),
	wordcount: orm.joi.number(),
	tags: orm.joi.string(), // TODO for now!
	published: orm.joi.Date(), // most recent of all chapter creation dates
	created: orm.joi.date(),
	modified: orm.joi.date(),
	deleted: orm.joi.date(),
});

module.exports = Story;

// preserved things from the last implementation that look useful

Story.prototype.isCrossover = function isCrossover()
{
	// TODO store this as a bit in the document record itself
	// consult list of fandoms related to the main fandom: if all add'l
	// fandoms are on that list, this is not a crossover.
	// otherwise, set bit to true.
	// should hook this onto setting the fandoms lists & update().
	return this.fandoms_additional && (this.fandoms_additional.length > 0);
};

Story.prototype.printableDate = function printableDate()
{
	return strftime(this.published, '%B %d %Y');
};

Story.prototype.printableRating = function printableRating()
{
	if (this.rating === '')
		return 'explicit';
	return this.rating;
};

Story.prototype.printableCharacters = function printableCharacters()
{
	var item, prologue, fandom, charlist;
	var result = [];

	var fandoms = Object.keys(this.characters);
	for (var j = 0; j < fandoms.length; j++)
	{
		fandom = fandoms[j];
		charlist = this.characters[fandom];
		prologue = `<a href="/fandoms/${fandom}/characters/`;

		for (var i = 0; i < charlist.length; i++)
		{
			item = charlist[i];
			result.push(`${prologue}${libutils.escapeForURL(item)}">"${item}</a>`);
		}
	}

	return result.join(', ');
};

Story.prototype.pairingMain = function pairingMain()
{
	return '<a href="/fandoms/' + this.fandom + '/pairings/' +
			libutils.escapeForURL(this.pairing) +
			'">' + this.pairing + '</a>';
};

Story.prototype.printablePairings = function printablePairings()
{
	var i, j, item, prologue, fandom, plist;
	var result = [];

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

Story.prototype.printableFandoms = function printableFandoms()
{
	var p,
		tmp = [],
		result = [];

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

Story.prototype.printableTags = function printableTags()
{
	var t,
		tmp = [];
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
