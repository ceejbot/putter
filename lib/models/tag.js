const orm = require('ormnomnom');

class Tag
{
	constructor({ id, tag, created, deleted } = {})
	{
		this.id = id;
		this.tag = tag;
		this.created = created;
		this.deleted = deleted;
	}
}

Tag.objects = orm(Tag, {
	id: orm.joi.number(),
	tag: orm.joi.string().min(2).max(256).required(),
	created: orm.joi.date().default(() => new Date(), 'current date'),
	deleted: orm.joi.date(),
});

module.exports = Tag;

Tag.create = async function create(tag)
{
	const created = await Tag.objects.create({ tag });
	return created;
};

Tag.findOrCreate = async function findOrCreate(tag)
{
	return Tag.objects.get({ tag })
	.then(t => t)
	.catch(Tag.objects.NotFound, () =>
	{
		return Tag.objects.create({ tag });
	});
};

Tag.all = function all()
{
	return Tag.objects.all();
};

Tag.prototype.serialize = function serialize()
{
	return {
		id: this.id,
		tag: this.tag,
		modified: this.modified,
		deleted: this.deleted
	};
};

