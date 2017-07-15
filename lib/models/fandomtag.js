// People can have many handles.

const
	_      = require('lodash'),
	Fandom = require('./fandom'),
	orm    = require('ormnomnom')
	;

const PROPS = ['id', 'fandom_id', 'tag', 'created', 'deleted'];

class Fandomtag
{
	constructor({ id, fandom_id, fandom, tag, created, deleted } = {})
	{
		this.id = id;
		this.fandom_id = fandom_id;
		this.fandom = fandom;
		this.tag = tag;
		this.created = created || new Date();
		this.deleted = deleted;
	}
}

Fandomtag.objects = orm(Fandomtag, {
	id: orm.joi.number(),
	fandom: orm.fk(Fandom),
	tag: orm.joi.string().lowercase().trim().min(2).max(128).required(),
	created: orm.joi.date().default(() => new Date(), 'current date'),
	deleted: orm.joi.date(),
});

Fandomtag.create = function create({ tag, fandom } = {})
{
	return Fandomtag.objects.get({ tag, fandom })
	.catch(Fandomtag.objects.NotFound, () =>
	{
		return Fandomtag.objects.create({tag, fandom});
	});
};

Fandomtag.fetchAllForFandom = function fetchAllForFandom(fandom)
{
	return Fandomtag.objects.all({ fandom_id: fandom.id })
	.catch(Fandomtag.objects.NotFound, () =>
	{
		return [];
	});
};

Fandomtag.prototype.serialize = function serialize()
{
	const result = _.pick(this, PROPS);
	result.fandom_id = result.fandom_id || this.fandom.id;
	return result;
};

module.exports = Fandomtag;
