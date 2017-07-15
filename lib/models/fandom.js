const
	bole = require('bole'),
	orm  = require('ormnomnom')
	;

const logger = bole('fandom');
logger.info('fandoms!');

var FTag;

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
		this.description = description;
		this.created = created;
		this.modified = modified;
		this.deleted = deleted;
	}

	async addTag(tag)
	{
		FTag = require('./fandomtag');
		const ft = await FTag.create({ tag, fandom: this});
		return ft;
	}
}

Fandom.objects = orm(Fandom, {
	id: orm.joi.number(),
	tag: orm.joi.string(), // TODO limits
	name: orm.joi.string(), // TODO limits
	description: orm.joi.string(),
	created: orm.joi.date().default(() => new Date(), 'current date'),
	modified: orm.joi.date().default(() => new Date(), 'current date'),
	deleted: orm.joi.date(),
});

Fandom.findOrCreate = async function findOrCreate({ tag, name, description })
{
	if (!tag) return;
	return Fandom.objects.get({ tag })
	.then(f => f)
	.catch(Fandom.objects.NotFound, () =>
	{
		return Fandom.objects.create({ tag, name, description });
	});
};

Fandom.all = function all()
{
	return Fandom.objects.all();
};

module.exports = Fandom;
