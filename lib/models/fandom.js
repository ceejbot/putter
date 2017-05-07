'use strict';

const
	bole     = require('bole'),
	orm      = require('ormnomnom')
	;

const logger = bole('fandom');

/*
Fandoms

The fandom document contains mostly-static textual descriptions
of a fandom, seen when viewing the fandom fic listing pages. It
also lists related fandoms, aka fandoms that do not count as
crossovers when a fic is tagged with them and with this fandom.
An example would be "Buffy the Vampire Slayer", which would have
"Angel the Series" listed as a related fandom. Fic tagged as both
'btvs' and 'ats' would not be treated as a crossover.

It also defines fandom-specific tags.

The fandom indexes in redis index fic by the following:

- fandom-specific tags
- characters
- pairings

*/

class Fandom
{
	constructor({ id, tag, name, name_sort, description, related, characters, tags, created, modified, deleted } = {})
	{
		this.id = id;
		this.tag = tag;
		this.name = name;
		this.name_sort = name_sort;
		this.description = description;
		this.related = related; // for now
		this.characters = characters; // for now
		this.tags = tags; // for now
		this.created = created;
		this.modified = modified;
		this.deleted = deleted;
	}
}

Fandom.objects = orm(Fandom, {
	id: orm.joi.number(),
	tag: orm.joi.string(), // TODO limits
	name: orm.joi.string(), // TODO limits
	name_sort: orm.joi.string(), // TODO limits
	description: orm.joi.string(), // TODO limits
	related: orm.joi.string(), // TODO implement properly
	characters: orm.joi.string(), // TODO implement properly
	tags: orm.joi.string(), // TODO implement properly
	created: orm.joi.date().default(() => new Date(), 'current date'),
	modified: orm.joi.date().default(() => new Date(), 'current date'),
	deleted: orm.joi.date(),
});

module.exports = Fandom;
