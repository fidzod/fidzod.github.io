---
title: "Why I Choose Odin over Rust or C"
date: 2026-06-09
description: "Rust solves real problems, but it doesn't know when to stop. Here is why I reach for Odin instead - and what we can learn from Scheme about what simplicity actually means."
---

A year ago I was in need of a systems programming language having not used one
for a while. I considered C, Rust, Zig, Nim, and Odin. Odin was the one I was
least excited about.

Odin arguably lacks a compelling elevator pitch. What's exciting about it? It
doesn't have the magic of Nim, it's not memory safe in the way Rust is, it
doesn't have Zig's comptime metaprogramming, and it's not as old or universal as
C. It has a small community and a modest profile. I came to it last, almost
reluctantly, and yet, it's the one I stuck with.

I want to put forward why.

There is a genuine need for something beyond C - I don't think this is a
controversial claim. C's type system is thin enough that whole categories of bugs
pass through it silently, its tooling is a mess of decades-old conventions, and
writing it in 2026 means carrying the weight of decisions made in 1972. The
question is not really whether we need something else, but rather what could
replace it.

The consensus answer is Rust, and this is understandable because Rust solves real
problems. Its ownership model eliminates a class of memory bugs at compile time,
its type system is sophisticated, and it has accumulated a serious ecosystem. If
you are writing software where memory safety is a hard requirement and you are
willing to pay the cognitive overhead, Rust does make a genuine case for itself.

But I find Rust philosophically confused, and practically unpleasant to write.

The confusion is this: Rust has one foot out the door of systems programming,
always reaching toward abstraction, never quite deciding what it is for. The
result is a Frankenstein's monster of a language - features accumulated because
each seemed like a good idea, none of them forming a coherent whole. The macro
system, the trait system, the async ecosystem, the three smart pointer types
you must choose between before you have written anything useful. No individual
feature is indefensible. But Rust has no theory of enough, and the cumulative
weight of it shows. For any given thing you need to do, there are several ways
to do it, and for me that is a bug not a feature - it signals inelegance, not
purely flexibility. The accidental complexity is very high, the essential
complexity is the same as it would have been in C.

This is before we get to Cargo, to the procedural macro ecosystem, to the
culture of pulling in dependencies for things you could write in an afternoon.
I am not opposed to package managers on principle. I am opposed to the particular
learned helplessness they seem to produce, the sense that the correct response
to needing something is to find a crate rather than to understand the problem.
Rust has this in abundance.

That is without mentioning the security problems
this attitude generates - I'm sure you're already thinking about [what's been going on
with NPM
recently](https://arstechnica.com/security/2026/06/dozens-of-red-hat-packages-backdoored-through-its-offical-npm-channel/).

Zig is more interesting, and I do have more sympathy for it. It takes the right
lesson from C - that simplicity is a virtue. Comptime is genuinely clever.
The explicit allocator model is the right idea. But Zig overemphasises testing to
the point where it imposes structure on you, and its error handling, while
principled, produces a kind of noise I find exhausting.

I am a fan of Scheme. Not as a production language - I don't build things in Scheme -
but as a design object. Scheme is what you get when you ask: what is the minimum you
actually need to express anything? It is small enough to hold in your head, powerful
enough to build whatever you want on top of it, and it does not apologise for what it
is not. There is no Scheme feature that could be removed. I cannot say that about many
languages.

This is the question that I want to ask of systems languages, not what do they
have: does it know what it is?

**Odin knows what it is.**

It is, roughly, what C would look like if it were designed today by someone who
valued simplicity as a virtue rather than a constraint. It has a type system that
is genuinely better than C's without being academic about it - tagged unions,
explicit pointer semantics, no implicit conversions doing quiet damage - and it
has these things because they are useful, not because they complete some
theoretical picture. When I built a game engine with raylib, the bugs my IDE
caught were the kind C would have let through silently: wrong union variant,
mismatched types, null where something was expected. Odin doesn't have the most
sophisticated type system, it has *enough* of a type system.

In C, using raylib means finding it, building it, linking it, managing headers.
In Odin, it is in the vendor library collection. You import it and it works.
The build system philosophy - `odin build .`, `odin run .`, and
not much else - is the language's personality made practical. There is no Cargo.
There is no cmake. Just a directory and a command.

(Also: the data-driven paradigm which Odin forces on you will make you never
want to go back to OOP.)

This matters because friction is not neutral. Every unnecessary step between you and
building something is a small argument that the tooling is more important than the work.
Odin's tooling makes the opposite argument. It is quiet about itself.

There are cases where I wouldn't reach for Odin. I'm not suggesting we rewrite the
Linux kernel in it. C still has its place.


But for systems work where I am the one setting the terms - a game engine,
a language interpreter, anything I am building because I want to understand it -
Odin is where I start. It does not get in the way. It does not have opinions about
my project structure, does not require a manifest file to build a single executable,
does not ask me to learn its internal architecture before I can be productive.

It is a quiet, simple language, that gets out of your way, so you can focus on
what you're building.
