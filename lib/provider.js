var redis = require('redis');

module.exports = function (options) {

	var client = redis.createClient();

	return {
		create: function () {

		}
	};
};