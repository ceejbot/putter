var dbm, type;

exports.setup = function setup(options, seedLink)
{
	dbm = options.dbmigrate;
	type = dbm.dataType;
};

exports.up = async function up(db)
{
	await db.createTable('fandoms', { columns: {
		id: { type: type.INTEGER, primaryKey: true, autoIncrement: true },
		tag: { type: type.STRING, unique: true },
		name: { type: type.STRING },
		description: { type: type.STRING },
		created: { type: type.DATE_TIME },
		modified: { type: type.DATE_TIME },
		deleted: { type: type.DATE_TIME },
	}});
	await db.addIndex('fandoms', 'fandoms_tag_idx', ['tag']);
};

exports.down = async function down(db)
{
	await db.runSql('DROP TABLE IF EXISTS fandoms;');
	await db.runSql('DROP INDEX IF EXISTS fandoms_tag_idx;');
};

exports._meta =
{
	version: 1
};
