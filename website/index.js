var
    _       = require('lodash'),
    assert  = require('assert'),
    bole    = require('bole'),
    express = require('express')
    ;

var WebServer = module.exports = function WebServer(options)
{
    this.app = express();

    this.options = options;
    this.logger = bole('webapp');

    // TODO mount middleware after having selected it

    // TODO mount routes after having written them

};

WebServer.prototype.app     = null;
WebServer.prototype.options = null;
WebServer.prototype.logger  = null;

WebServer.prototype.listen = function()
{
    var self = this;

    this.app.listen(this.options.port, this.options.host, function()
    {
        self.logger.info('now listening on port ' + this.options.port);
    });
};
