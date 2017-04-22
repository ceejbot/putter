'use strict'

module.exports =
{
	[process.env.NODE_ENV || 'dev']:
	{
		user:     process.env.DB_USER,
		database: process.env.DB_NAME,
		password: process.env.DB_PASSWORD,
		port:     process.env.DB_PORT,
		host:     process.env.DB_HOST,
		driver:   'pg'
	}
};
