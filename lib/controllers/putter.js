var
	_              = require('lodash'),
	assert         = require('assert'),
	async          = require('async'),
	completer      = require('prefix-completer'),
	events         = require('events'),
	Invitations    = require('./invitations'),
	models         = require('../models'),
	polyclay       = require('polyclay'),
	RethinkAdapter = require('polyclay-rethink'),
	search         = require('./search'),
	sparkutils     = require('../utilities'),
	Streams        = require('./streams'),
	util           = require('util'),
	uuid           = require('node-uuid')
	;

var Putter = module.exports = function Putter(config)
{
	assert(config && _.isObject(config), 'you must pass a configuration object');

	var self  = this;
	events.EventEmitter.call(this);
	this.name = config.app.name || 'putter';
	this.logger = sparkutils.createLogger(this.name, config.logging);
	this.config = config;

	_.each(models, function(model, item)
	{
		model.setStorage(config.database, RethinkAdapter);
		model.adapter.connect();
	});

	this.searchdb = new search.Searcher(config.elasticsearch);
	this.streams = new Streams(config.subscriptions);
	this.invitations = new Invitations();
};
util.inherits(Putter, events.EventEmitter);

Putter.prototype.provision = function provision()
{
	var self = this;
	var actions = [];

	_.each(models, function(model, item)
	{
		var f = function(cb)
		{
			model.adapter.once('ready', function()
			{
				model.adapter.provision(function()
				{
					self.logger.info(item + ' provisioned');
					cb();
				});
			});
			model.adapter.connect();
		};
		actions.push(f);
		actions.push(function(cb) { self.searchdb.registerDocumentType(model, cb); });
	});

	actions.push(function(cb) { self.searchdb.createTagMapping(cb); });

	async.parallel(actions, function(err, results)
	{
		self.emit('ready');
	});
};

Putter.prototype.shutdown = function shutdown(callback)
{
	// TODO
	callback();
};

Putter.prototype.logAndBail = function(prefix, err, callback)
{
	this.logger.error(prefix + ': ' + util.inspect(err));
	callback(err);
};

//------------------------------------------------------------------------------

Putter.prototype.register = function(person, inviteCode, callback)
{
	var self = this;

	models.Invitation.isValid(inviteCode, function(err, message, invitation)
	{
		if (err) return callback(err);
		if (message)
			return callback(null, { okay: false, error: message});

		self.savePerson(person, function(err, resp)
		{
			if (err) return callback(err);

			invitation.consume(person, function(err, consumed)
			{
				callback(null, resp);
			});
		});
	});
};

Putter.prototype.savePerson = function(person, callback)
{
	var self = this;

	var indexit = function(err, response)
	{
		self.searchdb.index(person, function(es_err, es_resp)
		{
			// TODO add to autocomplete
			return callback();
		});
	};

	person.modified = new Date();
	if (!person.key)
	{
		if (!person.valid()) return callback(person.errors);
		person.key = uuid.v1();
		person.save(indexit);
	}
	else
		person.save(indexit);
};

Putter.prototype.authenticate = function(handle, password, callback)
{
	var person,
		self = this;

	if (handle.indexOf('@') > 0)
		return self.authenticateByEmail(handle, password, callback);

	models.Person.findByHandle(handle, function(err, person)
	{
		if (err) return callback(err, false);
		person.authenticate(password, callback);
	});
};

Putter.prototype.authenticateByEmail = function(email, password, callback)
{
	models.Person.findByEmail_primary(email, function(err, person)
	{
		if (err) return callback(err, false);
		person.authenticate(password, callback);
	});
};

Putter.prototype.peopleByIDs = function(ids, callback)
{
	models.Person.get(ids, callback);
};

Putter.prototype.personByID = function(id, callback)
{
	models.Person.get(id, callback);
};

Putter.prototype.personByHandle = function(handle, callback)
{
	models.Person.findByHandle(handle, function(err, people)
	{
		if (err) return callback(err, false);
		if (people.length === 0) return callback();
		callback(null, people[0]);
	});
};

Putter.prototype.autocompleteHandle = function(handle, callback)
{
	var self = this;
	self.completer.handles.complete(handle, 15, function(err, prefix, completions)
	{
		if (err)
		{
			self.logger.error('handle autompletion error', JSON.stringify(err));
			return callback(err, []);
		}
		callback(null, completions);
	});
};

Putter.prototype.personByEmail = function(email, callback)
{
	models.Person.findByEmail(email, function(err, people)
	{
		if (err) return callback(err, false);
		if (people.length === 0) return callback();
		callback(null, people[0]);
	});
};

Putter.prototype.removePerson = function(person, callback)
{
	// TODO actually a lot more work
	// orphan fic (depending on flag)

	var self = this;
	var id = person.key;
	var handle = person.handle;

	var actionsList = [
		function(cb) { self.searchdb.remove(person, cb); },
		function(cb) { self.PeopleCatalog.removePerson(id, cb); },
		function(cb) { self.LikesIndex.removePersonLikes(id, cb); },
		function(cb) { models.Comment.removeByOwner(id, cb); },
		function(cb) { models.ReadingLogEntry.removeByOwner(id, cb); },
		function(cb) { self.completer.handles.remove(handle, cb); },
		function(cb) { self.FicCatalog.removeAllFicByPerson(id, cb); },
		function(cb) { person.destroy(cb); },
		// AND MORE
	];

	async.parallel(actionsList, function(err, results)
	{
		// this is stupid
		callback(err, !err);
	});
};

Putter.prototype.profile = function(person, callback)
{
	var self = this;
	models.Profile.get(person.key, function(err, profile)
	{
		if (!profile || (err && err.error === 'not_found'))
		{
			profile = new models.Profile();
			profile.key = person.key;
		}
		else if (err)
			return callback(err);
		callback(null, profile);
	});
};

Putter.prototype.profileFull = function(person, callback)
{
	var self = this;
	self.profile(person, function(err, profile)
	{
		if (err) return callback(err);

		self.fetchFic(profile.promoted_fic, function(err, ficlist)
		{
			if (err) return callback(err);

			profile.promoted_fic = ficlist;
			self.reviewByID(profile.promoted_reviews, function(err, reviewlist)
			{
				if (err) return callback(err);

				profile.promoted_reviews = reviewlist;
				callback(null, profile);
			});
		});
	});
};

//------------------------------------------------------------------------------

Putter.prototype.allFic = function(page, pageSize, callback)
{
	var d, i, results = [], self = this;
	self.FicCatalog.allByPage(page, pageSize, function(err, ids)
	{
		self.stories.get(ids, callback);
	});
};

Putter.prototype.fetchFic = function(id, callback)
{
	if (Array.isArray(id) && !id.length)
		return callback(null, []);
	this.stories.get(id, callback);
};

Putter.prototype.ficByIDs = function(ids, callback)
{
	var self = this;
	self.stories.get(ids, function(err, results)
	{
		if (err) return self.logAndBail('ficByIDs', err, callback);
		return callback(null, results);
	});
};

Putter.prototype.fetchFicRendered = function(id, callback)
{
	var self = this;
	if (!id) return callback('id parameter not supplied');
	this.stories.get(id, function(err, fic)
	{
		if (err) return self.logAndBail('fetchFicRendered', err, callback);
		fic.render(function(err, response)
		{
			callback(err, fic);
		});
	});
};

Putter.prototype.random = function(callback)
{
	this.FicCatalog.random(callback);
};

Putter.prototype.randomRecent = function(callback)
{
	this.FicCatalog.randomRecent(callback);
};

Putter.prototype.ficForPerson = function(input, page, pagesize, callback)
{
	var id, self = this;
	if (typeof input === 'object')
		id = input.key;
	else
		id = input;

	self.FicCatalog.ficCountByPerson(id, function(err, total)
	{
		if (err) return self.logAndBail('ficCountByPerson', err, callback);
		self.FicCatalog.ficByPerson(id, page, pagesize, function(err, ids)
		{
			if (err) return self.logAndBail('ficByPerson', err, callback);
			self.ficByIDs(ids, function(err, ficlist)
			{
				callback(err, { ficlist: ficlist, total: total });
			});
		});
	});
};

Putter.prototype.draftsForPerson = function(input, callback)
{
	var id, self = this;
	if (typeof input === 'object')
		id = input.key;
	else
		id = input;

	self.FicCatalog.draftsByPerson(id, function(err, ids)
	{
		if (err) return self.logAndBail('draftsByPerson', err, callback);
		self.ficByIDs(ids, function(err, ficlist)
		{
			callback(err, ficlist);
		});
	});
};

Putter.prototype.storeSeries = function(series, callback)
{
	var self = this;
	series.modified = new Date();

	var indexit = function(err, response)
	{
		self.searchdb.index(series, callback);
	};

	if (series.key)
		series.save(indexit);
	else
	{
		var id = sparkutils.randomID(6);
		series.key = id;

		series.save(function(err, response)
		{
			if (err) return self.logAndBail('storeSeries', err, callback);
			self.FicCatalog.addSeriesToPerson(series.owner, series, indexit);
		});
	}
};

Putter.prototype.generateFicID = function(fic, callback)
{
	var self = this;
	var id = sparkutils.randomID(6);
	self.FicCatalog.exists(id, function(err, inuse)
	{
		if (inuse)
			return self.generateFicID(fic, callback);

		fic.key = id;
		self.FicCatalog.consumeID(id, fic.owner_id, function(err, okay)
		{
			callback(err, id);
		});
	});
};

Putter.prototype.storeFic = function(document, callback)
{
	var self = this;
	document.modified = new Date();
	if (!document.pairing)
		document.pairing = 'gen'; // TODO the wrong place for data validation?

	var saveit = function()
	{
		document.save(function(err, response)
		{
			if (err)
				return callback(err);
			if (document.is_draft)
			{
				self.FicCatalog.addDraftToPerson(document.owner, document, function(err, fresh)
				{
					callback(null, document.key);
				});
				return;
			}
			self.publishFic(document, callback);
		});
	};

	if (!document.key)
	{
		self.generateFicID(document, function(err, id)
		{
			if (err)
				return callback(err);
			document.key = id;
			saveit();
		});
	}
	else
		saveit();

};

Putter.prototype.publishFic = function(document, callback)
{
	var self = this;
	document.is_published = true;
	document.is_draft = false;
	if (!document.published)
		document.published = new Date();

	function makeFandomIndexFunction(document, fandom)
	{
		var func = function(callback)
		{
			self.FandomsCatalog.addFic(fandom, document, callback);
		};
		return func;
	}

	var itemlist, i, j;

	var actionsList = [
		function(callback) { document.save(callback); },
		function(callback) { self.FicCatalog.removeDraftFromPerson(document.owner, document, callback); },
		function(callback) { self.FicCatalog.addFic(document, callback); },
		function(callback) { self.TagsCatalog.addFic(document, callback); },
	];

	actionsList.push(makeFandomIndexFunction(document, document.fandom));
	itemlist = document.fandoms_additional;
	for (i = 0; i < itemlist.length; i++)
		actionsList.push(makeFandomIndexFunction(document, itemlist[i]));

	async.parallel(actionsList, function(err, results)
	{
		callback(err, document.key);
		self.searchdb.index(document, function(err, indexed)
		{
			if (err)
				self.logger.error('error adding fic to ES: ' + document.key, err);
			else
				self.logger.info('fic ' + document.key + ' indexed in ES');
		});
		self.streams.fanout(document, function(err, count)
		{
			if (!err)
				self.logger.info('fic ' + document.key + ' added to ' + count + ' matching feeds');
		});
	});
};

Putter.prototype.unpublishFic = function(document, deleting, callback)
{
	var self = this;
	if (document.is_draft && !deleting)
		return callback(null, document.key);

	function makeFandomRemoveFunction(document, fandom)
	{
		var func = function(callback)
		{
			self.FandomsCatalog.removeFic(fandom, document, callback);
		};
		return func;
	}

	var actionsList, itemlist, i, j;

	actionsList = [
		function(callback) { self.FicCatalog.removeFic(document, callback); },
		function(callback) { self.TagsCatalog.removeFic(document, callback); },
	];

	actionsList.push(makeFandomRemoveFunction(document, document.fandom));
	itemlist = document.fandoms_additional;
	for (i = 0; i < itemlist.length; i++)
		actionsList.push(makeFandomRemoveFunction(document, itemlist[i]));

	if (!deleting)
	{
		document.is_draft = true;
		actionsList.push(function(callback) { document.save(callback); });
		actionsList.push(function(callback) { self.FicCatalog.addDraftToPerson(document.owner, document, callback); });
	}
	else
	{
		actionsList.push(function(callback) { self.FicCatalog.releaseID(document.key, callback); });
		actionsList.push(function(callback) { self.LikesIndex.removeFicLikes(document, callback); });
	}

	async.parallel(actionsList, function(err, results)
	{
		self.searchdb.remove(document, function(err, removed)
		{
			if (err)
				self.logger.error('error removing fic from ES: ' + document.key, err);
			else
				self.logger.info('fic ' + document.key + ' removed from ES');
		});
		callback(err, document.key);
	});
};

Putter.prototype.removeFic = function(document, callback)
{
	var self = this;
	var actions = [];
	actions.push(function(cb) { self.unpublishFic(document, true, cb); });
	actions.push(function(cb) { self.CommentsIndex.clear(document, cb); });
	actions.push(function(cb) { document.destroy(cb); });

	async.series(actions, function(err, replies)
	{
		if (!err && replies[2])
			return callback(null, true);

		// if we do nothing here, the document will be orphaned in couch.
		// link it up as a draft, last resort
		self.logger.error('failed to delete fic ' + document.key);
		self.FicCatalog.addDraftToPerson(document.owner, document, function(err2, okay)
		{
			return callback(err, false);
		});
	});
};

//------------------------------------------------------------------------------

Putter.prototype.tags = function(callback)
{
	var self = this;
	this.TagsCatalog.allTags(function(err, response)
	{
		callback(err, response);
	});
};

Putter.prototype.addTags = function(tagl, callback)
{
	var self = this;
	if (typeof tagl === 'string')
		tagl = [tagl];

	if (!tagl.length)
		return callback();

	self.completer.tag.addList(tagl, function(err, added)
	{
		if (err) return callback(err);


		function indexOneTag(tag, callback)
		{
			self.TagsCatalog.add(tag, function(err, added)
			{
				self.searchdb.indexTag(tag, callback);
			});
		}

		var continuer = function()
		{
			if (!tagl.length)
				return callback();
			indexOneTag(tagl.shift(), continuer);
		};

		indexOneTag(tagl.shift(), continuer);
	});
};

Putter.prototype.topNTags = function(count, callback)
{
	var self = this;
	this.TagsCatalog.topN(count, function(err, response)
	{
		callback(err, response);
	});
};

Putter.prototype.topNTagsFiltered = function(count, filter, callback)
{
	var self = this;
	var result = {};
	var offset = 0;

	function continuer(err, response)
	{
		if (err)
			return callback(err, result);

		var keys = Object.keys(response);
		if (!keys.length)
			return callback(null, result);

		for (var i = 0; i < keys.length; i++)
		{
			if (filter.test(keys[i]))
				result[keys[i]] = response[keys[i]];
			if (Object.keys(result).length === count)
				return callback(null, result);
		}

		offset += count;
		self.TagsCatalog.topNWithOffset(count, offset, continuer);
	}

	self.TagsCatalog.topNWithOffset(count, offset, continuer);
};

Putter.prototype.typeTags = function(callback)
{
	// TODO really should look this list up
	var tagl = [
		'type:het',
		'type:maleslash',
		'type:gen',
		'type:poly',
		'type:other',
		'type:femslash',
	];

	this.TagsCatalog.counts(tagl, callback);
};

Putter.prototype.ficForTag = function(tag, page, pagesize, callback)
{
	var self = this;
	this.TagsCatalog.fic(tag, page, pagesize, function(err, ids)
	{
		self.ficByIDs(ids, callback);
	});
};

Putter.prototype.autocompleteTag = function(prefix, callback)
{
	var self = this;
	self.completer.tag.complete(prefix, 15, function(err, prefix, completions)
	{
		if (err)
		{
			self.logger.error('tag autompletion error', JSON.stringify(err));
			return callback(err, []);
		}

		callback(null, completions);
	});
};

//------------------------------------------------------------------------------

Putter.prototype.allFandoms = function(callback)
{
	var self = this;
	models.Fandom.all(function(err, response)
	{
		callback(err, response);
	});
};

Putter.prototype.recentFandoms = function(callback)
{
	var self = this;
	self.FandomsCatalog.recentFandoms(function(err, ids)
	{
		if (err) return callback(err);
		self.fandoms.get(ids, callback);
	});
};

Putter.prototype.fandomData = function(tag, callback)
{
	var self = this;
	var result = {};

	self.fandoms.get(tag, function(err, fandom)
	{
		if (err || !fandom)
			return callback(err, result);

		result.fandom = fandom;
		self.FandomsCatalog.ficCount(tag, function(err, total)
		{
			result.ficcount = total;

			self.FandomsCatalog.ficCountsByAllPairings(tag, function(err, pairings)
			{
				result.pairings = pairings;
				self.FandomsCatalog.ficCountsByAllCharacters(tag, function(err, characters)
				{
					result.characters = characters;

					self.TagsCatalog.counts(fandom.advertisedTags().sort(), function(err, tags)
					{
						result.tags = tags;
						callback(null, result);
					});
				});
			});
		});
	});
};

Putter.prototype.fandomPairings = function(tag, callback)
{
	this.FandomsCatalog.ficCountsByAllPairings(tag, callback);
};

Putter.prototype.ficForFandom = function(ftag, page, pagesize, callback)
{
	var self = this;
	self.FandomsCatalog.fic(ftag, page, pagesize, function(err, ids)
	{
		self.ficByIDs(ids, function(err, ficlist)
		{
			callback(err, ficlist);
		});
	});
};

Putter.prototype.randomFicByFandom = function(ftag, callback)
{
	this.FandomsCatalog.randomFic(ftag, callback);
};

Putter.prototype.ficForFandomCharacter = function(ftag, character, callback)
{
	// TODO paginate eventually
	var self = this;
	var result = {};
	self.fandoms.get(ftag, function(err, fandom)
	{
		if (err || !fandom)
			return callback(err, result);

		result.fandom = fandom;
		self.FandomsCatalog.ficByCharacter(ftag, character, 1, 1000, function(err, ids)
		{
			self.ficByIDs(ids, function(err, ficlist)
			{
				result.ficlist = ficlist;
				callback(err, result);
			});
		});
	});
};

Putter.prototype.ficForFandomPairing = function(ftag, pairing, callback)
{
	// TODO paginate eventually
	var self = this;
	var result = {};
	self.fandoms.get(ftag, function(err, fandom)
	{
		if (err || !fandom)
			return callback(err, result);

		result.fandom = fandom;
		self.FandomsCatalog.ficByPairing(ftag, pairing, 1, 1000, function(err, ids)
		{
			self.ficByIDs(ids, function(err, ficlist)
			{
				result.ficlist = ficlist;
				callback(err, result);
			});
		});
	});
};

Putter.prototype.createFandom = function(fandom, callback)
{
	var self = this;
	// iterate through tags and add to fandom tags index
	// iterate through related fandoms & store in those fandoms as well as this

	var actionsList = [], itemlist, i;

	actionsList.push(function(callback) {self.completer.fandom.add(fandom.tag, callback); } );
	actionsList.push(function(callback) { self.searchdb.index(fandom, callback); } );

	fandom.save(function(err, response)
	{
		if (err) self.logAndBail('createFandom', err, callback);
		async.parallel(actionsList, function(err, results)
		{
			callback(err, fandom.key);
		});
	});
};

Putter.prototype.removeFandom = function(fandom, callback)
{
	var self = this;

	// remove tags, characters, related fandoms
	// remove fic lists
	// remove completions
	callback('unimplemented');
};

Putter.prototype.autocompleteFandom = function(prefix, callback)
{
	var self = this;

	self.completer.fandom.complete(prefix, 15, function(err, prefix, completions)
	{
		if (err)
		{
			self.logger.error('fandom autompletion error', JSON.stringify(err));
			return callback(err, []);
		}
		callback(null, completions);
	});
};

//------------------------------------------------------------------------------

Putter.prototype.likesByFic = function(document, callback)
{
	var self = this;
	self.LikesIndex.likesByFic(document, function(err, ids)
	{
		if (err) return self.logAndBail('likesByFic', err, callback);
		self.peopleByIDs(ids, function(err, people)
		{
			callback(err, people);
		});
	});
};

Putter.prototype.likesByPerson = function(person, callback)
{
	var self = this;
	self.LikesIndex.likesByPerson(person, function(err, ids)
	{
		if (err) return self.logAndBail('likesByPerson', err, callback);
		self.ficByIDs(ids, function(err, ficlist)
		{
			callback(err, ficlist);
		});
	});
};

Putter.prototype.like = function(person, document, callback)
{
	var self = this;
	if (person.key === document.owner_id)
	{
		self.logger.warn(person.key + ' not allowed to like own fic ' + document.key);
		return callback(null, false);
	}

	self.LikesIndex.like(person, document, function(err, okay)
	{
		self.updateReadingLog(person, document, 'like', null, function(err2, resp)
		{
			callback(err, okay);
		});
	});
};

Putter.prototype.unlike = function(person, document, callback)
{
	var self = this;
	if (person.key === document.owner_id)
	{
		self.logger.warn(person.key + ' not allowed to unlike own fic ' + document.key);
		return callback(null, false);
	}

	self.LikesIndex.unlike(person, document, function(err, okay)
	{
		self.updateReadingLog(person, document, 'unlike', null, function(err2, resp)
		{
			callback(err, okay);
		});
	});
};

//------------------------------------------------------------------------------

Putter.prototype.feedback = function(document, callback)
{
	var self = this;
	self.CommentsIndex.fetchComments(document, function(err, ids)
	{
		if (err)
			return callback(err);

		models.Comment.get(ids, callback);
	});
};

Putter.prototype.feedbackSubtree = function(id, callback)
{
	var self = this;
	self.CommentsIndex.fetchSubtree(id, function(err, ids)
	{
		if (err)
			return callback(err, {});

		models.Comment.get(ids, callback);
	});
};

Putter.prototype.leaveFeedback = function(person, document, feedback, callback)
{
	var self = this;

	var comment = new models.Comment();
	comment.owner = person;
	comment.target = document;
	comment.parent = document;
	comment.title = feedback.title;
	comment.content = feedback.content;

	self.CommentsIndex.generateCommentID(document, document, function(err, id)
	{
		if (err)
			return callback(err);
		comment.key = id;
		comment.save(function(err, response)
		{
			if (err)
			{
				self.CommentsIndex.releaseID(id, function(err2, reply)
				{
					return callback(err);
				});
			}

			if (person.key === document.owner_id)
				return callback(null, comment);

			self.updateReadingLog(person, document, 'feedback', comment, function(err, entry)
			{
				if (err)
				{
					console.log('error updating reading log');
					console.log(entry);
					console.log(err);
				}
				callback(null, comment);
			});
		});
	});
};

Putter.prototype.respondToComment = function(person, parent_id, feedback, callback)
{
	var self = this;

	if (typeof parent_id === 'object')
		parent_id = parent_id.key;

	var comment = new models.Comment();
	comment.owner = person;
	comment.title = feedback.title;
	comment.content = feedback.content;

	self.comments.get(parent_id, function(err, parent)
	{
		if (err)
			return callback(err);

		var replyAllowed = true;
		if (parent instanceof models.Comment)
			replyAllowed = parent.canBeRepliedTo();

		if (!replyAllowed)
			return callback(new Error('parent cannot be replied to'));

		comment.parent = parent;
		comment.target_id = parent.target_id;

		self.CommentsIndex.generateCommentID(parent.target_id, parent, function(err, id)
		{
			if (err)
				return callback(err);
			comment.key = id;
			comment.save(function(err, response)
			{
				if (err)
					return callback(err);
				parent.freeze();
				parent.save(function(err, resp)
				{
					callback(null, comment);
				});
			});
		});
	});
};

Putter.prototype.feedbackByPerson = function(person, callback)
{
	models.Comment.findByOwner(person, callback);
};

Putter.prototype.hideComment = function(actor, comment, callback)
{
	// actor must own the comment's parent document, or the action is disallowed.
	models.Story.get(comment.target_id, function(err, doc)
	{
		if (actor.key !== doc.owner_id)
			return callback(null, comment);

		comment.state = 'hidden';
		comment.save(function(err, resp)
		{
			return callback(err, comment);
		});
	});
};

Putter.prototype.deleteComment = function(actor, comment, callback)
{
	// actor must own the comment. Administrative action will be handled
	// by a separate controller, probably.
	if (actor.key !== comment.owner_id)
		return callback(null, comment);

	comment.markAsDeleted('owner');
	comment.save(function(err, resp)
	{
		return callback(err, comment);
	});
};

//------------------------------------------------------------------------------

Putter.prototype.review = function(person, document, data, callback)
{
	if (person.key === document.owner_id)
		return callback(new Error('cannot review your own fic'));

	var self = this;
	var review;

	// check to see if this person has already reviewed this item; if so,
	// update the review with the provided text.

	models.Review.findByOwnerTarget(person.key, document.key, function(err, matches)
	{
		if (err) return callback(err);
		if (matches.length > 0)
			review = matches[0];
		else
		{
			review = new models.Review();
			review.key = sparkutils.randomID(6);
			review.owner = person;
			review.target = document;
		}

		review.content = data.content;
		review.title = data.title || '';
		review.tags = data.tags || [];

		review.save(function(err, resp)
		{
			if (err)
				return callback(err);

			self.updateReadingLog(person, document, 'review', review, function(err, entry)
			{
				// TODO error handling; rollback? but we have a review saved
				if (err)
					return callback(err, review);

				return callback(null, review);
			});
		});
	});
};

Putter.prototype.reviewsByPerson = function(person, callback)
{
	models.Review.findByOwner(person.key, callback);
};

Putter.prototype.reviewsByStory = function(document, callback)
{
	models.Review.findByTarget(document.key, callback);
};

Putter.prototype.reviewByID = function(id, callback)
{
	if (!id || !id.length)
		return callback(null, []);
	this.reviews.get(id, callback);
};

Putter.prototype.fetchReview = function(person, target, callback)
{
	var pid = (typeof person === 'string') ? person : person.key;
	var tid = (typeof target === 'string') ? target : target.key;

	models.Review.findByOwnerTarget(pid, tid, function(err, matches)
	{
		var review;
		if (err) return callback(err);
		if (matches.length > 0)
			review = matches[0];
		callback(null, review);
	});
};

Putter.prototype.removeReview = function(review, callback)
{
	var self = this;
	var person_id = review.owner_id;
	var target_id = review.target_id;

	function handleError(err)
	{
		self.logAndBail('removeReview', err, callback);
	}

	var actions =
	[
		function(callback) { review.destroy(callback); },
		function(callback) { self.personByID(person_id, callback); },
		function(callback) { self.fetchFic(target_id, callback); },
	];

	async.parallel(actions, function(err, responses)
	{
		if (err) return handleError(err);

		var deleted = responses[0];
		var person = responses[1];
		var story = responses[2];
		self.updateReadingLog(person, story, 'review', null, function(err, logentry)
		{
			// eat this error because it didn't affect the review deletion
			callback(null, deleted);
		});
	});
};

//------------------------------------------------------------------------------

Putter.prototype.recordVisit = function(person, document, callback)
{
	this.updateReadingLog(person, document, 'visit', null, callback);
};

Putter.prototype.logEntry = function(person, document, createIfNeeded, callback)
{
	if (person.key === document.owner_id)
		return callback(new Error(person.key + ' owns document ' + document.key));

	var self = this;
	self.PeopleCatalog.getLogEntry(person, document, function(err, id)
	{
		if (err) return callback(err);
		if (!id)
		{
			if (!createIfNeeded)
				return callback(null, null);

			var entry = new models.ReadingLogEntry();
			entry.target_id = document.key;
			entry.owner = person;
			entry.save(function(err, resp)
			{
				if (err) return callback(err);
				self.PeopleCatalog.recordLogEntry(person, document, entry, function(err, okay)
				{
					callback(err, entry);
				});
			});
		}
		else
		{
			self.readinglogs.get(id, function(err, entry)
			{
				return callback(err, entry);
			});
		}
	});
};

Putter.prototype.updateReadingLog = function(person, document, action, target, callback)
{
	// We do not track your history of reading your own fic.
	if (person.key === document.owner_id)
		return callback();

	var self = this;

	self.logEntry(person, document, true, function(err, entry)
	{
		entry.recordAction(action, target);
		entry.save(function(err, okay)
		{
			callback(err, entry);
		});
	});
};

Putter.prototype.readingLog = function(person, page, pagesize, callback)
{
	var self = this;
	var result = {};

	var fetcher = function(entry, callback)
	{
		self.stories.get(entry.target_id, function(err, fic)
		{
			entry.target = fic;
			callback(err);
		});
	};

	self.PeopleCatalog.logEntryCount(person, function(err, total)
	{
		result.total = total;

		self.PeopleCatalog.logsByPage(person, page, pagesize, function(err, ids)
		{
			self.readinglogs.get(ids, function(err, entries)
			{
				async.forEach(entries, fetcher, function(errz)
				{
					result.entries = entries;
					callback(err, result);
				});
			});
		});
	});
};

Putter.prototype.hideLogEntry = function(person, entry, callback)
{
	var self = this;
	if (person.key !== entry.owner_id)
		return callback(new Error(person.key + ' does not own log entry ' + entry.key), entry);

	entry.hide();
	entry.save(function(err, resp)
	{
		callback(err, entry);
	});
};

//------------------------------------------------------------------------------

Putter.prototype.follow = function(person, target, callback)
{
	this.PeopleCatalog.follow(person, target, callback);
};

Putter.prototype.unfollow = function(person, target, callback)
{
	this.PeopleCatalog.unfollow(person, target, callback);
};

Putter.prototype.followers = function(person, callback)
{
	var self = this;
	this.PeopleCatalog.followers(person, function(err, ids)
	{
		self.people.get(ids, callback);
	});
};

Putter.prototype.followersByHandle = function(person, callback)
{
	var self = this;
	this.PeopleCatalog.followersByHandle(person, callback);
};

Putter.prototype.following = function(person, callback)
{
	var self = this;
	this.PeopleCatalog.following(person, function(err, ids)
	{
		self.people.get(ids, callback);
	});
};

Putter.prototype.followingByHandle = function(person, callback)
{
	var self = this;
	this.PeopleCatalog.followingByHandle(person, callback);
};

//------------------------------------------------------------------------------

Putter.prototype.search = function(terms, callback)
{
	var self = this;
	var parsed = this.searchdb.parseSearchTerms(terms);

	this.searchdb.search(terms, function(err, results)
	{
		// enhance the results with additional data
		// cache the search in memcached etc
		results.parsed = parsed;

		if (results.tags.length > 0)
		{
			self.TagsCatalog.counts(results.tags, function(err, counts)
			{
				results.tags = counts;
				callback(err, results);
			});
			return;
		}

		callback(err, results);
	});
};

Putter.prototype.serviceName = 'controller';

//------------------------------------------------------------------------------


exports.Putter = Putter;
