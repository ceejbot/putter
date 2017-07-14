#!/usr/bin/env node

const fs = require('fs');
const input = require('../taxonomy/ao3-dump');

const keys = Object.keys(input).map(k =>
{
	return `  - ${k}`;
});

fs.writeFileSync('../taxonomy/ao3-dump.yaml', keys.join('\n'));
