const
	_      = require('lodash'),
	Fandom = require('./fandom'),
	orm    = require('ormnomnom'),
	util   = require('../utilities')
	;

const PROPS = ['id', 'fandom_id', 'tag', 'created', 'deleted'];

class FandomChar
{
	constructor({ id, fandom_id, fandom, tag, created, deleted } = {})
	{
		this.id = id;
		this.fandom_id = fandom_id;
		this.fandom = fandom;
		this.tag = tag ? util.cleanTagText(tag) : undefined;
		this.created = created || new Date();
		this.deleted = deleted;
	}
}

FandomChar.objects = orm(FandomChar, {
	id: orm.joi.number(),
	fandom: orm.fk(Fandom),
	tag: orm.joi.string().lowercase().trim().min(2).max(128).required(),
	created: orm.joi.date().default(() => new Date(), 'current date'),
	deleted: orm.joi.date(),
});

FandomChar.create = function create({ tag, fandom } = {})
{
	return FandomChar.objects.get({ tag, fandom })
	.catch(FandomChar.objects.NotFound, () =>
	{
		return FandomChar.objects.create({tag, fandom});
	});
};

FandomChar.fetchAllForFandom = function fetchAllForFandom(fandom)
{
	return FandomChar.objects.all({ fandom_id: fandom.id })
	.catch(FandomChar.objects.NotFound, () =>
	{
		return [];
	});
};

FandomChar.prototype.serialize = function serialize()
{
	const result = _.pick(this, PROPS);
	result.fandom_id = result.fandom_id || this.fandom.id;
	return result;
};

module.exports = FandomChar;
