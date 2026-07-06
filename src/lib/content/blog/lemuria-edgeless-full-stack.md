---
title: "Building Lemuria: A Bleeding-edge stack for Deployment to the Edge"
date: 2026-07-05
description: "A social platform built on two-sided friendships and a stack
chosen for the edge, and the two decisions - a package manager and a schema
pattern - that taught me the most by being wrong."
---

Lemuria is a social platform I built as a portfolio piece and learning project,
meant to demonstrate the whole arc of product development from schema design to
deployed frontend. It's live now at
[lemuria.pages.dev](https://lemuria.pages.dev). This is an account of what I
learned along the way, and in a couple of cases, what I got wrong before I got
it right.

![](/src/lib/assets/screenshot-homepage.jpg)

## Product

Most social platforms are follower graphs. One user follows another without
reciprocation, and the model produces the dynamics with which we are all well
accustomed: audience-seeking, performance, and low-quality connection.

Lemuria uses two-sided friendships - both users have to accept - which is a deliberate
constraint meant to keep communities smaller and make connections feel like
something. What seems like a small design-choice has broad implications in the
code: almost every query in the system assumes symmetric relationships. Friend
lists, mutual checks, privacy logic - all of it changes once friendship stops
having a direction.

Shelves came out of a simpler question: how do you make a profile expressive
without just handing the user a textbox? Text bios alone are generic and boring.
What someone is currently reading, watching, or listening to says a great deal
more. That became a feature - a search component querying three external APIs,
OMDb for films, OpenLibrary for books, MusicBrainz for albums, with live
suggestions and a display component that renders covers on physical shelves
on a user's profile.

![](/src/lib/assets/screenshot-profile.jpg)

## The Tech Stack

The frontend is SvelteKit with Svelte 5. The backend is Hono. Bun is the package
manager throughout, and it's TypeScript end to end, with a shared types package
the server and client both import from.

**React** invented the component model and the ecosystem owes it a great deal
for that.
But by 2026, it's also carrying ten years of accumulated decisions: hooks, context,
server components, concurrent rendering - and the complexity has stratified accordingly.
For a new project, React tends to be chosen by default, because it's what everyone
knows and what the hiring pool expects, not because it's the best tool
for the problem. That's reason enough to look elsewhere when you're starting
something new.

**Next.js** is the obvious full-stack answer, opinionated, and deployable to
Vercel in a single command. The trouble is that last part. Vercel's best
features - ISR, image optimisation, edge functions - are platform primitives,
not open standards, and the framework is coupled tightly enough to the platform
that the cost model gets expensive as a project grows. For a project intentionally
exploring the edge, that was exactly the wrong direction to be pulled in.

**Svelte** was the natural alternative. It compiles to vanilla JavaScript - no
virtual DOM, no runtime overhead, smaller bundles, and Svelte 5's runes replace
the compiler-inferred magic of earlier versions with something more explicit.
It's more verbose in places, but you can see the reactivity doing what it does
and that makes it easier to reason about.

**Hono** is a lightweight HTTP framework that runs natively on Cloudflare
Workers with no Node assumptions baked in. It stayed out of the way throughout,
which might be the best thing you can say about a framework.

**Bun**, I'm less sure about. It's fast and genuinely pleasant to use day to
day, installs are quick, the built-in tooling covers most of what you'd
otherwise reach for separately, and working with files or hashing passwords
natively, without importing anything, feels better than equivalent in Node. I
liked it. Past tense, though I've come round to thinking Bun was probably the
wrong choice for this particular project.

The problem is that Cloudflare Workers don't run on Bun's runtime, so
everything I liked about it turned out to be either unavailable in
production or gated behind compatibility flags. Native file operations
don't matter, because Workers have no filesystem. `Bun.password` isn't
available in the Workers runtime at all. What you're left with is Bun as a
fast package manager, while none of the code that actually ships uses any of
its advantages - and the workarounds compound from there. Bun intercepts
`npx`, so wrangler needs its own fix just to be invoked correctly.
Environment variable syntax changes depending on which command you're
running. There's still a case for Bun - local dev really is faster - but for
a project built on the edge, the package manager probably ought to be
aligned with the runtime it's shipping to. Deno looks worth investigating
next time, since its runtime model sits closer to Workers, and I'll likely
give pnpm a look too.


**Drizzle** as the ORM wasn't entirely a free choice either. Prisma, the
obvious pick for TypeScript, needs a persistent connection to a traditional
database, which means it doesn't run at the edge without a separate query
proxy - and that rather defeats the point of the whole deployment model.
Drizzle is edge-compatible, plays well with SQLite, and infers excellent
TypeScript types straight from the schema. The honest assessment, though, is
that it has rough edges. Complex joins come back as flat rows full of
nullable fields you then have to dispatch by hand in TypeScript. For simple
queries it's clean; for anything with several joined tables, the result
ends up more verbose and harder to follow than the SQL it's standing in
for. Given the constraints, it was the right call. I'd look harder at the
alternatives next time.

## Deployment to the Edge

The server runs as a Cloudflare Worker - a serverless function that
executes in whichever region is closest to the request, rather than a
single origin server somewhere. There's no infrastructure to manage, no
server to keep alive, no CDN to configure separately. The code is globally
distributed by default and scales without any capacity planning on my part,
and because Workers are priced per request rather than per server-hour, a
platform in early growth pays close to nothing. The same deployment handles
ten users or ten thousand without a single configuration change.

The tradeoff is that Workers impose a genuinely restricted environment - no
filesystem, a limited Node compatibility layer, a strict execution budget.
None of that is a problem for a web API so much as it's simply the shape of
the problem you're solving. You build around it.

The database is Turso, a managed SQLite service built on libSQL, a fork of
SQLite with replication support. The model mirrors the Workers philosophy:
replicas are distributed across regions, so queries run close to wherever
they're initiated. SQLite changes the mental model relative to Postgres too
- there's no connection pool to manage, no pgBouncer, no connection limits
to tune, and for a small social platform that simplicity turns out to be a
genuine feature rather than a compromise. Drizzle sits on top of it,
providing the typed schema and query builder.

Files go to Cloudflare R2, object storage without egress fees. In
production, avatars and post media are served straight from a public R2
URL; in local development, the Worker proxies requests to a local R2
simulation, with a storage abstraction in the backend so routes never need
to know which environment they're actually running in.

One backend decision worth mentioning here: the posts feed uses
cursor-based pagination rather than offset. The standard approach -
`LIMIT 20 OFFSET 40` - produces inconsistent results the moment rows get
inserted mid-pagination, and it degrades further as the table grows. A
cursor uses a stable position marker instead, a combination of creation
timestamp and row ID, and the tradeoff is that you lose the ability to jump
to an arbitrary page. For a feed, nobody's asking for that anyway.

## Authentication

The standard choice for this stack would have been better-auth. It
integrates cleanly with Hono, Drizzle, and Turso, and it handles sessions
and OAuth providers well enough to get authentication out of the way
quickly. I didn't use it.

Authentication struck me as one of those things worth actually
understanding rather than delegating, and the only way to understand it is
to build it. The implementation went through a few iterations before
settling on hono-sessions with a custom store backed by Turso: sessions are
created on login, stored as rows in the database, and validated on each
authenticated request by reading back from that store.

The alternative, stateless JWTs, is attractive precisely because it needs
no storage - the token carries its own payload and signature - but session
revocation is a lot simpler when the session actually exists somewhere you
can go and delete it. For a platform with persistent accounts and login
state, the database-backed session was easier to reason about, and
better-auth remains a sensible library for anyone shipping a production
project with multiple OAuth providers and an actual deadline. Just not for
a project whose whole point was understanding what happens under the
surface.

## Schema Design

Shelf items come in three types - films, books, albums - and each pulls
from a different API with slightly different metadata attached. There were
two ways to model that. The first: a single `shelf_items` table with a
`type` column, simple to query, no joins - single-table inheritance. The
second: a base `shelf_items` table with foreign keys out to separate
`films`, `books`, and `albums` tables, normalised, with type-specific
fields always present - class table inheritance.

I chose the second, and the reasoning felt sound at the time. I'd just
built the notification system using the single-table approach and found it
genuinely painful. Notifications come in four types - friend requests,
friendship acceptances, post likes, comment likes - each carrying different
associated records, and the single table meant nullable foreign keys for
every variant: `friend_request_id`, `friendship_id`, `action_user_id`,
`post_id`. Querying it meant aliasing the `users` table four times over and
writing CASE expressions into LEFT JOINs to make sense of the result. The
lesson seemed obvious enough: a single table with nullable fields becomes
hard to query the moment each type carries meaningfully different data.

The lesson was correct. I just applied it to the wrong problem.

Shelf items feel distinct but actually normalise cleanly to the same shape
- title, subtitle, cover image, external ID is the whole interface - and
the query for fetching someone's shelf ended up being three joins that
never needed to exist:

```typescript
const rows = await db
  .select({
    id: shelfItems.id,
    type: shelfItems.itemType,
    filmTitle: films.title,
    filmYear: films.year,
    bookTitle: books.title,
    bookAuthor: books.author,
    albumTitle: albums.title,
    albumArtist: albums.artist,
    ...
  })
  .from(shelfItems)
  .leftJoin(films, eq(films.id, shelfItems.filmId))
  .leftJoin(books, eq(books.id, shelfItems.bookId))
  .leftJoin(albums, eq(albums.id, shelfItems.albumId))
  .where(eq(shelfItems.userId, userId));
```

Every field comes back nullable, because the row came from a left join, so
the mapping code has to check `row.type` and cast accordingly. A single
table would have given me one query, no joins, no nullable dispatch:

```typescript
const rows = await db
  .select()
  .from(shelfItems)
  .where(eq(shelfItems.userId, userId));
```

Notifications, by contrast, genuinely do vary - different relationships,
different associated records, different query requirements for each type -
and separating them out would have simplified every query I write against
that table.

So the right pattern ended up in the wrong place, and the wrong pattern in
the right one. What I actually learned wasn't "are these different types?"
but something closer to: do these types have meaningfully different data
you'll need to query separately? Shelf items don't. Notifications do.
Getting it backwards taught me the distinction more thoroughly than getting
it right the first time ever would have.

## Building Without AI


This was a learning project, so AI played a minimal role in most of it. AI
has its place if you're building quickly, but only once you already
understand enough to tell whether it's making the right choices. You still
need the understanding first, and the way you get it is the old way - by
building the thing yourself.

Deployment was the one place I made an exception, and I used Claude Code
deliberately for it - plan mode throughout, auto-accept off. The point
wasn't to have the deployment done for me so much as to have an assistant
in the room who actually knew what they were talking about. Configuring
Workers, working out the Turso authentication model, figuring out why the
server hangs when wrangler gets invoked through Bun - these are slow
feedback loops with opaque failure modes, and that's exactly the kind of
work where it made sense to bring AI in.

The distinction I want to draw is between implementation and
understanding. AI as a guide explaining what's happening and why earns its
keep on operations work, where the learning comes from the explanation
rather than the typing. For application development, the typing is the
learning, and that's not something worth outsourcing.

## What's Next

Lemuria is live in demo mode at [lemuria.pages.dev](https://lemuria.pages.dev).
Boards, search, and several other features are planned. The codebase is at
[github.com/fidzod/lemuria](https://github.com/fidzod/lemuria).
