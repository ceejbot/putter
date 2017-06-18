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
	const t = new Tag({ tag });
	const created = await Tag.objects.create(t.serialize());
	return created;
};

Tag.fetchAllForPerson = function fetchAllForPerson(person)
{
	return Tag.objects.all({ person_id: person.id })
	.catch(Tag.objects.NotFound, () =>
	{
		return [];
	});
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

