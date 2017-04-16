#!/usr/bin/env node

const
	fs   = require('fs'),
	path = require('path'),
	util = require('util'),
	yaml = require('js-yaml')
	;

const taxdir = path.resolve(path.join(__dirname, '..', 'taxonomy'));

var fandoms = {},
	tags = {},
	i, prefix;

const data = fs.readFileSync(path.join(taxdir, 'tags.yml'), 'utf8');
yaml.loadAll(data, doc =>
{
	tags = doc;
	var tkeys = Object.keys(tags);
	var finaltags = [];
	for (i = 0; i < tkeys.length; i++)
	{
		if (tkeys[i] === 'content')
			prefix = '';
		else
			prefix = tkeys[i] + ':';
		tags[tkeys[i]].forEach(cat =>
		{
			finaltags.push(prefix + cat);
		});
	}

	finaltags.sort();
	console.log(finaltags.length + ' tags found');
	console.log(util.inspect(finaltags));
});

const fdir = path.join(taxdir, 'fandoms');
const files = fs.readdirSync(fdir);

files.forEach(file =>
{
	const data = fs.readFileSync(path.join(fdir, file), 'utf8');
	const fandom = yaml.load(data);
	fandoms[fandom.tag] = fandom;
});

const fkeys = Object.keys(fandoms);
console.log(fkeys.length + ' valid fandoms found: ');
console.log(util.inspect(fkeys));
