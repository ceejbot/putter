/*
Login requires email/pass/2fa code (optional).
*/

const
	bcrypt = require('bcrypt'),
	bole   = require('bole'),
	orm    = require('ormnomnom'),
	otplib = require('otplib/compat'),
	P      = require('bluebird')
	;

const logger = bole('person');

class Person
{
	constructor({
			id,
			p_password,
			tfa_secret,
			email,
			email_validated,
			last_login,
			standing,
			created,
			modified,
			deleted,
		} = {})
	{
		this.id = id;
		this.p_password = p_password;
		this.tfa_secret = tfa_secret;
		this.email = email;
		this.email_validated = email_validated;
		this.last_login = last_login;
		this.standing = standing;
		this.created = created;
		this.modified = modified;
		this.deleted = deleted;
	}
}

Person.objects = orm(Person, {
	id: orm.joi.number(),
	handle: orm.joi.string().required(),
	p_password: orm.joi.string().required(),
	tfa_secret: orm.joi.string(),
	email: orm.joi.string().email().required(),
	email_validated: orm.joi.boolean(),
	last_login: orm.joi.date(),
	standing: orm.joi.string().required(),
	created: orm.joi.date(),
	modified: orm.joi.date(),
	deleted: orm.joi.date(),
});

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

Person.prototype.canPost = function canPost()
{
	return !(this.standing & SILENCED);
};

Person.prototype.isValid = function isValid()
{
	return !(this.standing & INVALID);
};

Person.prototype.canHaveBanner = function canHaveBanner()
{
	// something like this
	return this.isValid() && this.canPost();
};

// synchronous; does not store
Person.prototype.setPassword = function setPassword(newpass)
{
	var salt = bcrypt.genSaltSync(10);
	this.p_password = bcrypt.hashSync(newpass, salt);
};
Person.prototype.__defineSetter__('password', Person.prototype.setPassword);

function bcompare(possible, correct)
{
	const deferred = P.defer();

	bcrypt.compare(possible, correct, (err, result) =>
	{
		if (err)
			return deferred.reject(err);
		else
			deferred.resolve(result);
	});

	return deferred.promise;
}

Person.authenticate = function authenticate(context)
{
	// tristate result: no, yes, otp required
	const fetchPerson = Person.objects.get({
		email: context.email,
		'deleted:isNull': true,
	});

	const passcheck = fetchPerson.then(p =>
	{
		return bcompare(context.email, p.p_password);
	});

	const saveLogin = fetchPerson.then(p =>
	{
		// TODO revise for ormnomnom
		p.last_login = Date.now();
		// TODO save p
		return p;
	});

	return passcheck.then(okay =>
	{
		if (!okay) return 'no';
		return fetchPerson;
	}).then(p =>
	{
		if (!p.tfa_secret) return saveLogin;
		return 'otp_required';
	}).catch(err =>
	{
		logger.error();
		logger.error(err);
		return false;
	});
};

Person.checkOTP = function checkOTP(context)
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
};

Person.prototype.recordLogin = function recordLogin()
{
	// TODO revise for ormnomnom
	this.last_login = Date.now();
	this.save();
};
