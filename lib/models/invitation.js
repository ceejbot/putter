'use strict';

const
	bole   = require('bole'),
	orm    = require('ormnomnom'),
	Person = require('./person')
	;

const logger = bole('invitation');

class Invitation
{
	constructor({ id, token, creator, creator_id, consumer, consumer_id, created, consumed, deleted } = {})
	{
		this.id = id;
		this.token = token;
		this.creator = creator;
		this.creator_id = creator_id;
		this.consumer = consumer;
		this.consumer_id = consumer_id;
		this.created = created;
		this.consumed = consumed;
		this.deleted = deleted;
	}
}

Invitation.objects = orm(Invitation, {
	id: orm.joi.number(),
	token: orm.joi.string().uuid(),
	creator_id: orm.fk(Person),
	consumer_id: orm.fk(Person),
	created: orm.joi.date().default(() => new Date(), 'current date'),
	consumed: orm.joi.date().default(() => new Date(), 'current date'),
	deleted: orm.joi.date(),
});

module.exports = Invitation;
