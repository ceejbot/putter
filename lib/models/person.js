var
	bcrypt   = require('bcrypt'),
	polyclay = require('polyclay'),
	Request  = require('request'),
	url      = require('url'),
	util     = require('util')
	;

var Person = module.exports = polyclay.Model.buildClass(
{
	properties:
	{
		id:                'string', // couchdb key
		version:           'number',
		handle:            'string',
		created:           'date',
		modified:          'date',
		p_password:        'string',
		email:             'string',
		email_addresses:   'array', // of string
		email_validated:   'boolean',
		security_question: 'string',
		security_answer:   'string',
		last_login:        'date',
	},
	enumerables: {
		standing: ['good', 'pending', 'unpaid', 'suspended', 'hellbanned', 'banned']
	},
	required: [ 'handle', 'email' ],
	index: [ 'email', 'handle' ],
	singular: 'person',
	plural: 'people',
	initialize: function()
	{
		this.created    = Date.now();
		this.p_password = '';
		this.last_login = new Date(0);
		this.standing   = 'good';
		this.version    = 1;
	},
});

polyclay.persist(Person, 'id');
Person.defineAttachment('icon', 'image/*');

var STANDING = {
	good:       0x0,
	pending:    0x1,
	unpaid:     0x2,
	suspended:  0x4,
	spammer:    0x8,
	hellbanned: 0x10,
	banned:     0x20,
	deleted:    0x40
};

var SILENCED = (STANDING.suspended | STANDING.banned | STANDING.deleted | STANDING.unpaid);
var INVALID = (STANDING.spammer | STANDING.banned | STANDING.deleted);

Person.prototype.canPost = function()
{
	return !(this.standing & SILENCED);
};

Person.prototype.isValid = function()
{
	return !(this.standing & INVALID);
};

Person.prototype.canHaveBanner = function()
{
	// something like this
	return this.isValid() && this.canPost();
};

Person.prototype.validator = function()
{
	if (this.p_password.length === 0)
	{
		this.errors.password = 'Password is missing.';
		return false;
	}
	return true;
};

// synchronous; does not store
Person.prototype.setPassword = function(newpass)
{
	var salt = bcrypt.genSaltSync(10);
	this.p_password = bcrypt.hashSync(newpass, salt);
};
Person.prototype.__defineSetter__('password', Person.prototype.setPassword);

Person.prototype.authenticate = function(inpass, callback)
{
	var self = this;
	bcrypt.compare(inpass, this.p_password, function(err, result)
	{
		if (err) result = false;
		callback(err, result, result ? self : null);
	});
};

Person.prototype.recordLogin = function(callback)
{
	this.last_login = Date.now();
	this.save(callback);
};

Person.prototype.storeIcon = function(loc, callback)
{
	var self = this;

	Request.get(loc, function(err, response, body)
	{
		if (err) return callback(err);
		self.icon = body;
		// TODO resize, limit, etc
		self.save(function(err)
		{
			callback(err);
		});
	});
};

//-----------------------------------------------------------
// search

Person.searchMapping =
{
	'people':
	{
		properties:
		{
			'id': { type: 'string', index: 'not_analyzed', include_in_all: false },
			handle: { type: 'string', analyzer: 'keyword', store: 'yes'},
			modified: { type: 'date', index: 'not_analyzed', store: 'yes'},
		}
	},
};

Person.prototype.searchData = function()
{
	// Assumption for the moment: that you'll only be calling this when you
	// have all data already in memory (e.g., from a recent edit).
	return {
		type:     this.plural,
		id:       this.key,
		handle:   this.handle,
		modified: this.modified,
	};
};
