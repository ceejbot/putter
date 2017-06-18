var dbm, type;

exports.setup = function setup(options, seedLink)
{
	dbm = options.dbmigrate;
	type = dbm.dataType;
};

exports.up = async function up(db)
{
	await db.createTable('tags', { columns: {
		id: { type: type.INTEGER, primaryKey: true, autoIncrement: true },
		tag: { type: type.STRING, unique: true },
	}});
	await db.runSql('CREATE UNIQUE INDEX tags_tag_idx ON tags (tag)');
};

exports.down = async function down(db)
{
	await db.runSql('DROP TABLE IF EXISTS tags;');
	await db.runSql('DROP INDEX IF EXISTS tags_tag_idx;');
};

exports._meta =
{
	version: 1
};
