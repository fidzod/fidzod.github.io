---
title: "What I Want from a Systems Programming Language and Why I Like Odin"
date: 2026-06-09
description: "I needed a systems language, so I tried Rust, Zig, C, Nim, and Odin. This is the case for Odin - and what Scheme taught me about what it means for a language to know what it is."
tags: ["odin", "systems programming", "programming languages", "rust"]
---

A year ago I found myself looking for a systems programming language again. The
obvious candidates were C, Rust, Zig, Nim, and Odin. Odin was the one I expected
to like least. It has no headline feature. There is no ownership system, no
compile-time metaprogramming, no slogan that fits neatly into an elevator pitch.
It has a small community and a modest ecosystem. It felt, at first glance,
unremarkable.

It turned out to be exactly what I was looking for.

This isn't really an article about Odin. It's about what I value in systems
languages, and why I think simplicity is often misunderstood.

## Simplicity is not the absence of features

When people praise simplicity they often mean minimalism: fewer keywords,
shorter manuals, less syntax.

That's not what I mean.

Scheme is one of my favourite programming languages. Not because I write
production software in Scheme—I don't—but because its design is extraordinarily
coherent. It asks a simple question: *what is the smallest set of ideas capable
of expressing everything else?* Almost every feature feels earned. Nothing seems
to exist because it was fashionable, or because another language had it.

That idea has influenced how I think about systems languages.

The question isn't:

> *How many features does this language have?*

It's:

> *Does every feature justify the cognitive cost of learning it?*

Every abstraction has a price. It asks you to learn another concept, another
mental model, another piece of vocabulary. That's a worthwhile trade if the
abstraction removes more complexity than it introduces. It isn't worthwhile
simply because it exists.

Good language design is, in part, the discipline of knowing when to stop.

## Explicitness matters

I don't dislike abstraction.

I dislike abstraction whose justification is invisible.

The systems I enjoy most are the ones that make their constraints obvious.
SQLite tells you exactly what it is. Cloudflare Workers tell you exactly what
they can and can't do. Git's object model is surprisingly small once you strip
away the porcelain. You can understand each of them end-to-end if you're willing
to spend the time.

Programming languages should feel the same.

When I encounter behaviour I don't understand, I don't want to memorise another
rule. I want to understand why the rule exists in the first place.

That's ultimately why I found myself enjoying Odin.

## Why Odin appealed to me

Odin feels like someone sat down and asked what C would look like if it were
designed today without trying to become something else.

The improvements over C are practical rather than ideological. The type system
catches mistakes C would happily accept. Tagged unions, better pointer
semantics, stronger typing, a modern standard library and tooling—they all
reduce accidental complexity without introducing a radically different
programming model.

When I built a small game engine using raylib, many of the bugs I encountered
simply became type errors. Wrong union variants, mismatched types, incorrect
assumptions about nullability. They were exactly the kinds of mistakes I wanted
the compiler to find.

The language gave me more confidence without demanding a fundamentally different
way of thinking.

Just as importantly, the tooling stays out of the way.

Building a project rarely feels like learning a build system. The language has
opinions, but they're remarkably modest ones. Most of the time I can focus on
the program I'm writing rather than the infrastructure surrounding it.

That quietness is surprisingly valuable.

## Different priorities

None of this is an argument that Odin is objectively better than Rust, Zig, or
C.

Rust solves a different problem.

If memory safety is your overriding concern, Rust makes an extraordinarily
compelling case. Its ownership model eliminates entire classes of bugs that
languages like C and Odin leave to the programmer. That's an enormous
achievement.

The trade-off is complexity.

Rust asks programmers to internalise a much richer collection of concepts:
ownership, borrowing, lifetimes, traits, procedural macros, multiple smart
pointer types, an extensive asynchronous ecosystem, and more. Each of these
exists for good reasons. My reservation isn't about any individual feature.

It's about the cumulative cognitive cost.

Personally, I find myself drawn toward languages that solve fewer problems while
remaining easier to understand completely. That isn't because those problems
don't matter. It's because understanding the whole system is one of the things I
value most in software.

Someone with different priorities could reasonably make the opposite choice.

## Knowing what you are

The best tools I've used share one characteristic: they know what they are.

SQLite isn't trying to become PostgreSQL. Git isn't trying to become an IDE.
Scheme isn't trying to become Java.

Odin doesn't feel like it's trying to become every systems language at once, and
that sense of restraint is rare. I think that's why I keep coming back to it.
It's not the most ambitious language I've used - it's simply the one that gets
out of my way most consistently, leaving me free to think about the software I'm
actually trying to build.
