const Joi = require('joi');

module.exports = {
	POST_USER_SIGNUP: Joi.object().keys({
	        handle: Joi.string(),
			password: Joi.string().regex(/^[a-zA-Z0-9]{8,128}$/).required(),
			email: Joi.string().email().required()
		}),
};