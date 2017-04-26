const
	fs                = require('fs'),
	YAML              = require('js-yaml'),
	path              = require('path');

exports.loadYAML = function loadYAML(ypath)
{
	var result;
	try
		{ result = YAML.load(fs.readFileSync(ypath, 'utf8')); }
	catch (err)
	{
		console.log(err);
	}

	return result;
};

exports.countWords = function countWords(corpus)
{
	return corpus.replace(/\W/, '').split(/\s+/).length;
};

exports.escapeForURL = function escapeForURL(input)
{
	var result = encodeURIComponent(input.toLowerCase());
	result = result.replace('%2F', '/').replace('%3A', ':');
	return result;
};

exports.cleanTagText = function cleanTagText(input)
{
	var result = input.trim().toLowerCase().replace(/[,;\s*\\.'"$^()=%]+/g, '');
	return result;
};

exports.dataLength = function dataLength(data)
{
	if (!data)
		return 0;
	if (data instanceof Buffer)
		return data.length;
	return Buffer.byteLength(data);
};

// These are for fic ids in couch. No strong randomness needed.
var alpha = '0123456789abcdefghijklmnopqrstuvwxyz';
exports.randomID = function randomID(length)
{
	length = length || 6;
	var result = '';
	for (var i = 0; i < length; i++)
		result += alpha[Math.floor(Math.random() * alpha.length)];

	return result;
};
