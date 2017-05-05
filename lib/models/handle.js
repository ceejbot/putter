'use strict';

// People can have many handles.

const
	_      = require('lodash'),
	orm    = require('ormnomnom'),
	Person = require('./person')
	;

const PROPS = ['id', 'person_id', 'handle', 'created', 'modified', 'deleted', 'icon'];

class Handle
{
	constructor({ id, person_id, person, handle, created, modified, deleted, icon } = {})
	{
		this.id = id;
		this.person_id = person_id;
		this.person = person;
		this.handle = handle;
		this.icon = icon;
		this.created = created;
		this.modified = modified;
		this.deleted = deleted;
	}
}

Handle.objects = orm(Handle, {
	id: orm.joi.number(),
	person: orm.fk(Person),
	handle: orm.joi.string().required(),
	icon: orm.joi.string().uri(),
	created: orm.joi.date().default(() => new Date(), 'current date'),
	modified: orm.joi.date().default(() => new Date(), 'current date'),
	deleted: orm.joi.date().default(() => new Date(), 'current date'),
});

module.exports = Handle;

Handle.create = function create({ handle, person } = {})
{
	const h = new Handle({ handle, person });
	return Handle.objects.create(h.serialize())
	.then(h =>
	{
		h.person = person;
		return h;
	});
};

Handle.fetchAllForPerson = function fetchAllForPerson(person)
{
	return Handle.objects.all({ person_id: person.id })
	.catch(Handle.objects.NotFound, () =>
	{
		return [];
	});
};

Handle.prototype.serialize = function serialize()
{
	const result = _.pick(this, PROPS);
	result.person_id = result.person_id || this.person.id;
	return result;
}

