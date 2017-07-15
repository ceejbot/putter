#!/usr/bin/env node

require('dotenv').config();

const
	dbconn = require('../lib/db-conn'),
	Fandom = require('../lib/models/fandom'),
	fs     = require('fs'),
	path   = require('path'),
	util   = require('../lib/utilities'),
	yaml   = require('js-yaml')
	;

dbconn();

const taxdir = path.resolve(path.join(__dirname, '..', 'taxonomy'));
const fdir = path.join(taxdir, 'fandoms');
const files = fs.readdirSync(fdir);
const fkeys = [];
const fandoms = [];

files.forEach(file =>
{
	const data = fs.readFileSync(path.join(fdir, file), 'utf8');
	const fandom = yaml.load(data);
	fkeys.push(fandom.tag);
	fandoms.push(importFandom(fandom));
});

console.log(fkeys.length + ' valid fandoms found');

async function importFandom(data)
{
	const alltags = [];
	const f = await Fandom.findOrCreate(data);

	var tags = data.tags || [];
	tags.forEach(t =>
	{
		alltags.push(f.addTag(t));
	});

	tags = data.episodes || [];
	tags.forEach(t =>
	{
		alltags.push(f.addTag(`episode:${util.cleanTagText(t)}`));
	});

	console.log(`should have ${alltags.length} tags waiting for ${f.tag}`);
	Promise.all(alltags).then(tags =>
	{
		f.tags = tags;
		return f;
	});
}

Promise.all(fandoms).then(() =>
{
	console.log('stuff added');
	process.exit(0);
}).catch(err =>
{
	console.log(err.message);
	process.exit(1);
});
