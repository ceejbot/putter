# Putter

A fanfiction archive that doesn't suck, written with modern tools in node.

## Requirements

A modern Unix like Ubuntu or Mac OS X. Postgres, redis, nsq. Probably elastic search. See [operations](./operations).

## Layout

I started laying down some foundational pieces a while ago, and here's what I did:

* `api-auth/` - the authentication & authorization api, restify
* `api-completer/` - the autocomplete service for web UI, restify
* `api-data/` - the data api, restify
* `bin/` - standard npm package bin scripts
* `config/` - configuration files in [TOML](https://github.com/toml-lang/toml) format
* `lib/` - shared libraries
* `lib/controllers/` - application logic, grouped
* `lib/models/` - data that resides in the db
* `taxonomy/` - seed data for tags etc
* `test/` - unit & integration tests
* `website/` - service for the web pages, express? restify with benefits?

A lot of this is debris that can be ignored as I clean it up. The *taxonomy* stuff is interesting, however.

## Design

Basic approach:

- Metadata in postgres, fic content in flat files (s3 if we're spendy). Pre-render to avoid repeated work.
- Accept data, process in work queue, push to flat files.
- Build webpages by constructing pre-rendered pieces as much as possible.
- Use postgres with models implemented in [ormnomnom](https://github.com/chrisdickinson/ormnomnom).
- [choo](https://github.com/yoshuawuyts/choo) website + boostrap layout because who has time for css.
- restify is the fallback REST/json API server choice, but we should evaluate [take-five](https://github.com/scriptollc/take-five).
- Use ElasticSearch to do full-text searching.

The approach will be to do these things, roughly:

- Implement enough of a front-end app to show a signup page.
- Implement enough of a backend app to support signup & login.
- At that point, we have proof of viability for the db & model layer as well as the api layer.
- From there, implement uploading & viewing a story.

At that point, we should either re-evaluate choices or go all-in on them.

Missing relevant pieces:

- email provider (SparkPost or Mailgun).
- another other external providers needed?
- serious thinking about administrative interface
- any kind of thinking at all about browsing & discovery

## Taxonomy

A standard tags corpus to use to seed the archive with tags we'd prefer writers to use.

Tags from this collection will get special treatment in the user interface:
- autocompletions for partially-typed tags
- present in browsing interface

- tags in tags.yml
- fandoms with character lists in fandoms.yml

The database seeding process adds them to the appropriate catalogs. Seeding process can be re-run at any time to add new tags/fandoms/characters. It will update existing fandom data. It won't delete any new tags added by users.

### Tags

I've gone through the AO3 tag dataset & pulled out the most-used tags. I have a rough cut at what standardization might look like given the tag format proposals below.

My current thinking is that stories need two kinds of tags: standardized categorization from a fixed list, and free-form categorization at the author's whim. Lookup by the first can be made zippy because it's a fixed target. Lookup by the second should be handled by search. This also requires that a method be available to *promote* free-form tags to standardized tags as popularity demands.

### File format

Yaml files.

super-category:
    - tag-text
    - another-tag
    - yet-another-tag
category2:
	- foo
	- bar
	- baz

### Tag formats

Tags cannot contain spaces.

delimiters: space, comma, semicolon
allowed punctuation: `!:-_/+?&<>`

All other punctuation is stripped on input.

[lib/indexes/base.js](kirje/lib/indexes/base.js) contains the current implementation of tag text cleanup. It is copied here for reference:

```javascript
function cleanTagText(input)
{
	var result = input.trim().toLowerCase().replace(/[,;\s\*\\\.\'\"\$\^\(\)=%]+/g, '');
	return result;
}
```

Proposed tag structure:

: for internal structure

	kink:blindfolds
	trope:wingfic
	au:coffeeshop
	genre:action
	genre:romance
	genre:slash
	genre:romantic-comedy

!-modifiers for character names

	hurt!character-name

presence in the tags list forces presence in the character list


### Fandoms

Seed data for the fandoms expected to be represented in the archive.

#### File structure

tag: no-space-title
name: "The Full Title of the Show"
sortname: title of the show with stopwords removed
related: related-fandom-1, related-fandom-2
deescription: |
   Perky high school cheerleader fights the forces of darkness,
   assisted by her friends and the high school librarian. Wikipedia
   link if appropriate.
characters:
   - Fred
   - Barney
   - Wilma
tags:
   - fandom-specific
   - episode-title


### Taxonomy TODO

- a way to migrate new standard tags from user input -> standard list
- all the user interface
- dump tool for exporting current database contents to this format
