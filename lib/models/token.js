'use strict';

// People can have many api tokens.

// TODO
// auth token
// privileges as an enum
// owner

const
	orm    = require('ormnomnom'),
	Person = require('./person')
	;

// TODO a bitfield something like this
const PERMS = {
	read:       0x1,
	comment:    0x2,
	post:       0x4,
};

class Token
{
	constructor({ id, person_id, person, token, permissions, created, modified, deleted } = {})
	{
		this.id = id;
		this.person_id = person_id;
		this.person = person;
		this.token = token;
		this.permissions = permissions;
		this.created = created;
		this.modified = modified;
		this.deleted = deleted;
	}
}

Token.objects = orm(Token, {
	id: orm.joi.number(),
	person_id: orm.fk(Person),
	token: orm.joi.string().required(),
	permissions: orm.joi.number().required(),
	created: orm.joi.date(),
	modified: orm.joi.date(),
	deleted: orm.joi.date(),
});

module.exports = Token;
