var dbm, type;

exports.setup = function setup(options, seedLink)
{
	dbm = options.dbmigrate;
	type = dbm.dataType;
};

exports.up = async function up(db)
{
	await db.createTable('fandomtags', { columns: {
		id: { type: type.INTEGER, primaryKey: true, autoIncrement: true },
		fandom_id: { type: type.INTEGER },
		tag: { type: type.STRING },
	}});
	await db.runSql('ALTER TABLE fandomtags ADD CONSTRAINT fandomtags_fandom_id_fk FOREIGN KEY (fandom_id) REFERENCES fandoms (id) MATCH FULL');

};

exports.down = async function down(db)
{
	await db.runSql('DROP TABLE IF EXISTS fandomtags;');
};

exports._meta =
{
	version: 1
};
