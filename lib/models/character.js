// People can have many handles.

const
	_      = require('lodash'),
	Fandom = require('./fandom'),
	orm    = require('ormnomnom')
	;

const PROPS = ['id', 'fandom_id', 'name'];

class Character
{
	constructor({ id, fandom_id, fandom, name } = {})
	{
		this.id = id;
		this.fandom_id = fandom_id;
		this.fandom = fandom;
		this.name = name;
	}
}

Character.objects = orm(Character, {
	id: orm.joi.number(),
	fandom: orm.fk(Fandom),
	name: orm.joi.string().lowercase().trim().min(2).max(256).required(),
});

module.exports = Character;

Character.create = function create({ name, fandom } = {})
{
	const char = new Character({ name, fandom });
	return Character.objects.create(char.serialize())
	.then(char =>
	{
		char.fandom = fandom;
		return char;
	});
};

Character.fetchAllForFandom = function fetchAllForFandom(fandom)
{
	return Character.objects.all({ fandom_id: fandom.id })
	.catch(Character.objects.NotFound, () =>
	{
		return [];
	});
};

Character.prototype.serialize = function serialize()
{
	const result = _.pick(this, PROPS);
	result.fandom_id = result.fandom_id || this.fandom.id;
	return result;
};

