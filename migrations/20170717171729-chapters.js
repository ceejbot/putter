var dbm, type;

exports.setup = function setup(options, seedLink)
{
	dbm = options.dbmigrate;
	type = dbm.dataType;
};

exports.up = async function up(db)
{
	await db.createTable('chapters', { columns: {
		id: { type: type.INTEGER, primaryKey: true, autoIncrement: true },
		story_id: { type: type.INTEGER },
    title: { type: type.STRING },
    summary: { type: type.STRING },
    notes: { type: type.STRING },
    content: { type: type.STRING },
    rendered: { type: type.STRING },
		created: { type: type.DATE_TIME },
		modified: { type: type.DATE_TIME },
		deleted: { type: type.DATE_TIME }
	}});
	await db.runSql('ALTER TABLE chapters ADD CONSTRAINT chapters_story_id_fk FOREIGN KEY (story_id) REFERENCES fandoms (id) MATCH FULL');
	await db.runSql('CREATE INDEX chapters_story_idx ON chapters (story_id) WHERE deleted IS NULL');
};

exports.down = async function down(db)
{
	await db.runSql('DROP TABLE IF EXISTS chapters;');
	await db.runSql('DROP INDEX IF EXISTS chapters_story_idx;');
};

exports._meta =
{
	version: 1
};
