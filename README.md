# Putter

A fanfiction archive that doesn't suck, written with modern tools in node.

## Requirements

A modern Unix like Ubuntu or Mac OS X. Postgres, redis, nsq. Probably elastic search. See [operations](./operations).

## Layout

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

## Tasks

Basic approach:

- Metadata in postgres, fic content in flat files (s3 if we're spendy). Pre-render for ease of use.
- Accept data, process in work queue, push to flat files.
- Build webpages by constructing pre-rendered pieces as much as possible.
- choo.js website + boostrap layout because who has time for css

Note that this contains debris from a previous run at the problem. Initial tasks:

- PULL CONFIG FROM .env files using dot-env.
- Port models over from previous mess to ormnomnom
- design & write the auth layer
- design & write the data API
- Write everything, really.

## Taxonomy

A standard tags corpus to use to seed the archive with tags we'd prefer writers to use.

Tags from this collection will get special treatment in the user interface:
- autocompletions for partially-typed tags
- present in browsing interface

tags in tags.yml
fandoms with character lists in fandoms.yml

The database seeding process adds them to the appropriate catalogs. Seeding process can be re-run at any time to add new tags/fandoms/characters. It will update existing fandom data. It won't delete any new tags added by users.

### Tags

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
