'use strict';

// People can have many api tokens.

const
	_      = require('lodash'),
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
	constructor({ id, person_id, person, token, permissions, created, touched, ip, os, browser } = {})
	{
		this.id = id;
		this.person_id = person_id;
		this.person = person;
		this.token = token;
		this.permissions = permissions;
		this.created = created;
		this.touched = touched;
		this.ip = ip;
		this.os = os;
		this.browser = browser;
	}

	static find(ctx)
	{
		logger.debug(`looking up token ${ctx.token}`);
		return Token.objects.get(ctx).catch(Token.objects.NotFound, () => null);
	}

	set person(p)
	{
		if (!p) return;
		this._person = p;
		this.person_id = p.id;
	}

	get person() { return this._person; }

	touch({ts, ip, os, browser} = {})
	{
		const ctx = {
			used: ts | Date.now(),
			ip, os, browser,
		};
		return Token.objects.filter({id: this.id})
		.update(ctx).then(count =>
		{
			return this;
		});
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

	static create(person, perms)
	{
		var permissions = 0;
		perms.forEach(p => { permissions |= Token.PERMS[p]; });

		const t = new Token({
			person,
			permissions,
			token: uuid.v4(),
		});

		return Token.objects.create(t.serialize())
		.then(tc =>
		{
			t.id = tc.id;
			t.created = tc.created;
			return t;
		});
	}

	serialize()
	{
		return _.pick(this, Token.PROPS);
	}
}

Token.prototype.serializeForAPI = Token.prototype.serialize;

Token.objects = orm(Token, {
	id: orm.joi.number(),
	person: orm.fk(Person),
	token: orm.joi.string().required(),
	permissions: orm.joi.number().required(),
	created: orm.joi.date().default(() => new Date(), 'current date'),
	touched: orm.joi.date(),
	ip: orm.joi.string(),
	os: orm.joi.string(),
	browser: orm.joi.string(),
});

Token.PERMS = PERMS;
Token.PROPS = ['id', 'person_id', 'token', 'permissions', 'created', 'touched', 'ip', 'os', 'browser'];

module.exports = Token;
