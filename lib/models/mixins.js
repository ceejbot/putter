// Common model features implemented as mixins.

var
	_ = require('lodash'),
	assert = require('assert'),
	polyclay = require('polyclay'),
	util = require('util')
	;

// Has an owner. Reference to Person object with id & handle stored.
exports.HasOwner =
{
	properties:
	{
		owner_id: 'string',
		owner_handle: 'string',
	},
	custom:
	{
		owner:
		{
			setter: function(owner)
			{
				if (!owner)
				{
					this.owner_handle = '';
					this.owner_id = '';
					this.__owner = null;
					return;
				}
				assert(owner.key);
				assert(owner.handle);
				this.owner_handle = owner.handle;
				this.owner_id = owner.key;
				this.__owner = owner;
			},
			getter: function()
			{
				if (this.__owner === undefined)
					return polyclay.PolyClay.defaults('reference');

				return this.__owner;
			}
		}
	},
};

exports.HasTimestamps =
{
	properties:
	{
		created: 'date',
		modified: 'date'
	},
	methods:
	{
		touch: function() { this.modified = Date.now(); }
	}
};
