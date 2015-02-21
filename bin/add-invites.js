#!/usr/bin/env node

var
    _      = require('lodash'),
    bole   = require('bole'),
    chalk  = require('chalk'),
    sparky = require('../lib/sparky'),
    YAML   = require('js-yaml'),
    config = require('../config/config.yml'),
    yargs  = require('yargs')
        .usage('Add invitations to an account.\nUsage: $0 -p <handle|key|email> -c <invite-count>')
        .alias('p', 'person')
        .demand(['p'])
        .describe('p', 'the handle, email address, or id # of the account to add to')
        .alias('c', 'count')
        .default('c', 10)
        .describe('c', 'how many invitations to add')
    ;

var handle = yargs.argv.p;
var count = parseInt(yargs.argv.c);

config.logging.console = false;
var controller = new sparky.Sparky(config);
var inviter = controller.invitations;

function logAndBail(message)
{
    console.log(chalk.red(message));
    process.exit(1);
}

function addInvitations(err, person)
{
    if (err) logAndBail(err.message);
    if (!person) logAndBail(handle + ' was not found.');

    inviter.addToCreator(person, count, function(err, added)
    {
        if (err) logAndBail(err.message);

        console.log('Added ' + chalk.green(count === 1 ? 'one invitation' : added + ' invitations') + ' to ' + chalk.blue(handle) + '.');
        process.exit(0);
    });
}

if (handle.indexOf('@') > 0)
    controller.personByEmail(handle, addInvitations);
else if (_.isNumber(handle))
    controller.people.get(handle, addInvitations);
else
    controller.personByHandle(handle, addInvitations);
