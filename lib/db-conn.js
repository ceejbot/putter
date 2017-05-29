'use strict';

const
	bole   = require('bole'),
	config = require('./db-config'),
	orm    = require('ormnomnom'),
	pg     = require('pg');

const logger = bole('db');

module.exports = function setDBConn(opts)
{
	if (!opts)
		opts = config[process.env.NODE_ENV];

	orm.setConnection(() =>
	{
		const deferred = new Promise((resolve, reject) =>
		{
			pg.connect(opts, (err, conn, done) =>
			{
				if (err)
				{
					logger.error('setting db connection');
					logger.error(err);
					return reject(err);
				}
				logger.debug('db connection created');
				return resolve({connection: conn, release: done});
			});
		});

		return deferred;
	});
};
