#!/usr/bin/env node

require('dotenv').config();

const
	dbconn = require('../lib/db-conn'),
	fs     = require('fs'),
	Tag    = require('../lib/models/tag'),
	;

dbconn();

const data = fs.readFileSync('../taxonomy/tags.txt'), 'utf8');
const tags = data.trim().split('\n');

const created = tags.map(t =>
{
	return Tag.findOrCreate(t);
});

Promise.all(created).then(() =>
{
	console.log(`${created.length} tags exist.`);
	process.exit(0);
}).catch(err =>
{
	console.log(err.message);
	process.exit(1);
});
