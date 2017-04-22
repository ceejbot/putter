# Putter docs

Design docs here.

## notes

Allow anonymous participation ever? Am unsure it is worth the work.

Interview & guide through complex processes like posting fic.

Simple is better. Simplest possible variation of *each* item. Lose the complicated features and zillions of fields.

No nesting in comments.

Fic has cover page that contains no fic content, only metadata.

Metadata includes reviews & comments, paginated.

Badges for behavior to encourage: turning on 2fa, posting a comment, writing a review, posting a story, donating to the site, etc.

Yo we like markdown.

Donate to get features that are cool but represent costs: story banners, more than one handle?

## data

```
person
    email / email-is-validated / account status / hashed pass / 2fa secret / timestamps / deleted tombstone
    ➜ many handles
        handle / icon uri / timestamps / deleted tombstone
        ➜ many stories
            title / summary / tags/ notes / timestamps / tombstone
            ➜ many chapters
                timestamps / title / body / notes
            ➜ comments (on story, not on chapters)
        ➜ many reviews
            story / body
            ➜ comments
    ➜ many subscriptions

comment: owner id / timestamps / referencing id / body
```


These features alone are enough to make the site useful.

## Tags manifesto

The primary job of a fic archive site is to let readers find fic to read. There are two approaches to solving this problem, as exemplified by the two big fanfiction archives: *fandoms* and *tags*.

The fandom-browsing reader will have a fandom or a character or pairing in mind when they begin browsing. They might be interested in reading Steve/Bucky fic, from any variation of the Captain America canons. Or they might want to look only at *Sherlock* fic, from that specific variation of the Holmes canons, without any pairing in mind. For these readers, the FF.net approach works. You find fic by choosing a fandom to read in, then drilling down into specific characters.

Other readers are more interested in cutting across fandoms to find a specific trope they're interested in. For instance, a reader looking for wingfic might be interested in finding wingfic in SGA fandom as well as MCU fandom. For these readers, the AO3 canonical tags are the way to find what they're looking for.

Tags can support both reader approaches, and indeed under the hood do so on AO3. Fandoms and characters are tags with a little bit of extra meaning attached to them.

As generals fight the current war with the last one in mind, I approach the problem of a tags design with the failures of AO3 in mind. Their tagging implementation has two fatal flaws. First, it requires the constant attention of an army of volunteers. Meat *must* be present in the machine. Second, the implementation details make it difficult to scale, to the point where AO3 literally *stopped* scaling it. Tags are no longer made canonical & aliased to each other.

Nobody wants to go back to the FF.net tagless world. Nobody wants the servers to fall over. Writers like free-form tags; readers like well-designed taxonomies.

Porqué no los dos?

The problem with tagging, I believe, is in *guiding writers into using meaningful tags*. Writers will also have an urge to express themselves creatively in tagging that should also find a meaningful home. If the fandom wants to call the pairing `Twelfth Doctor/Clara Oswald` *whouffaldi*, a writer should be able to use that tag. Readers who don't know the nickname should be able to find it.

My current thinking is that stories need two kinds of tags: standardized categorization from a fixed list, and free-form categorization at the author's whim. Lookup by the first can be made zippy because it's a fixed target. Lookup by the second should be handled by search. This also requires that a method be available to *promote* free-form tags to standardized tags as popularity demands.

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

```yaml
super-category:
    - tag-text
    - another-tag
    - yet-another-tag
category2:
    - foo
    - bar
    - baz
```

### Tag formats

Tags cannot contain spaces. Delimiters: space, comma, semicolon. Allowed punctuation: `!:-_/+?&<>`

All other punctuation is stripped on input.

```javascript
input.trim().toLowerCase().replace(/[,;\s\*\\\.\'\"\$\^\(\)=%]+/g, '');
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

```yaml
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
```
