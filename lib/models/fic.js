// a work of fiction

/*

key
owner: foreign key, person
comments: has many, keys
likes:

*/

var
    _         = require('lodash'),
    Sequelize = require('sequelize')
    ;


var Story = module.exports = Sequelize.define('Story',
{
    title:        Sequelize.STRING,
    description:  Sequelize.TEXT,
    bodypath:     Sequelize.STRING,
    renderedpath: Sequelize.STRING,
});
