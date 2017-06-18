var dbm, type;

exports.setup = function(options, seedLink)
{
	dbm = options.dbmigrate;
	type = dbm.dataType;
};

exports.up = async function(db)
{
	await db.createTable('handles', { columns: {
		id: { type: type.INTEGER, primaryKey: true, autoIncrement: true },
		person_id: { type: type.INTEGER },
		handle: { type: type.STRING },
		icon: { type: type.STRING },
		created: { type: type.DATE_TIME },
		modified: { type: type.DATE_TIME },
		deleted: { type: type.DATE_TIME }
	}});
	await db.runSql('CREATE UNIQUE INDEX handle_person_id_idx ON handles (handle, person_id) WHERE deleted IS NULL');
	await db.addIndex('handles', 'handles_handle', 'handle');
	await db.runSql('ALTER TABLE handles ADD CONSTRAINT handles_person_id_fk FOREIGN KEY (person_id) REFERENCES persons (id) MATCH FULL');
};

exports.down = async function(db)
{
	await db.runSql('DROP TABLE IF EXISTS handles;');
	await db.runSql('DROP INDEX IF EXISTS handle_person_id_idx;');
};

exports._meta =
{
	version: 1
};
