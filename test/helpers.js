var
	fs = require('fs'),
	path = require('path')
	;

var testDir = process.cwd();
if (path.basename(testDir) !== 'test')
	testDir = path.join(testDir, 'test');

exports.readFixture = function(fixture)
{
	var fpath = path.join(testDir, 'fixtures', fixture) + '.json';
	var data = fs.readFileSync(fpath, 'utf8');
	return JSON.parse(data);
};

exports.loremIpsum = function()
{
	var fpath = path.join(testDir, 'fixtures', 'lorem-ipsum') + '.txt';
	var data = fs.readFileSync(fpath, 'utf8');
	return data;
};
