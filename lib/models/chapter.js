const
//	bole  = require('bole'),
	orm   = require('ormnomnom'),
	Story = require('./story')
	;

// const logger = bole('chapter');

class Chapter
{
	constructor({ id, story, story_id, title, summary, notes, content, rendered, created, modified, deleted } = {})
	{
		this.id = id;
		this.story = story;
		this.story_id = story_id;
		this.title = title;
		this.summary = summary;
		this.notes = notes;
		this.content = content;
		this.rendered = rendered; // TODO why not make this uri predictable?
		this.created = created;
		this.modified = modified;
		this.deleted = deleted;
	}

	render()
	{
		// TODO
	}

	async fetchRendered()
	{
		// TODO speculative; get the rendered content from object store
	}

	async fetchAsTyped()
	{
		// TODO speculative; get the unrendered content from object store
	}

	async create({ story, story_id, title, summary, notes, content })
	{
		// TODO initialize from web form
	}

	async update({ story, story_id, title, summary, notes, content })
	{
		// TODO update from web form
		// update fields
		// update timestamps
		// store in pg
		// rerender & store content blobs
	}
}

Chapter.objects = orm(Chapter, {
	id: orm.joi.number(),
	story_id: orm.fk(Story),
	title: orm.joi.string().max(512),
	summary: orm.joi.string().max(1000),
	notes: orm.joi.string().max(1000),
	content: orm.joi.string().uri(), // TODO there should be a limit here but v large
	rendered: orm.joi.string().uri(),
	created: orm.joi.date().default(() => new Date(), 'current date'),
	modified: orm.joi.date().default(() => new Date(), 'current date'),
	deleted: orm.joi.date(),
});

module.exports = Chapter;

