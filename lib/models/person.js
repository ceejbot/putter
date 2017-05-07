'use strict';

const
	_      = require('lodash'),
	bcrypt = require('bcrypt'),
	bole   = require('bole'),
	orm    = require('ormnomnom'),
	otplib = require('otplib/compat'),
	P      = require('bluebird')
	;

const logger = bole('person');

const STANDING = {
	good:       0x0,
	pending:    0x1,
	unpaid:     0x2,
	suspended:  0x4,
	spammer:    0x8,
	hellbanned: 0x10,
	banned:     0x20,
	deleted:    0x40
};

const SILENCED = (STANDING.suspended | STANDING.banned | STANDING.deleted | STANDING.unpaid);
const INVALID = (STANDING.spammer | STANDING.banned | STANDING.deleted);

const PROPS = ['id', 'hashedpass', 'tfa_secret', 'email', 'email_verified',
	'validation_key', 'last_login', 'standing', 'created', 'modified', 'deleted',
];

class Person
{
	constructor({
			id,
			hashedpass,
			tfa_secret,
			email,
			email_verified,
			validation_key,
			last_login,
			standing,
			created,
			modified,
			deleted,
		} = {})
	{
		this.id = id;
		this.hashedpass = hashedpass;
		this.tfa_secret = tfa_secret;
		this.email = email;
		this.email_verified = email_verified;
		this.validation_key = validation_key;
		this.last_login = last_login;
		this.standing = standing;
		this.created = created;
		this.modified = modified;
		this.deleted = deleted;
	}

	static create(ctx)
	{
		const p = new Person(ctx);
		p.standing = 'good';
		p.email_verified = false;
		p.password = ctx.password;
		return Person.objects.create(p.serialize());
	}

	serialize()
	{
		return _.pick(this, PROPS);
	}

	serializeForAPI()
	{
		const rez = _.pick(this, PROPS);
		delete rez.hashedpass;
		delete rez.tfa_secret;
		return rez;
	}

	canPost()
	{
		return !(this.standing & SILENCED);
	}

	isValid()
	{
		return !(this.standing & INVALID);
	}

	canHaveBanner()
	{
		// something like this
		return this.isValid() && this.canPost();
	}

	set password(newpass)
	{
		var salt = bcrypt.genSaltSync(10);
		this.hashedpass = bcrypt.hashSync(newpass, salt);
	}

	get password()
	{
		return this.hashedpass;
	}

	recordLogin()
	{
		return Person.objects.filter({ id: this.id })
		.update({last_login: new Date()})
		.then(() =>
		{
			return this;
		});
	}

	authenticate(context)
	{
		// tristate result: no, yes, otp required
		if (!Person.bcompare(context.password, this.hashedpass))
			return P.reject(new BadAuthError('nope'));

		if (!this.tfa_secret)
			return this.recordLogin();

		if (otplib.authenticator.check(context.token, this.tfa_secret))
			return this.recordLogin();
		else
			return P.reject(new OTPRequiredError('otp plz'));
	}

	static bcompare(possible, correct)
	{
		const deferred = new Promise((resolve, reject) =>
		{
			bcrypt.compare(possible, correct, (err, result) =>
			{
				if (err) return reject(err);
				else resolve(result);
			});
		});

		return deferred;
	}

	static checkOTP(context)
	{
		const fetchPerson = Person.objects.get({
			email: context.email,
			'deleted:isNull': true,
		});

		return fetchPerson.then(p =>
		{
			if (!p.tfa_secret)
			{
				// either an error or a straight login ok
				return p;
			}
			const isValid = otplib.authenticator.check(context.token, this.tfa_secret);
			p.recordLogin();
			if (isValid) return p;
			return false;
		}).catch(err =>
		{
			logger.error(err);
			return false;
		});
	}
}

Person.objects = orm(Person, {
	id: orm.joi.number(),
	hashedpass: orm.joi.string().required(),
	tfa_secret: orm.joi.string(),
	email: orm.joi.string().email().required(),
	email_verified: orm.joi.boolean(),
	validation_key: orm.joi.string(),
	last_login: orm.joi.date(),
	standing: orm.joi.string().required(),
	created: orm.joi.date().default(() => new Date(), 'current date'),
	modified: orm.joi.date().default(() => new Date(), 'current date'),
	deleted: orm.joi.date(),
});

class OTPRequiredError extends Error { constructor(msg) { super(msg); this.name = 'OTPRequiredError'; } }
class BadAuthError extends Error { constructor(msg) { super(msg); this.name = 'BadAuthError'; } }

Person.Errors = {
	OTPRequired: OTPRequiredError,
	BadAuth: BadAuthError,
};

module.exports = Person;
