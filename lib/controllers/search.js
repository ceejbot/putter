var
    _       = require('lodash'),
    models  = require('../models'),
    path    = require('path'),
    Request = require('request'),
    util    = require('util')
    ;

var MAX_RESULTS = 2000;

function Searcher(config)
{
    this.host = config.host || 'localhost';
    this.port = config.port || 9200;
    this.indexname = config.index || '/sparky';
    this.flushImmediately = config.flushImmediately || false;
    this.urlbase = 'http://' + this.host + ':' + this.port + '/' + this.indexname;
}

Searcher.prototype.status = function(callback)
{
    var self = this;
    var opts =
    {
        url:    this.urlbase,
        json:   true
    };
    Request.get(opts, function(err, response, data)
    {
        callback(err, data);
    });
};

//----------------------------------------------------------------------
Searcher.prototype.registerDocumentType = function(modelClass, callback)
{
    var self = this,
        mapping = modelClass.searchMapping,
        type = modelClass.prototype.plural;

    // make sure an index exists
    var opts = { method: 'PUT', uri: this.urlbase };
    Request(opts, function(err, response, data)
    {
        // now create a mapping for our data type
        var mappath = path.join(self.indexname, type, '_mapping');
        opts = {
            method: 'PUT',
            uri: self.urlbase + '/' + type + '/_mapping',
            json: mapping
        };
        Request(opts, function(err, response, body)
        {
            if (body && body.error) err = body.error;
            callback(err, body);
        });
    });
};

Searcher.prototype.dropDocumentType = function (modelClass, callback)
{
    var self = this;
    var indexpath = path.join(self.indexname, modelClass.prototype.plural);

    var opts =
    {
        method: 'DELETE',
        uri:    this.urlbase,
        json:   true
    }
    Request(opts, function(err, response, body)
    {
        if (body && body.error) err = body.error;
        callback(err, body);
    });
};

Searcher.prototype.index = function(document, callback)
{
    var self = this;
    var data = document.searchData();
    var indexpath = path.join(document.plural, data._id);
    if (self.flushImmediately)
        indexpath += '?refresh=true';

    var opts =
    {
        method: 'PUT',
        url: this.urlbase + '/' + indexpath,
        json: data
    };

    Request(opts, function(err, response, body)
    {
        if (body && body.error)
            err = new Error(body.error);
        else if ((response.statusCode !== 201) && (response.statusCode !== 200))
            err = new Error('unexpected status code: ' + response.statusCode);
        callback(err, body);
    });
};

Searcher.prototype.remove = function(document, callback)
{
    var self = this;
    var data = document.searchData();
    var indexpath = path.join(data.type, data._id);

    var opts =
    {
        method: 'DELETE',
        url: this.urlbase + '/' + indexpath,
        json: true
    };

    Request(opts, function(err, response, body)
    {
        if (body && body.error) err = body.error;
        callback(err, body);
    });
};

//----------------------------------------------------------------------
// tags are unusual, since they are not backed by a couchdb model

Searcher.prototype.createTagMapping = function(callback)
{
    var self = this;
    var mapping =
    {
        'tag':
        {
            properties:
            {
                '_id': { type: 'string', index: 'not_analyzed', include_in_all: false },
                'tag': { type: 'string', analyzer: 'english', 'store': 'yes', include_in_all: true },
                'text': { type: 'string', analyzer: 'english', 'store': 'yes', include_in_all: true },
                'category': {type: 'string', analyzer: 'english', 'store': 'yes', include_in_all: false }
            }
        }
    };

    // make sure an index exists
    var opts = { method: 'PUT', url: this.urlbase };
    Request(opts, function(err, response, data)
    {
        var mappath = path.join('tags', '_mapping');
        opts =
        {
            method: 'PUT',
            url:    this.urlbase + '/' + mappath,
            json:   mapping
        }

        Request(opts, function(err, response, body)
        {
            if (body && body.error) err = body.error;
            callback(err, body);
        });
    });
};

Searcher.prototype.dropTagIndex = function (callback)
{
    var self = this;
    var opts =
    {
        method: 'DELETE',
        url:    this.urlbase + '/tags',
        json:   true
    }

    Request(opts, function(err, response, body)
    {
        if (body && body.error) err = body.error;
        // should log error
        callback(null, body);
    });
};

Searcher.prototype.indexTag = function(tag, callback)
{
    var self = this;
    var idx = tag.indexOf(':');
    var text = encodeURIComponent(tag);
    var prefix = '';
    if (idx > 0)
    {
        prefix = tag.substring(0, idx);
        text = tag.substring(idx+1);
    }

    var data = {type: 'tag', _id: tag, tag: tag, text: text, category: prefix };
    var indexpath = path.join('tags', data._id);

    var opts =
    {
        method: 'PUT',
        url:    this.urlbase + '/' + indexpath,
        json:   data
    }

    Request(opts, function(err, response, body)
    {
        if (body && body.error) err = body.error;
        callback(err, body);
    });
};

//----------------------------------------------------------------------
// search term parsing

var preciseModeDetect = /(\s|^)(@|#)/;
var handlesPrecise = /@([^\#@\s]+)/;
var tagsPrecise = /#([^\#@\s]+)/;
var fandomFinder = /\(([^\)]+)\)/;
var quotedSection = /"([^"]+)"/;
var requestCrossovers = /\s+\+x|\+x\s+/;
var noCrossovers = /\s+\-x|\-x\s+/;

function splitAndStrip(input, pattern)
{
    var matches = [], remainder = [], item, groups;
    for (var i = 0; i < input.length; i++)
    {
        item = input[i].trim();
        while (groups = item.match(pattern))
        {
            var hit = groups[1].trim();
            if (hit)
                matches.push(hit);
            item = item.replace(groups[0], '|');
        }
        remainder = remainder.concat(item.split('|'));
    }

    return [matches, remainder];
}

function filterOutEmpty(items)
{
    var result = _.filter(items, function(item)
    {
        item = item.trim();
        return (item.length > 0);
    });
    return result;
}

Searcher.prototype.parseSearchTerms = function(input)
{
    var handles = [], tags = [], freeform = [], fandoms = [];
    var crossovers = 'any';
    var subitems, remaining, matches;
    input = input.trim();

    if (input.match(requestCrossovers))
    {
        crossovers = true;
        input = input.replace(requestCrossovers, '');
    }
    else if (input.match(noCrossovers))
    {
        crossovers = false;
        input = input.replace(noCrossovers, '');
    }

    if (!input.match(preciseModeDetect))
    {
        // we have no hashes or at signs
        if (input.indexOf('"') >= 0)
        {
            remaining = input;
            while (matches = remaining.match(quotedSection))
            {
                freeform.push(matches[1].trim());
                remaining = remaining.replace(matches[0], '|');
            }

            while (matches = remaining.match(fandomFinder))
            {
                fandoms.push(matches[1].trim());
                remaining = remaining.replace(matches[0], '|');
            }

            _.each(remaining.split('|'), function(item)
            {
                item = item.trim();
                if (item)
                {
                    subitems = filterOutEmpty(item.split(/\s+/));
                    freeform = freeform.concat(subitems);
                }
            });
        }
        else
        {
            while (matches = input.match(fandomFinder))
            {
                fandoms.push(matches[1].trim());
                input = input.replace(matches[0], ' ');
            }
            subitems = filterOutEmpty(input.split(/\s+/));
            freeform = freeform.concat(subitems);
        }
    }
    else // the user has marked up the search
    {
        remaining = input;
        while (matches = remaining.match(handlesPrecise))
        {
            handles.push(matches[1].trim());
            remaining = remaining.replace(matches[0], '|');
        }
        while (matches = remaining.match(fandomFinder))
        {
            fandoms.push(matches[1].trim());
            remaining = remaining.replace(matches[0], '|');
        }
        remaining = remaining.split('|');
        var res = splitAndStrip(remaining, tagsPrecise);
        tags = res[0];
        remaining = filterOutEmpty(res[1]);
        freeform = freeform.concat(remaining);
    }

    var results = {
        handles: handles,
        tags: tags,
        freeform: freeform,
        fandoms: fandoms,
        crossovers: crossovers
    };

    var termcount = handles.length + tags.length + freeform.length + fandoms.length + (crossovers === 'any' ? 0 : 1);
    results.total = termcount;

    results.handlesOnly = handles.length && (termcount === 1);
    results.tagsOnly = tags.length && (termcount === 1);
    results.freeformOnly = freeform.length && (termcount === 1);
    results.fandomsOnly = fandoms.length && (termcount === 1);

    return results;
};

//----------------------------------------------------------------------

function makewild(input)
{
    return '*' + encodeURIComponent(input.toLowerCase()) + '*';
}

function Query()
{
    this.query = {};
    this.from = 0;
    this.size = MAX_RESULTS;
}

Query.prototype.add = function(key, clause)
{
    this.query[key] = clause;
};

Query.prototype.addCrossover = function(desired)
{
    if ((desired === 'any') || (desired === undefined))
        return;

    if (!this.filter)
        this.filter = { and: []};
    this.filter.and.push({ 'prefix' : { 'is_crossover' : desired } });
};

Query.prototype.toJSON = function()
{
    var result = { query: {}};
    if (this.filter)
    {
        result.query.filtered = {};
        result.query.filtered.query = this.query;
        result.query.filtered.filter = this.filter;
    }
    else
        result.query = this.query;

    result.from = this.from;
    result.size = this.size;
    return result;
};

Query.prototype.serialize = function()
{
    return JSON.stringify(this.toJSON());
};

//----------------------------------------------------------------------
// search methods follow

Searcher.prototype.search = function(terms, callback)
{
    var parsed = this.parseSearchTerms(terms);
    this.handleParsedTerms(parsed, callback);
};

Searcher.prototype.handleParsedTerms = function(parsed, callback)
{
    if (parsed.freeformOnly)
        this.searchFreeform(parsed, callback);
    else if (parsed.tagsOnly)
        this.searchTags(parsed, callback);
    else if (parsed.handlesOnly)
        this.searchPeople(parsed.handles, callback);
    else if (parsed.fandomsOnly)
        this.searchFandoms(parsed.fandoms, callback);
    else
        this.searchStructured(parsed, callback);
};

Searcher.prototype.searchFreeform = function(terms, callback)
{
    var query = new Query();
    var termlist = terms.freeform;

    var phrase = (termlist.length > 1) || termlist[0].match(/\s/);
    if (!phrase)
        query.add('match_phrase_prefix', { '_all': termlist[0] });
    else
    {
        query.add('match',
        {
            '_all' :
            {
                'query' : '"' + termlist.join('" "') + '"',
                'operator' : 'and'
            }
        });
    }
    query.addCrossover(terms.crossovers);

    var opts =
    {
        method: 'POST',
        url:    this.urlbase + '/_search',
        json:   query.toJSON()
    };
    this.execute(opts, callback);
};

Searcher.prototype.searchStructured = function(terms, callback)
{
    // This is the complicated query, where we do our best to guess what the
    // user means by a search typed into a text box. See the search design
    // document for the rationale.
    var query = new Query();
    var bool = { should: [], must: [] };
    var term;

    // more than one fandom means crossovers welcome no matter what the flag said
    if (terms.fandoms.length > 1)
        query.addCrossover(true);
    else
        query.addCrossover(terms.crossovers);

    for (var i = 0; i < terms.handles.length; i++)
        bool.must.push({ term: { 'owner_handle': terms.handles[i] } });

    for (i = 0; i < terms.fandoms.length; i++)
        bool.must.push({ term: { 'fandoms_additional': terms.fandoms[i] } });

    for (i = 0; i < terms.tags.length; i++)
        bool.must.push({ term: { 'tags': terms.tags[i] }});

    // un-marked phrases are assumed to be in titles, summaries, or fic text
    for (i = 0; i < terms.freeform.length; i++)
    {
        term = makewild(terms.freeform[i]);
        bool.must.push({ 'query_string': { default_field: '_all', query: terms.freeform[i] + '*'}});
        // TODO
    }

    query.add('bool', bool);

    var opts =
    {
        method: 'POST',
        url:    this.urlbase + '/_search',
        json:   query.toJSON()
    };
    this.execute(opts, callback);
};

Searcher.prototype.searchDataType = function(type, termlist, fullterms, callback)
{
    if (type === 'tags')
        return this.searchTags(termlist, callback);

    if (typeof termlist === 'string')
        termlist = [termlist];

    var searchurl = path.join(this.indexname, type, '_search');
    var query = new Query();
    var bool = { should: [] };

    for (var i = 0; i < termlist.length; i++)
    {
        bool.must.push({
            query_string: {
                default_field: '_all',
                query: makewild(termlist[i])
            }
        });
    }

    query.add('bool', bool);
    if (type === 'stories')
        query.addCrossover(fullterms.crossovers);

    var opts =
    {
        method: 'POST',
        url:    this.urlbase + '/_search',
        json:   query.toJSON()
    };
    this.execute(opts, callback);
};

Searcher.prototype.searchPeople = function(handles, callback)
{
    if (typeof handles === 'string')
        handles = [handles];

    var query = new Query();
    var bool = { should: [] };

    for (var i = 0; i < handles.length; i++)
    {
        bool.must.push({
            query_string: {
                default_field: 'handle',
                query: makewild(handles[i])
            }
        });
    }
    query.add('bool', bool);

    var opts =
    {
        method: 'POST',
        url:    this.urlbase + '/people/_search',
        json:   query.toJSON()
    };
    this.execute(opts, callback);
};

Searcher.prototype.searchTypeByField = function(type, field, termlist, callback)
{
    if (type === 'tags')
        return this.searchTags(termlist, callback);
    if (typeof termlist === 'string')
        termlist = [termlist];

    var searchurl = path.join(this.indexname, type, '_search');
    var query = new Query();
    var bool = {must: []};

    for (var i = 0; i < termlist.length; i++)
    {
        var term = {};
        term[field] = termlist[i];
        bool.must.push({'term': term});
    }

    query.add('bool', bool);
    query.addCrossover(termlist.crossovers);

    var opts =
    {
        method: 'POST',
        url:    this.urlbase + '/_search',
        json:   query.toJSON()
    };
    this.execute(opts, callback);
};

Searcher.prototype.searchFandoms = function(termlist, callback)
{
    var searchurl = path.join(this.indexname, '_search');
    var query = new Query();

    if (termlist.length === 1)
    {
        var multi_match = {};
        multi_match.query = termlist[0];
        multi_match.fields = [  'name', 'tags'];
        query.add('multi_match', multi_match);
    }
    else
    {
        // Somebody has listed more than one fandom in a search box.
        // They might want links to the fandoms, but probably what they really want is
        // fic crossovers between those fandoms.
        var bool = { must: [] };
        for (var i = 0; i < termlist.length; i++)
        {
            bool.must.push({'query_string': { 'default_field': 'fandoms_additional', 'query': termlist[i] }});
        }
        query.add('bool', bool);
    }

    var opts =
    {
        method: 'POST',
        url:    this.urlbase + '/_search',
        json:   query.toJSON()
    };
    this.execute(opts, callback);
};

Searcher.prototype.searchTags = function(terms, callback)
{
    var query = new Query();
    var taglist = terms.tags;

    if (taglist.length === 1)
    {
        var multi_match = {};
        multi_match.query = taglist[0];
        multi_match.fields = [  'text', 'tags'];
        query.add('multi_match', multi_match);
    }
    else
    {
        var bool = { must: [] };
        for (var i = 0; i < taglist.length; i++)
        {
            bool.must.push({'query_string': { 'default_field': 'tags', 'query': taglist[i] }});
        }

        query.add('bool', bool);
        query.addCrossover(terms.crossovers);
    }

    var opts =
    {
        method: 'POST',
        url:    this.urlbase + '/_search',
        json:   query.toJSON()
    };
    this.execute(opts, callback);
};

//----------------------------------------------------------------------
// Execute a query & turn the results into useful objects. Not intended
// to be used outside this module.

Searcher.prototype.execute = function(options, callback)
{
    var self = this;

    Request(options, function(err, response, body)
    {
        var results = {
            tags: [],
            people: [],
            fic: [],
            fandoms: [],
            series: [],
        };
        var obj;

        if (body && body.error) err = new Error(body.error);
        if (err)
        {
            console.error(err);
            return callback(err, results);
        }
        var hits = body.hits;

        if (hits.total > 0)
        {
            results.total = hits.hits.length;

            for (var i = 0; i < results.total; i++)
            {
                var struct = hits.hits[i];
                switch(struct._type)
                {
                case 'people':
                    obj = new models.Person();
                    obj.update(struct._source);
                    obj._id = struct._source._id;
                    results.people.push(obj);
                    break;

                case 'stories':
                    obj = new models.Story();
                    obj.update(struct._source);
                    obj._id = struct._source._id;
                    results.fic.push(obj);
                    break;

                case 'series':
                    obj = new models.Series();
                    obj.update(struct._source);
                    obj._id = struct._source._id;
                    results.series.push(obj);
                    break;

                case 'fandoms':
                    obj = new models.Fandom();
                    obj.update(struct._source);
                    obj._id = struct._source._id;
                    results.fandoms.push(obj);
                    break;

                case 'tags':
                    results.tags.push(struct._source.text);
                    break;

                default:
                    console.log(util.inspect(struct));
                    break;
                }
            }
        }
        results.tags = results.tags.sort();
        callback(err, results);
    });
};

//----------------------------------------------------------------------
exports.Searcher = Searcher;
exports.Query = Query;
