'use strict';

var dbm, type, seed;

exports.setup = function(options, seedLink)
{
	dbm = options.dbmigrate;
	type = dbm.dataType;
	seed = seedLink;
};

exports.up = function(db, callback)
{
	db.runSql('CREATE EXTENSION IF NOT EXISTS hstore;', () =>
	{
		db.runSql("DROP TYPE IF EXISTS person_standing_type; CREATE TYPE person_standing_type AS ENUM ('good', 'pending', 'unpaid', 'suspended', 'spammer', 'hellbanned', 'banned');", () =>
		{
			db.createTable('persons', { columns: {
				id: { type: type.INTEGER, primaryKey: true, autoIncrement: true },
				hashedpass: { type: type.STRING },
				tfa_secret: { type: type.STRING },
				email: { type: type.STRING },
				email_verified: { type: type.BOOLEAN },
				validation_key: { type: type.STRING },
				standing: { type: type.STRING },
				last_login: { type: type.DATE_TIME },
				created: { type: type.DATE_TIME },
				modified: { type: type.DATE_TIME },
				deleted: { type: type.DATE_TIME }
			}}, () =>
			{
				db.addIndex('persons', 'persons_email', 'email', callback);
			});
		});
	});
};

exports.down = function(db)
{
	return db.runSql('DROP TABLE IF EXISTS persons;')
	.then(() =>
	{
		return db.runSql('DROP TYPE IF EXISTS person_standing_type;');
	});
};

exports._meta =
{
 	"version": 1
};
