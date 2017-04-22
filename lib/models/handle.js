'use strict';

// People can have many handles.

const
	orm    = require('ormnomnom'),
	Person = require('./person')
	;

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
	person_id: orm.fk(Person),
	handle: orm.joi.string().required(),
	icon: orm.joi.string().uri(),
	created: orm.joi.date(),
	modified: orm.joi.date(),
	deleted: orm.joi.date(),
});
