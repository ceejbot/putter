#!/usr/bin/env node

require('dotenv').config();

const
	dbconn = require('../lib/db-conn'),
	Fandom = require('../lib/models/fandom'),
	FChar  = require('../lib/models/fandomchar'),
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

	const episodes = (data.episodes || []).map(t => `episode:${util.cleanTagText(t)}`);
	const tags = episodes.concat(data.tags);
	tags.forEach(t =>
	{
		if (t) alltags.push(f.addTag(t));
	});

	(data.characters || []).forEach(c =>
	{
		if (!c) return;
		alltags.push(FChar.create({ tag: util.cleanTagText(c), fandom: f }));
	});

	return Promise.all(alltags).then(tags =>
	{
		console.log(`${alltags.length} tags & chars exist for ${f.tag}`);
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
