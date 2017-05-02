# Putter

[![Greenkeeper badge](https://badges.greenkeeper.io/ceejbot/putter.svg)](https://greenkeeper.io/)

A fanfiction archive that doesn't suck, written with modern tools in node. See [the operations README](./operations/README.md) for docs about how to build & run locally.

Please note that this project is released with a [Contributor Code of Conduct](code-of-conduct.md). By participating in this project you agree to abide by its terms.

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
- This forces us to have a working db & model layer as well as an api layer.
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

Sort features into a list that keeps the site moving forward: minimum viability first, then nice-to-haves. But it's good to have the wishlist in mind from the start so we don't back ourselves into corners. E.g., story subscription is an early feature; tag set subscription is later.

See also the [docs directory](./docs) for a tagging manifesto and detailed data designs.

## Notes on the web app

TODO: Strict delineation of what's not suitable for webappery, what is, and what is prerendered. (The trick to being fast is to do as little work as possible. This includes never repeating work you've done once.) Slice it into chunks that benefit from the single-page experience as groups.

## Operational requirements

A modern Unix like Ubuntu or Mac OS X. Postgres, redis, nsq. Probably elastic search. See [operations](./operations).

## Layout

I started laying down some foundational pieces a while ago, and here's what I did:

* `bin/` - service runners
* `lib/` - shared libraries
* `lib/controllers/` - application logic, grouped
* `lib/models/` - data that resides in the db, *not* ready for work
* `services/api-auth/` - the authentication & authorization api, *ready for work*
* `services/api-completer/` - the autocomplete service for web UI, *not ready for work*
* `services/api-data/` - the data api, *ready for work*
* `services/website/` - service for the web pages, *ready for work*
* `taxonomy/` - seed data for tags etc, *ready for work*
* `test/` - unit & integration tests, *ready for work*

## License

ISC.
