'use strict';

const
	bole   = require('bole'),
	config = require('./db-config'),
	orm    = require('ormnomnom'),
	P      = require('bluebird'),
	pg     = require('pg');

const logger = bole('db');

module.exports = function setDBConn(opts)
{
	if (!opts)
		opts = config[process.env.NODE_ENV];

	orm.setConnection(() =>
	{
		const deferred = P.defer();
		pg.connect(opts, (err, conn, done) =>
		{
			if (err)
			{
				logger.error('setting db connection');
				logger.error(err);
				return deferred.reject(err);
			}

			logger.debug('db connection created');
			return deferred.resolve({connection: conn, release: done});
		});

		return deferred.promise;
	});
};
