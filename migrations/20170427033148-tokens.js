'use strict';

var dbm, type, seed;

exports.setup = function(options, seedLink)
{
	dbm = options.dbmigrate;
	type = dbm.dataType;
	seed = seedLink;
};

exports.up = function(db)
{
	return db.createTable('tokens', { columns: {
		id: { type: type.INTEGER, primaryKey: true, autoIncrement: true },
		person_id: { type: type.INTEGER },
		token: { type: type.STRING },
		permissions: { type: type.INTEGER },
		created: { type: type.DATE_TIME },
		modified: { type: type.DATE_TIME },
		deleted: { type: type.DATE_TIME }
	}}).then(() =>
	{
		return db.runSql('CREATE UNIQUE INDEX token_person_id_idx ON tokens (token, person_id) WHERE deleted IS NULL');
	}).then(() =>
	{
		return db.runSql('ALTER TABLE tokens ADD CONSTRAINT tokens_person_id_fk FOREIGN KEY (person_id) REFERENCES persons (id) MATCH FULL');
	});
};

exports.down = function(db)
{
	return db.runSql('DROP TABLE IF EXISTS tokens;')
	.then(() =>
	{
		return db.runSql('DROP TYPE IF EXISTS token_person_id_idx;');
	});
};

exports._meta =
{
	version: 1
};
