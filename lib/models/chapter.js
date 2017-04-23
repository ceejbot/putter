'use strict';

const
	bole  = require('bole'),
	orm   = require('ormnomnom'),
	Story = require('./story')
	;

const logger = bole('chapter');

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
}

Chapter.objects = orm(Chapter, {
	id: orm.joi.number(),
	story_id: orm.fk(Story),
	title: orm.joi.string(), // TODO limits
	summary: orm.joi.string(), // TODO limits
	notes: orm.joi.string(), // TODO limits
	content: orm.joi.string(), // TODO limits
	rendered: orm.joi.string().uri(),
	created: orm.joi.date(),
	modified: orm.joi.date(),
	deleted: orm.joi.date(),
});

module.exports = Chapter;
