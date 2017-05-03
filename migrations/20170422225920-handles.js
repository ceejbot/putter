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
	return db.createTable('handles', { columns: {
		id: { type: type.INTEGER, primaryKey: true, autoIncrement: true },
		person_id: { type: type.INTEGER },
		handle: { type: type.STRING },
		icon: { type: type.STRING },
		created: { type: type.DATE_TIME },
		modified: { type: type.DATE_TIME },
		deleted: { type: type.DATE_TIME }
	}}).then(() =>
	{
		return db.runSql('CREATE UNIQUE INDEX handle_person_id_idx ON handles (handle, person_id) WHERE deleted IS NULL');
	}).then(() =>
	{
		return db.runSql('ALTER TABLE handles ADD CONSTRAINT handles_person_id_fk FOREIGN KEY (person_id) REFERENCES persons (id) MATCH FULL');
	});
};

exports.down = function(db)
{
	return db.runSql('DROP TABLE IF EXISTS handles;')
	.then(() =>
	{
		return db.runSql('DROP INDEX IF EXISTS handle_person_id_idx;');
	});
};

exports._meta =
{
	version: 1
};
