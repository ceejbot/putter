var dbm, type;

exports.setup = function(options, seedLink)
{
	dbm = options.dbmigrate;
	type = dbm.dataType;
};

exports.up = async function(db)
{
	await db.createTable('tokens', { columns: {
		id: { type: type.INTEGER, primaryKey: true, autoIncrement: true },
		person_id: { type: type.INTEGER },
		token: { type: type.STRING },
		permissions: { type: type.INTEGER },
		created: { type: type.DATE_TIME },
		touched: { type: type.DATE_TIME },
		ip: { type: type.STRING },
		os: { type: type.STRING },
		browser: { type: type.STRING },
	}});
	await db.runSql('ALTER TABLE tokens ADD CONSTRAINT tokens_person_id_fk FOREIGN KEY (person_id) REFERENCES persons (id) MATCH FULL');
	await db.addIndex('tokens', 'tokens_person_id_token_idx', ['person_id', 'token']);
	await db.addIndex('tokens', 'tokens_token', 'token');
};

exports.down = async function(db)
{
	await db.runSql('DROP TABLE IF EXISTS tokens;');
	await db.runSql('DROP INDEX IF EXISTS token_person_id_idx;');
	await db.runSql('DROP INDEX IF EXISTS tokens_token;');
};

exports._meta =
{
	version: 1
};
