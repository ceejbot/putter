#!/usr/bin/env node

var
	_       = require('lodash'),
	fs      = require('fs'),
	path    = require('path'),
	util    = require('util'),
	yaml    = require('js-yaml')
;

var taxdir = path.resolve(path.join(__dirname, '..', 'taxonomy'));
var finaltags = [];
var fandoms = {}, tags = {}, data, fandom, i, prefix, category;

data = fs.readFileSync(path.join(taxdir, 'tags.yml'), 'utf8');
yaml.loadAll(data, function(doc)
{
	tags = doc;
	var tkeys = Object.keys(tags);
	for (i = 0; i < tkeys.length; i++)
	{
		if (tkeys[i] === 'content')
			prefix = '';
		else
			prefix = tkeys[i] + ':';
		category = tags[tkeys[i]];
		for (var j = 0; j < category.length; j++)
			finaltags.push(prefix + category[j]);
	}

	finaltags.sort();
});

var fdir = path.join(taxdir, 'fandoms');
var files = fs.readdirSync(fdir);

for (i = 0; i < files.length; i++)
{
	data = fs.readFileSync(path.join(fdir, files[i]), 'utf8');
	fandom = yaml.load(data);
	fandoms[fandom.tag] = fandom;
}

var fkeys = Object.keys(fandoms);
console.log(fkeys.length + ' valid fandoms found');
console.log(finaltags.length + ' tags found');

// store the fuckers
