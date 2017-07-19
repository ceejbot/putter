const
	// bole     = require('bole'),
	libutils = require('../utilities'),
	orm      = require('ormnomnom'),
	Handle   = require('./handle'),
	strftime = require('prettydate').strftime
	;

// const logger = bole('story');

// TODO: fandoms 1->many
// TODO: canonical tags 1->many
// TODO: main pairing tag

class Story
{
	constructor({ id, author, author_id, status, title, summary, notes, is_complete, wordcount, rating, characters, tags, freeform_tags, published, created, modified, deleted,  } = {})
	{
		this.id = id;
		this.author = author;
		this.author_id = author_id;
		this.status = status; // 'visible', 'hidden', 'usergone'
		this.title = title;
		this.summary = summary;
		this.notes = notes;
		this.is_complete = is_complete;
		this.is_crossover = is_crossover;
		this.wordcount = wordcount;
		this.rating = rating;
		this.pov_character;
		this.freeform_tags = freeform_tags; // as typed
		this.published = published; // date of last modification used for sorting (new chapter e.g.)
		this.created = created; // date first added to database
		this.modified = modified; // date of last edit
		this.deleted = deleted; // is a timestamp if fic has been deleted

		// related data:
		// tags, fandoms, fandomtags, fandomchars, chapters, storycomments
	}

	async tags()
	{
		// TODO
	}

	async characters()
	{
		// TODO
	}

	async fandoms()
	{
		// TODO
	}

	printableDate()
	{
		return strftime(this.published, '%B %d %Y');
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
	published: orm.joi.date(), // most recent of all chapter creation dates
	created: orm.joi.date().default(() => new Date(), 'current date'),
	modified: orm.joi.date().default(() => new Date(), 'current date'),
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
