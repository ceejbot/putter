const
	// bole   = require('bole'),
	orm    = require('ormnomnom'),
	Handle = require('./handle'),
	Story  = require('./story')
	;

// const logger = bole('story-comment');

// TODO A refactoring suggests itself: extract common bits of Story & Review into "commentable".

class StoryComment
{
	constructor({ id, author, author_id, story, story_id, created, modified, deleted, content, rendered, status } = {})
	{
		this.id = id;
		this.author = author;
		this.author_id = author_id;
		this.story = story;
		this.story_id = story_id;
		this.status = status; // 'visible', 'hidden', 'usergone'
		this.content = content;
		this.rendered = rendered;
		this.created = created;
		this.modified = modified;
		this.deleted = deleted;
	}
}

StoryComment.objects = orm(StoryComment, {
	id: orm.joi.number(),
	author_id: orm.fk(Handle),
	story_id: orm.fk(Story),
	status: orm.joi.string().required(),
	content: orm.joi.string().required(), // TODO limits
	rendered: orm.joi.string().uri(),
	created: orm.joi.date(),
	modified: orm.joi.date(),
	deleted: orm.joi.date(),
});

module.exports = StoryComment;
