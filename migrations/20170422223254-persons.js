var dbm, type;

exports.setup = function(options, seedLink)
{
	dbm = options.dbmigrate;
	type = dbm.dataType;
};

exports.up = async function(db, callback)
{
	await db.runSql('CREATE EXTENSION IF NOT EXISTS hstore;');
	await db.runSql("DROP TYPE IF EXISTS person_standing_type; CREATE TYPE person_standing_type AS ENUM ('good', 'pending', 'unpaid', 'suspended', 'spammer', 'hellbanned', 'banned');");
	await db.createTable('persons', { columns: {
		id: { type: type.INTEGER, unsigned: true, primaryKey: true, autoIncrement: true },
		hashedpass: { type: type.STRING },
		tfa_secret: { type: type.STRING },
		email: { type: type.STRING, unique: true },
		email_verified: { type: type.BOOLEAN },
		validation_key: { type: type.STRING },
		standing: { type: type.STRING },
		last_login: { type: type.DATE_TIME },
		created: { type: type.DATE_TIME },
		modified: { type: type.DATE_TIME },
		deleted: { type: type.DATE_TIME }
	}});
	await db.addIndex('persons', 'persons_email', 'email', callback);
};

exports.down = async function(db)
{
	await db.runSql('DROP TABLE IF EXISTS persons;');
	await db.runSql('DROP TYPE IF EXISTS person_standing_type;');
};

exports._meta =
{
	version: 1
};
