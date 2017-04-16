# Putter

A fanfiction archive that doesn't suck, written with modern tools in node.

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

At that point, we will have learned enough to either re-evaluate choices or go all-in on them.

Missing relevant pieces:

- pit AWS vs Google Cloud for features & cost
- email provider (SparkPost or Mailgun)

### Features

- above all else, serve a story *fast*
- above all else, make story discovery *pleasant* and *fast*
- stories, aka fic, are the focus; other media is secondary
- rare events can be slow (NB posting stops being rare if success happens)
- accessibility is a first-class feature
- site affordances shape culture: choose features mindfully

Unsorted list of features to keep in mind:

- search foregrounded; keep this awesome, fast, and a great way to find fic
- fast browsing
- administrative interface to remove content, ban members, shadowban, etc
- email verification for new accounts
- 2FA available
- keep the door open to charge a nominal $5 one-time fee on signup (spam reduction)
- signup by invitation (with pre-paid fee option if we do that)
- keep the door open to charge for premium features to pay for their cost
- subscription to authors, stories, and *tags* (tag sets!)
- reader activity log: stories read, comments left, replies
- writer activity log: story data graphs, comments left
- useful logged-in start page, showing subscriptions & recent activity

Sort features into a list that keeps the site moving forward: minimum viability first, then nice-to-haves. But it's good to have the wishlist in mind from the start so we don't back ourselves into corners.

## Tags manifesto

The primary job of a fic archive site is to let readers find fic to read. There are two approaches to solving this problem, as exemplified by the two big fanfiction archives: *fandoms* and *tags*.

The fandom-browsing reader will have a fandom or a character or pairing in mind when they begin browsing. They might be interested in reading Steve/Bucky fic, from any variation of the Captain America canons. Or they might want to look only at *Sherlock* fic, from that specific variation of the Holmes canons, without any pairing in mind. For these readers, the FF.net approach works. You find fic by choosing a fandom to read in, then drilling down into specific characters.

Other readers are more interested in cutting across fandoms to find a specific trope they're interested in. For instance, a reader looking for wingfic might be interested in finding wingfic in SGA fandom as well as MCU fandom. For these readers, the AO3 canonical tags are the way to find what they're looking for.

Tags can support both reader approaches, and indeed under the hood do so on AO3. Fandoms and characters are tags with a little bit of extra meaning attached to them.

As generals fight the current war with the last one in mind, I approach the problem of a tags design with the failures of AO3 in mind. Their tagging implementation has two fatal flaws. First, it requires the constant attention of an army of volunteers. Meat *must* be present in the machine. Second, the implementation details make it difficult to scale, to the point where AO3 literally *stopped* scaling it. Tags are no longer made canonical & aliased to each other.

Nobody wants to go back to the FF.net tagless world. Nobody wants the servers to fall over. Writers like free-form tags; readers like well-designed taxonomies.

Porqué no los dos?

The problem with tagging, I believe, is in *guiding writers into using meaningful tags*. Writers will also have an urge to express themselves creatively in tagging that should also find a meaningful home. If the fandom wants to call the pairing `Twelfth Doctor/Clara Oswald` *whouffaldi*, the fandom should be able to do that. Readers who don't know the nickname should be able to find it.

My current thinking is that stories need two kinds of tags: standardized categorization from a fixed list, and free-form categorization at the author's whim. Lookup by the first can be made zippy because it's a fixed target. Lookup by the second should be handled by search. This also requires that a method be available to *promote* free-form tags to standardized tags as popularity demands.

## Operational requirements

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

### Taxonomy

The `taxonomy` directory contains a standard tags corpus to use to seed the archive with tags we'd prefer writers to use.

Tags from this collection will get special treatment in the user interface:

- autocompletions for partially-typed tags
- present in browsing interface

A test set of tags are in [tags.yml](./taxonomy.tags.yml). A test set of fandoms with character lists is in [fandoms](./taxonomy/fandoms/).

I've gone through the AO3 tag dataset & pulled out the most-used tags into `ao3-dump.json`. I have a rough cut at what standardization might look like given the tag format proposals below.

The database seeding process adds them to the appropriate catalogs. Seeding process can be re-run at any time to add new tags/fandoms/characters. It will update existing fandom data. It won't delete any new tags added by users. \[this is a TODO not a statement of current fact]

### Tag file schema

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

```javascript
function cleanTagText(input)
{
	var result = input.trim().toLowerCase().replace(/[,;\s\*\\\.\'\"\$\^\(\)=%]+/g, '');
	return result;
}
```

Proposed tag structure:

`:` for internal structure. This is the bold idea that might or might not work out: the way you distinguish the Spike of *Buffy* from the Spike of *Cowboy Bebop* is by including the fandom specifically in the character name.

*Or* can enforce this in another way: if you've tagged a story with `fandom:btvs`, you get the BTVS character listing to choose from, but are prevented from choosing others unless you've added the fandom as a crossover.

	kink:blindfolds
	trope:wingfic
	au:coffeeshop
	genre:action
	genre:romance
	genre:slash
	genre:romantic-comedy
    btvs:season:05
    btvs:giles
    btvs:spike

`!`-modifiers for character names

	hurt!fandom:character-name
    hurt!mcu:bucky-barnes

Presence in the tags list forces presence in the character list


### Fandoms

Seed data for the fandoms expected to be represented in the archive, intended as a test data set right now.

#### Schema

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

## License

ISC.
