#!/usr/bin/env node

require('dotenv').config();

const
	completer = require('prefix-completer'),
	dbconn    = require('../lib/db-conn'),
	redis     = require('redis'),
	Tag       = require('../lib/models/tag')
	;

dbconn();

const tcompl = completer.create( { key: process.env.COMPL_TAGS, db: process.env.COMPL_DB } );

tcompl.statisticsAsync().then(counts =>
{
	console.log(`There are ${counts.leaves} in the completer already.`);
	return Tag.all();
}).then(tags =>
{
	const texts = tags.map(t => t.tag);
	return tcompl.addAsync(texts);
}).then( added =>
{
	console.log(`I guess we added ${added.length} tags to the completer`);
	process.exit(0);
}).catch(err =>
{
	console.log(err.message);
	process.exit(1);
});

