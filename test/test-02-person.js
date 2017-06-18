/*global describe:true, it:true, before:true, after:true */
'use strict';

var
	demand = require('must'),
	Person  = require('../lib/models/person')
	;

describe('Person', () =>
{
	it('exports a class', () =>
	{
		Person.must.exist();
		Person.must.be.a.function();
		(new Person({})).must.be.instanceof(Person);
	});

	it('has tests');
});
