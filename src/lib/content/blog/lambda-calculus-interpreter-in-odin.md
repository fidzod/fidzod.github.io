---
title: "Building a Lambda Calculus Interpreter in Odin"
date: 2026-06-13
description: "Lambda calculus has three rules, and yet booleans, arithmetic, linked lists, and recursion fall out of them. This is an account of building an interpreter for it in Odin - and of the theory that ambushes you along the way."
---

I firmly believe that to understand something fully you have to build it from
scratch. I wanted to learn
[Type Theory](https://en.wikipedia.org/wiki/Type_theory), and lambda calculus
seemed like the right place to start. So, I built a lambda
calculus interpreter in Odin and a small standard library written in lambda
calculus itself.

This is an account of that implementation, because in implementing something
like this the theory keeps ambushing you - and you meet it in a way that
makes it real and intuitive. You can't implement substitution without confronting
variable capture. You can't implement reduction without choosing an evaluation
order, and that choice has real consequences. In other words, building the
thing is how you learn the theory.

*My implementation is in Odin, read about why I choose Odin for systems
programming [here](/blog/why-choose-odin). If you are familiar with C, Zig,
Rust, etc. you'll have no problem understanding what's going on, and
translating this project into your language of choice might be a valuable
experience.*

*The complete source for this project is available via 
[Github](https://github.com/fidzod/lambda-calculus).*

## Primitives
Before we can do anything we need to know the fundamental primitives we are
dealing with. This representation informs every subsequent step - lexing,
parsing, reduction.

In lambda calculus a term is either a variable, an abstraction, or an
application - nothing else:

```odin
Term :: union {
  Var,
  Abs,
  App,
}

Var :: struct {
  name: string,
}

Abs :: struct {
  param: string,
  body: ^Term,
}

App :: struct {
  rator: ^Term,
  rand: ^Term,
}
```

A variable is just a name that stands for a term. An abstraction is
a function definition. It has the form `λx.t`, where *x* is the parameter,
a variable, and *t* is the body, any valid term. An
application has the form `(M N)`. It applies a function (the operator, hence
`rator`) to an argument (the operand, hence `rand`).

You'll notice that `Var` lacks a value field; it only has a name. This is
because in lambda calculus a variable doesn't carry its value around with it, it
is replaced by a value through substitution. When you apply a function to an
argument, the argument is substituted for the parameter throughout the body.
The variable is just a placeholder. More on this when we get to α-conversion.

## Lexer
The first machinery we implement is the lexer, which turns a raw string into a
sequence of tokens that the parser can build into a useful representation of
a program. The only tokens we deal with are `\`, `.`, `(`, `)`, and identifiers.
Identifiers can include `_` and `?`.

The inclusion of `?` in identifiers is a nod to
[Scheme](https://en.wikipedia.org/wiki/Scheme_(programming_language)), where
predicates - functions that return a boolean - are named with a trailing
question mark by convention. It's a convention I like, and you'll see it in the
standard library, for instance `zero?` and `eq?`.

*The lexer implementation is not particularly interesting, and as such I have
elected not to provide a listing here, access
[the source](https://github.com/fidzod/lambda-calculus/blob/main/lexer.odin)
if you are interested.*

## Parsing
Lambda calculus has only three syntactic forms, but we need to be careful about
associativity. Informally:

- Application is **left-associative**: `x y z` means `(x y) z`
- Abstraction bodies extend **as far right as possible**: `λx. x y` means `λx.
(x y)`, not `(λx. x) y`
- Parentheses override everything

We can express this in terms of a layered grammar:

```text
term  ::= abs
        | app

abs   ::= λ <name> . term

app   ::= atom app'
app'  ::= atom app'
        | ε

atom  ::= <name>
        | ( term )
```

The naive way to write application would be `app ::= app atom | atom`,
which correctly captures left-associativity but immediately
breaks recursive descent: parsing an app requires first parsing an app, forever.

The app' trick rewrites this to be right-recursive. Instead of reaching left,
we consume one atom and then ask what follows. `x y z` becomes: atom `x`, then
app' sees `y`, then app' sees `z`, then app' sees nothing and stops. As we
unwind, we build `(x y) z`.

Atom handles parenthesised terms so they override precedence.

Since an abstraction has the form `λx.t`, to parse it we just consume the `λ`,
get the parameter, consume the `.`, get the body, and return a new `Abs` instance.
This is straightforward given helpers which do the mechanical work:
`advance` consumes the current token and returns it, `peek` looks at it without
consuming, and `expect` asserts the next token is of a given type and advances
past it - it's generic at compile time, so `expect(p, TDot)` is a type-safe
assertion with no runtime dispatch.

```odin
parse_abs :: proc(p: ^Parser) -> (^Term, bool) {
  param: string; body: ^Term; ok: bool

  advance(p)                                               // λ
  if param, ok = expect_name(p); !ok do return nil, false  // <name>
  if !expect(p, TDot) do return nil, false                 // .
  if body, ok = parse_term(p); !ok do return nil, false    // term

  term := new(Term)
  term^ = Abs{ param, body }
  return term, true
}
```

In practice, the app' recursion becomes a loop. We parse one atom to get the
left-hand side, then keep consuming atoms and wrapping in App nodes for as
long as the next token can start an atom — that is, as long as it's a name or
an open parenthesis. Each iteration wraps the accumulated left-hand side in a
new App, which is what gives us left-associativity naturally:

```odin
parse_app :: proc(p: ^Parser) -> (^Term, bool) {
  lhs: ^Term; ok: bool
  if lhs, ok = parse_atom(p); !ok do return nil, false

  for can_start_atom(p) {
    rhs, ok := parse_atom(p)
    if !ok do return nil, false
    app := new(Term)
    app^ = App{ lhs, rhs }
    lhs = app
  }

  return lhs, true
}
```

By the second iteration, lhs is already an App node. Wrapping it again produces
`App(App(x, y), z)` - the tree leans left.

`parse_atom` handles the two base cases. A name becomes a `Var`. An open parenthesis
triggers a recursive call to `parse_term`, after which we expect the closing
parenthesis:

```odin
parse_atom :: proc(p: ^Parser) -> (^Term, bool) {
	tok := advance(p)
	if v, ok := tok.(TName); ok {
		term := new(Term)
		term^ = Var {
			name = v.value,
		}
		return term, true
	} else if _, ok := tok.(TLParen); ok {
		term, parse_ok := parse_term(p)
		if !parse_ok do return nil, false
		if !expect(p, TRParen) do return nil, false
		return term, true
	} else {
		fmt.eprintln("Unexpected token")
		return nil, false
	}
}
```

The parenthesised case is where precedence gets overridden - by recursing to
`parse_term` we allow anything inside parentheses, and the result is treated
as a single atom by the surrounding `parse_app`. This is how `(\x. x) y`
correctly parses the abstraction as the operator rather than letting the dot
consume `y`.

`parse_term` is the entry point and the simplest procedure. It peeks at the
current token and dispatches: a lambda means we're looking at an abstraction,
anything else is assumed to be an application:

```odin
parse_term :: proc(p: ^Parser) -> (^Term, bool) {
	if _, isTLambda := peek(p).(TLambda); isTLambda do return parse_abs(p)
	return parse_app(p)
}
```
The simplicity of this proc is the payoff for our layered grammar - all
the complexity of precedence and associativity has been handled by the time
we get here. `parse_term` just decides which path to take and steps aside.

To make this concrete, take `(\x. x) y`. After lexing we have:
```text
TLParen, TLambda, TName("x"), TDot, TName("x"), TRParen, TName("y"), TEOF
```

`parse_term` peeks and sees `TLParen` - not a lambda, so it calls `parse_app`.
`parse_app` calls `parse_atom`, which consumes the `TLParen` and recurses into
`parse_term`. Now we're inside the parentheses.

`parse_term` peeks and sees `TLambda`, so it calls `parse_abs`. `parse_abs`
consumes the lambda, extracts x as the parameter, consumes the dot, then
calls `parse_term` for the body. The body is just `TName("x")` - `parse_app`
calls `parse_atom`, which consumes it and returns `Var("x")`. `parse_abs`
wraps this in `Abs("x", Var("x"))` and returns. Back in `parse_atom`, we
expect and consume the `TRParen`. The parenthesised subterm is done.

We're back in `parse_app` with `lhs = Abs("x", Var("x"))`. `can_start_atom`
peeks and sees `TName("y")`. `parse_atom` consumes it and returns `Var("y")`.
A new `App` node is built:

```text
App(Abs("x", Var("x")), Var("y"))
```

`can_start_atom` peeks and sees `TEOF` - stop. So our final tree looks like:

```text
App
├── Abs("x")
│   └── Var("x")
└── Var("y")
```

Which `term_to_string` renders as `((λx. x) y)` - and which the reducer will
soon evaluate to y.

## Substitution
Substitution is at the heart of a lambda calculus interpreter. Substitution
replaces free occurrences of a variable in a term with another term. A
variable is free if it is not bound under a lambda that introduces it, ie.
in `λx. x y `, `x` is bound and `y` is free.

The naive approach to substitution is to walk the terms and replace every
occurrence of the target variable with the replacement. Yet, consider
`(λx. λy. x) y` - which applies a function that ignores its second argument
and returns its first, to a variable `y`. The naive result would be `λy. y`,
but this is the identity function - not what we wanted.

What happened is the `y` that we passed in got captured by the inner `λy` during
substitution. The `y` that was a free variable in our argument became bound by
a lambda it was never meant to be under. This is called variable capture.

To avoid variable capture we need to know, at any point during substitution,
whether a variable appears free in a term. The rules are simple and map directly
onto the three term forms:

- `FV(x) = {x}` A variable `x` is free in itself, but not in any other variable.

- `FV(M₁ M₂) = FV(M₁) ⋃ FV(M₂)` `x` is free in an application `M N` if it is free in `M` or free in `N`

- `FV(λx.M) = FV(M) \ {x}` `x` is free in `λy. M` if it is free in `M` *and* `x ≠ y` - the lambda binds
`y`, so if `x` is `y` it is no longer free inside.

These rules map cleanly into code:

```odin
is_free :: proc(name: string, term: ^Term) -> bool {
  if var, ok := term.(Var); ok {
    // FV(x) = {x}
    return var.name == name
  }
  else if abs, ok := term.(Abs); ok {
    // FV(λx.M) = FV(M) \ {x}
    return is_free(name, abs.body) && name != abs.param
  }
  else if app, ok := term.(App); ok {
    // FV(M₁ M₂) = FV(M₁) ⋃ FV(M₂)
    return is_free(name, app.rand) || is_free(name, app.rator)
  }
  unreachable()
}
```

Note how, in the abs case, the lambda acts like a fence - a free variable
outside it may be bound inside.

Now that we have `is_free` we can state the correct substitution rule for the
abstraction case. When substituting `x` with `N` in `λy. M` there are three
possibilities:

If `y` is `x`, the lambda rebinds the same variable that we are substituting.
Every occurence of `x` inside `M` refers to the lambda's parameter, not the `x`
that we're replacing. So we just stop here and return the abstraction unchanged.

If `y` is not `x` but `y` appears free in `N` then there is a risk of variable
capture. Proceeding would put `N` inside a lambda that binds `y`, trapping any
free `y`s in `N` as we saw above. The fix is *α-conversion*. We rename `y` to a
fresh variable `y'` throughout `M` before proceeding. The term `λy. M` and
`λy'. M[y := y']` are *alpha-equivalent* - identical besides renaming of bound
variables - so this is always safe. We generate fresh names with a global
counter, and since user-facing names cannot contain digits, clashes are
impossible.

```odin
fresh_counter := 0

alpha_convert :: proc(base: string) -> string {
  fresh_counter += 1
  return fmt.tprintf("%s%d", base, fresh_counter)
}
```

A cleaner solution replaces named variables entirely with numeric indices
indicating how many lambdas deep the binding is - so `λx. x` becomes
`λ. 0` and `λx. λy. x` becomes ``λ. λ. 1.` These are called de Bruijn indices,
and they make alpha-equivalence trivial: two terms are alpha-equivalent iff.
they are identical. For the sake of simplicity, I have left them out of this
implementation.

If neither of the above applies then we just recurse into the body.

```odin
substitute :: proc(name: string, replacement: ^Term, term: ^Term) -> ^Term {
  if var, ok := term.(Var); ok {
    return var.name == name ? replacement : term
  }
  else if abs, ok := term.(Abs); ok {
    if abs.param == name {
      res := new(Term)
      res^ = Abs{ abs.param, abs.body }
      return res
    }
    else if is_free(abs.param, replacement) {
      fresh_name := alpha_convert(abs.param)
      fresh_var := new(Term)
      fresh_var^ = Var{ fresh_name }

      res := new(Term)
      res^ = Abs{
        fresh_name,
        substitute(name, replacement, substitute(abs.param, fresh_var, abs.body))
      }

      return res
    }
    else {
      res := new(Term)
      res^ = Abs{ abs.param, substitute(name, replacement, abs.body) }
      return res
    }
  }
  else if app, ok := term.(App); ok {
    res := new(Term)
    res^ = App{
      substitute(name, replacement, app.rator),
      substitute(name, replacement, app.rand)
    }
    return res;
  }
  unreachable()
}
```

Substitute builds a new tree rather than modifying the existing one. Every
recursive call allocates fresh nodes, leaving the original term untouched. This
makes the semantics clean - you can always refer back to the term before
reduction, and would allow for displaying reduction steps. The obvious cost is
allocation, which more sophisticated interpreters address through structure
sharing or environment-based evaluation. For our purposes clarity is more
important than performance.

## Reduction
Beta reduction is the single computational rule of lambda calculus. A *redex* -
reducible expression - is any application whose operator is an abstraction (a
function call!) When we find one, we fire it: `(λx. M) N → M[x := N]`; 
substitute the argument for the parameter throughout the body. Observe that
everything we've built so far, the AST, the lexer, the parser, the substitution
machinery, exists to make this one rule work correctly!

However, a term may contain more than one redex. Consider, for instance:

```text
(λx. x) ((λy. y) z)
```

There are two redexes here: the outer application, and `(λy. y) z` inside the
argument. We could either reduce the outer one first, substituting the entire
unevaluated argument into the body, or we could reduce the inner one first,
evaluating the argument *before* substituting it. You may recognise the first
of these as *normal order* and the second as *applicative order*.

Applicative order is what most programming languages do. Arguments are evaluated
before being passed to a function. This saves on computation. Normal order is
lazy: it substitutes first and evaluates later. This can mean duplicated
computations. Haskell uses normal order, which is why it can work with infinite
data structures, it avoids duplicated computations through something called
[sharing](https://en.wikipedia.org/wiki/Sharing_(computer_science)).

Choosing between these two strategies has important consequences. Consider the
omega combinator:

```text
ω = (λx. x x)(λx. x x)
```

Reducing `ω` produces `ω` again. It has no normal form - it just reduces
forever. Now consider:

```text
(λy. z) ω
```

This applies a constant function - one that ignores its arguments and returns
`z` - to `ω`. The result should be `z`. Yet, under applicative order, we
evaluate the argument first: we attempt to reduce `ω`, which loops forever, and
never get `z`.

Since normal order reduces the outermost redex first, the outer application
fires immediately: substitute `ω` for `y` in `z`. `y` doesn't appear in `z`, so
`ω` just disappears. We get `z` in one step.

This is the content of the *normalisation theorem*: if a term has a normal form,
normal order reduction will find it. Applicative order will not always find a
term's normal form even if it has one. This is why we implement normal order.

To implement β-reduction, we first implement a `reduce_step` proc, which
attempts a single reduction and returns the result paired with a boolean -
`true` means a reduction fired, `false` means the term is already in normal
form. This boolean mechanism threads success signals up the recursive calls:
if nothing happened below, try somewhere else; if nothing happened anywhere,
we are done reducing.

There are four cases:
- If the term is a variable, there is nothing to reduce -
variables are already in normal form, return false.

- If the term is an application
whose operator is an abstraction, we have a redex: fire it immediately via
substitution and return true.

- If the term is an application but the operator
is not an abstraction, we try to reduce the operator first — if that succeeds
we rebuild the application with the reduced operator and return true; if it
fails we try the operand instead. This left-to-right priority is what makes
the strategy normal order: we always reduce the outermost leftmost redex.

- Finally, if the term is an abstraction, we attempt to reduce the body. If
the body reduces we wrap it back in the abstraction and return true; otherwise
return false.

Here's my implementation of the `reduce_step` proc:

```odin
reduce_step :: proc(term: ^Term) -> (^Term, bool) {
  if var, ok := term.(Var); ok {
    return nil, false
  }
  if abs, ok := term.(Abs); ok {
    if body_reduced, ok := reduce_step(abs.body); ok {
      res := new(Term)
      res^ = Abs{ abs.param, body_reduced }
      return res, true
    }
    return nil, false
  }
  if app, ok := term.(App); ok {
    if abs, ok:= app.rator.(Abs); ok {
      return substitute(abs.param, app.rand, abs.body), true
    }
    else if rator_reduced, ok := reduce_step(app.rator); ok {
      res := new(Term)
      res^ = App{ rator_reduced, app.rand }
      return res, true
    }
    else if rand_reduced, ok := reduce_step(app.rand); ok {
      res := new(Term)
      res^ = App{ app.rator, rand_reduced }
      return res, true
    }
    else {
      return nil, false
    }
  }
  unreachable()
}
```

Then, `reduce` is just a loop: call `reduce_step`, if it returns false we have
reached normal form and we're done, if it returns true repeat with the new term.
A step counter guards against non-terminating terms - hitting the limit returns
false, which in the REPL produces a clean error rather than an infinite loop.
Without it, feeding `ω` to the interpreter would hang forever.

```odin
reduce :: proc(term: ^Term, max_steps := 10000) -> (^Term, bool) {
  current := term
  for i in 0..<max_steps {
    next, ok := reduce_step(current)
    if !ok do return current, true
    current = next
  }
  return nil, false
}
```

Take `(λx. λy. y) a b`. We can write this as `App(App(Abs(x, Abs(y, Var(y))),
Var(a)), Var(b))`. Application is left-associative, so `a` is applied first,
then `b`. Normal order finds the outermost leftmost redex and fires it:

**Step 1 -** the outer redex is `(λx. λy. y) a`.  Substitute `a` for `x` in `λy. y`:

```text
(λx. λy. y) a b
 [x := a]
(λy. y) b
```

`x` does not appear free in `λy. y`, so `a` just disappears.

**Step 2 -** now the outer redex is `(λy. y) b`. Substitute `b` for `y` in `y`:

```
(λy. y) b
 [y := b]
b
```

`y` is free in `y`, so it is replaced by `b`. We are left with `b`, which is
normal form - no other reductions are possible.

We have just evaluated `fls a b`! `fls = λx. λy. y` is a function that takes two
arguments and returns the second. The reduction above is the Church encoding of
false selecting between two alternatives, which is where we are headed next.

## Church Encodings

Pure lambda calculus has no named constants - only anonymous functions. What
follows is made possible by a small preprocessor that expands names to their
definitions. This sits before reduction, and expands eagerly, keeping the
interpreter itself pure. Names are nothing more than a convenience for the
programmer; the interpreter only sees `λ`, `.`, and parentheses.

With that last bit of machinery in place, we can start to build a standard
library. The question is: what can we construct from nothing but anonymous
functions?

### Booleans

We have no notion of true or false yet, all we have are functions.
The key insight that gets us started is that a boolean doesn't need
to *represent* a choice, it can *be* one. We define:

```text
let tru = \x. \y. x
let fls = \x. \y. y
```

`tru` is a function that takes two arguments and returns the first. `fls` takes
two arguments and returns the second. That's all. This means `if b then x else y`
is just `b x y`. The boolean applied to its two branches selects the right one,
so there is no need for an `if` construct.

Boolean operators fall straight out of this. `and p q` should return `q` if `p`
is true and `fls` if `p` is false - because if `p` is true the result depends on
`q`, and if `p` is false the result is false regardless:

```text
let and = \p. \q. p q fls
let or  = \p. \q. p tru q
let not = \p. p fls tru
```

`not p` is especially clear. It says: apply `p` to `fls` and `tru`. If `p` is
`tru` it picks the first argument, `fls`. If `p` is `fls` it picks the second,
`tru`. A boolean negated by applying it to its own negation.

### Numerals

This same pattern of encoding behaviour as function selection can be generalised
to help us think beyond booleans, about numerals. If a boolean is a choice, a
number is an iteration. The Church numeral `n` is a function that takes `f`
and `x` and applies `f` to `x` exactly `n` times:

```text
let zero  = \f. \x. x
let one   = \f. \x. f x
let two   = \f. \x. f (f x)
let three = \f. \x. f (f (f x))
```

`zero` applies `f` zero times - it just returns `x`. `one` applies it once. The
number *is* the iteration count, concretised as a higher-order function.

Successor is straightforward then - apply `f` one extra time:

```text
let succ = \n. \f. \x. f (n f x)
```

`n f x` applies `f` n times. Wrapping it in one more `f` gives n+1. Addition
follows cleanly: to add `m` and `n`, apply `f` m times starting from `n f x` -
which is `f` applied `n` times to `x`:

```text
let plus = \m. \n. m succ n
```

Which we read as: apply `succ` to `n` exactly `m` times. Multiplication is just
repeated addition:

```text
let mult = \m. \n. m (plus n) zero
```

Apply `plus n` to `zero` exactly `m` times. In just three definitions, we have
basic arithmetic. Now for the tricky one.

### Subtraction
Addition and multiplication fall out of numeral encoding intuitively. But, there
is no obvious way to go backwards. A church numeral knows how to apply a
function, not how to undo one. To get a predecessor function, which gives `n - 1`
requires a clever insight.

That insight comes from [Kleene](https://en.wikipedia.org/wiki/Stephen_Cole_Kleene).
He noticed that instead of trying to count down, we can count *up* in pairs.
First we define `pair`, which just wraps two variables in a function that takes a
selector and returns one or the other, then `slide`, which takes a pair `(a, b)`
and returns `(b, succ b)`. Notice what happens when we apply `slide` n times
starting from `(zero, zero)`:

```text
(0,0) → (0,1) → (1,2) → (2,3) → ... → (n-1, n)
```

After n applications the first element of the pair is n-1. The predecessor is
just the first element of the pair. Given `fst` and `snd` (which are just `tru`
and `fls`!), we can write pred:

```text
let pair  = \x. \y. \f. f x y
let slide = \p. pair (snd p) (succ (snd p))

let fst = \p. p (\x. \y. x)
let snd = \p. p (\x. \y. y)

let pred = \n. fst (n slide (pair zero zero))
```

And subtraction is just iterated decrement - apply `pred` to `a` `b` times:

```text
let sub = \a. \b. b pred a
```

Now we can easily build up conditions like equality, comparison. `zero?`
applies the numeral to a function that always returns `fls`, with a base case of
`true` - if `f` is never applied we get `tru`, otherwise `fls`. Equality and
comparison are just combinations of `sub` and `zero?`:

```text
let zero? = \p. p (\x. fls) tru
let eq?   = \p. \q. and (zero? (sub p q)) (zero? (sub q p))
let lte?  = \p. \q. zero? (sub p q)
let gte?  = \p. \q. zero? (sub q p)
```

Each definition is getting smaller than the last because the previous ones are
doing the work.

### Lists

How do you represent a complex data structure like a linked list purely in terms
of functions? We already have pairs, and a linked list is just a chain of pairs.
Each node is a pair of a head element and a tail, which is terminated by a
sentinel value. We use a pair that identifies itself to represent that sentinel.

```text
let nil      = pair tru tru
let mil?   = \l. fst l
```

`nil` is a pair whose first element is `tru`. The second element could be
anything, because `mil?` just checks that first element -
tru means we've reached the end, fls means there's more list. A non-empty list
node is a pair whose first element is fls, distinguishing it from nil:

```text
let cons = \h. \t. pair fls (pair h t)
let head = \l. fst (snd l)
let tail = \l. snd (snd l)
```

`cons` wraps the head and tail in an inner pair, then tags the whole thing with
`fls`. `head` and `tail` just unwrap - skip the tag, then take the first or second
element of the inner pair.

So we have a linked list defined in terms of nothing other than functions
applied to functions. The list `[two, one, zero]` looks like this:

```text
let x = cons two (cons one (cons zero nil))
```

And the `nth` implementation is immediately obvious: to get the nth element,
apply `tail` n times then take the head:

```text
let nth = \l. \n. head (n tail l)
```

At this point it is already starting to feel less like a formal curiosity and
more like a programming language. We have booleans, arithmetic, and a linked
list data structure, all from anonymous functions and substitution.

### Finally: The Y Combinator

At this point there is still something big missing: looping. A lambda term can't
refer to itself because it doesn't have a name, and without self-reference there
is no recursion. Without recursion in our language we could only represent finite
computation. Every function we have written so far terminates because it has no
way to call itself.

The Y combinator solves this elegantly with a sleight of hand:

```text
let Y = \f. (\x. f (x x)) (\x. f (x x))
```

The key property is that `Y f = f (Y f)`, that is, applying `Y` to a function
`f` gives back `f` applied to `Y f` - `f` recieves itself, already applied, as
an argument. Self-reference emerges from self-application.

To write a recursive function we write a function that takes its own future self
as an argument:

```text
let fact = Y (\go. \n. if (zero? n) one (mult n (go (dec n))))
```

`go` is the recursive call. When `fact` needs to recurse it calls `go`, which
the Y combinator arranged to be `fact` itself.

### Fold

With recursion in hand, higher order functions over lists follow naturally.
`fold` is fundamental - it walks a list and accumulates a result by applying a
function to each element:

```text
let fold = Y (\go. \l. \a. \f. if (mil? l) a (go (tail l) (f a (head l)) (f)))
```

If the list is `nil` return the accumulator. Otherwise apply `f` to the
accumulator and the head, and recurse on the tail. Everything else is `fold` in
disguise:

```
let rev = \l. fold l nil (\a. \x. cons x a)
let foldr = \l. \a. \f. fold (rev l) a f
let map = \l. \f. foldr l nil (\a. \x. cons (f x) a)
let filter = \l. \p. foldr l nil (\a. \x. if (p x) (cons x a) a)
let append = \l. \m. foldr l m (\a. \x. cons x a)
let len = \l. fold l zero (\a. \x. succ a)
```

`map` and `filter` are not primitives - they are just `fold`s with a particular
function passed in. `len` is `fold` counting. `append` is `fold` consing onto
another list.

**All of this just falls out.** This is the thing that feels magical about
lambda calculus and about functional programming more broadly: the right
primitives generate complexity upward. Once we had `fold` figured out, we
got an entire collection of list operations for free.

[McCarthy](https://en.wikipedia.org/wiki/John_McCarthy_(computer_scientist)) saw
this in 1960. His [original Lisp paper](https://www-formal.stanford.edu/jmc/recursive.pdf)
derives the entire language from lambda calculus in a few pages. What we have built
here is a Lisp without syntactic sugar - anonymous functions, a handful of conventions,
and substitution do all the work.

## Conclusion

The most fun I had during this project was writing the standard library. The
feeling was quietly vertiginous. All of the complexities - booleans, arithmetic,
linked lists, higher order functions, recursion - fell out of three simple rules.

Here is an insertion sort over a list of Church numerals, written in the lambda
calculus we have built:

```text
let insert = Y (\go. \n. \l.
  if (nil? l)
    (cons n nil)
    (if (lte? n (head l))
      (cons n l)
      (cons (head l) (go n (tail l)))))

let sort = Y (\go. \l.
  if (nil? l)
    nil
    (insert (head l) (go (tail l))))

let sorted = sort (cons three (cons two (cons five (cons four nil))))
```

We have built a universal computer, and yet it has a limitation. Nothing that we
have built prevents nonsense - nothing stops you passing an abstraction to a
function that expects a variable, and vice versa, likewise nothing stops you
from writing `three not` or `tru succ`. These are perfectly valid terms and the
interpreter will attempt to reduce them without complaint. Adding a type system
changes that: terms have to make sense before they can be evaluated. It turns
out this limits what we can compute, but we also discover an interesting
property: types turn out to be more than a safety check. Every well-typed term
in the simply typed lambda calculus corresponds to a proof in propositional
logic! A function type 'A -> B' is an implication. A term inhabiting that type
is a proof that the implication holds. Type checking *is* proof verificiation.
This correspondence - propositions as types, proofs as programs - is called the
[Curry-Howard
correspondence](https://en.wikipedia.org/wiki/Curry%E2%80%93Howard_correspondence).

That is where we are going next, in [part
two](/blog/typed-lambda-calculus-curry-howard) of what I hope will be a
short series of posts, where we implement the STLC and discuss the Curry-Howard
correspondence in more detail.
