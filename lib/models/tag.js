const orm = require('ormnomnom');

class Tag
{
	constructor({ id, tag } = {})
	{
		this.id = id;
		this.tag = tag;
	}
}

Tag.objects = orm(Tag, {
	id: orm.joi.number(),
	tag: orm.joi.string().min(2).max(256).required(),
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
	};
};

