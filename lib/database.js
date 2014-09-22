
var
    assert    = require('assert'),
    Sequelize = require('sequelize')
    ;

var createConnection = exports.createConnection = function(options)
{
    exports.sequelize = new Sequelize(options.db, options.user, options.pass,
    {
        dialect: options.dialect
    });
};

var connection = exports.connection = function()
{
    return exports.sequelize;
}
