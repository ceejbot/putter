const
	// bole   = require('bole'),
	orm    = require('ormnomnom'),
	Handle = require('./handle'),
	Story  = require('./story')
	;

// const logger = bole('review');

class Review
{
	constructor({ id, author, author_id, story, story_id, created, modified, deleted, title, content, rendered } = {})
	{
		this.id = id;
		this.author = author;
		this.author_id = author_id;
		this.story = story;
		this.story_id = story_id;
		this.title = title;
		this.content = content;
		this.rendered = rendered;
		this.created = created;
		this.modified = modified;
		this.deleted = deleted;
	}
}

Review.objects = orm(Review, {
	id: orm.joi.number(),
	author_id: orm.fk(Handle),
	story_id: orm.fk(Story),
	title: orm.joi.string().required(), // TODO limits
	content: orm.joi.string().required(), // TODO limits
	rendered: orm.joi.string().uri(),
	created: orm.joi.date(),
	modified: orm.joi.date(),
	deleted: orm.joi.date(),
});

module.exports = Review;
