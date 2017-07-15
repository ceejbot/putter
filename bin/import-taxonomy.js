#!/usr/bin/env node

require('dotenv').config();

const
	dbconn = require('../lib/db-conn'),
	fs     = require('fs'),
	path   = require('path'),
	Tag    = require('../lib/models/tag'),
	yaml   = require('js-yaml')
	;

dbconn();

const taxdir = path.resolve(path.join(__dirname, '..', 'taxonomy'));
var fandoms = {},
	i, prefix;

const data = fs.readFileSync(path.join(taxdir, 'tags.txt'), 'utf8');
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
})

/*

const fdir = path.join(taxdir, 'fandoms');
const files = fs.readdirSync(fdir);

files.forEach(file =>
{
	const data = fs.readFileSync(path.join(fdir, file), 'utf8');
	const fandom = yaml.load(data);
	fandoms[fandom.tag] = fandom;
});

const fkeys = Object.keys(fandoms);
console.log(fkeys.length + ' valid fandoms found');

// TODO store the fuckers
*/
