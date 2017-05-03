'use strict';

// People can have many api tokens.

// TODO
// auth token
// privileges as an enum
// owner

const
	bole   = require('bole'),
	orm    = require('ormnomnom'),
	P      = require('bluebird'),
	Person = require('./person'),
	uuid   = require('uuid')
	;

const logger = bole('token');

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

	static findPerson(token)
	{
		// Speculative: given a token, return the person
		logger.debug(`looking up token ${token}`);
		return Token.objects.get({token})
		.then(t =>
		{
			if (t.deleted)
				return null;
			return Person.objects.get({id: this.person_id});
		})
		.catch(Token.objects.NotFound, () => null)
		.catch(Person.objects.NotFound, () => null);
	}

	set person(p) {
		this._person = p;
		this.person_id = p.id;
	}

	static canAct(token, verb)
	{
		if (!PERMS.hasOwnProperty(verb))
		{
			logger.error(`unknown token permission verb ${verb}`);
			return P.resolve(false);
		}

		logger.debug(`looking up token ${token}`);
		return Token.objects.get({token})
		.then(t =>
		{
			if (t.deleted)
				return false;
			return t.permissions & PERMS[verb];
		})
		.catch(Token.objects.NotFound, () => false);
	}

	static create(owner, permissions)
	{
		return Token.objects.create({
			person_id: person.id,
			permissions,
			token: uuid.v4(),			
		});
	}
}

Token.objects = orm(Token, {
	id: orm.joi.number(),
	person_id: orm.fk(Person),
	token: orm.joi.string().required(),
	permissions: orm.joi.number().required(),
	created: orm.joi.date().default(() => new Date(), 'current date'),
	modified: orm.joi.date().default(() => new Date(), 'current date'),
	deleted: orm.joi.date(),
});

module.exports = Token;
