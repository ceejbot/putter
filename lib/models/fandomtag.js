// People can have many handles.

const
	_      = require('lodash'),
	Fandom = require('./fandom'),
	orm    = require('ormnomnom')
	;

const PROPS = ['id', 'fandom_id', 'tag', 'created', 'deleted'];

class FandomTag
{
	constructor({ id, fandom_id, fandom, tag, created, deleted } = {})
	{
		this.id = id;
		this.fandom_id = fandom_id;
		this.fandom = fandom;
		this.tag = tag;
		this.created = created;
		this.deleted = deleted;
	}
}

FandomTag.objects = orm(FandomTag, {
	id: orm.joi.number(),
	fandom: orm.fk(Fandom),
	tag: orm.joi.string().lowercase().trim().min(2).max(128).required(),
	created: orm.joi.date().default(() => new Date(), 'current date'),
	deleted: orm.joi.date(),
});

module.exports = FandomTag;

FandomTag.create = function create({ tag, fandom } = {})
{
	const ft = new FandomTag({ tag, fandom });
	return FandomTag.objects.create(ft.serialize())
	.then(ft =>
	{
		ft.fandom = fandom;
		return ft;
	});
};

FandomTag.fetchAllForFandom = function fetchAllForFandom(fandom)
{
	return FandomTag.objects.all({ fandom_id: fandom.id })
	.catch(FandomTag.objects.NotFound, () =>
	{
		return [];
	});
};

FandomTag.prototype.serialize = function serialize()
{
	const result = _.pick(this, PROPS);
	result.fandom_id = result.fandom_id || this.fandom.id;
	return result;
};

