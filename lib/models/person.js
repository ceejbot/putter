const
	bcrypt = require('bcrypt'),
	orm    = require('ormnomnom')
	;

class Person
{
	constructor({
			id,
			handle,
			created,
			modified,
			p_password,
			email,
			email_validated,
			last_login,
			standing
		} = {})
	{
		this.id = id;
		this.handle = handle;
		this.created = created;
		this.modified = modified;
		this.p_password = p_password;
		this.email = email;
		this.email_validated = email_validated;
		this.last_login = last_login;
		this.standing = standing;
	}

	// TODO icon/avatar

}

const PersonObjects = orm(Person, {
	id: orm.joi.number(),
	handle: orm.joi.string().required(),
	created: orm.joi.date(),
	modified: orm.joi.date(),
	p_password: orm.joi.string().required(),
	email: orm.joi.email().required(),
	email_validated: orm.joi.boolean(),
	last_login: orm.joi.date(),
	standing: orm.joi.string().required(),
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

Person.prototype.authenticate = function authenticate(inpass, callback)
{
	var self = this;
	bcrypt.compare(inpass, this.p_password, (err, result) =>
	{
		if (err) result = false;
		callback(err, result, result ? self : null);
	});
};

Person.prototype.recordLogin = function recordLogin(callback)
{
	this.last_login = Date.now();
	this.save(callback);
};

Person.prototype.storeIcon = function(loc, callback)
{
	// TODO
};
