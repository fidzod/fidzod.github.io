---
title: "Types as Propositions, Proofs as Programs: Implementing STLC and PCF"
date: 2026-06-18
description: "We extend our lambda calculus interpreter with a type system, discover that almost nothing from the untyped standard library survives, derive PCF from first principles, and arrive somewhere unexpected: the typechecker we wrote is also a proof checker - Curry-Howard isomorphism."
---

In [part one](/blog/lambda-calculus-interpreter-in-odin) we built a lambda
calculus interpreter in Odin - a universal computer from only three rules. At
the end of that post I promised a type system, and that brings us to part two.

In this post we implement STLC discover what it can (and moreover *can't*) do,
derive PCF, and end up somewhere surprising: the typechecker we wrote turns out
to be a proof checker, and the correspondence between the two is not
coincidental.

*All the code for this project is available on
[Github](https://github.com/fidzod/lambda-calculus).*

## Simply Typed Lambda Calculus

The untyped interpreter we built in [part
one](/blog/lambda-calculus-interpreter-in-odin) will happily reduce `succ true`
or `dec and` without complaint, yet these terms are nonsense: `succ` expects a
number not a boolean, and `dec` likewise expects a number, not a function over
booleans. But, the evaluator has no way to know what it is looking at. All the
evaluator does is substitute and reduce until it gets stuck or runs out of steps.

We can change that by introducing a type system. Terms have to make sense before
they get evaluated. So the typechecker sits in between the parser and the
evaluator, and if it rejects a term, reduction never happens:

```text
source -> lexer -> parser -> typechecker -> substitution -> reduction
```

The question is: what does it mean for a term to *make sense*?

### Typing Rules

STLC answers this with three inference rules:

```text
Γ, x:A ⊢ x : A                   (Var)

Γ, x:A ⊢ t : B
─────────────────────────────    (Abs)
Γ ⊢ λx:A. t : A→B

Γ ⊢ t₁ : A→B    Γ ⊢ t₂ : A
─────────────────────────────    (App)
Γ ⊢ t₁ t₂ : B
```

If you haven't seen this notation before: each rule has hypotheses above the
line and a conclusion below it. The turnstile *⊢* is read "proves" or "entails".
*Γ* (gamma) is the *typing context*, which is just a map from variable names to
their types, representing what we currently know. `t : A` means "term t has type
A". Given these definitions, we can rewrite our inference rules as follows:

- **Var**: if the context says `x` has type `A`, then `x` has type `A`.

- **Abs**: if, assuming `x` has type `A`, the body `t` has type `B`, then the
whole abstraction has type `A->B`.

- **App**: if `t₁` has type `A→B` and `t₂` has type `A`, then applying `t₁` to
  `t₂` gives something of type `B`.

Note that the first two of these can't go wrong on their own, they essentially
just propogate information. Application is where types can conflict.

These rules also show that in STLC, lambdas must declare the type of their
parameters, and we use type annotations for this. There is no type inference.

Our complete STLC implementation should be able to evaluate a term that looks
like `let true = \x: Bool. \y: Bool. x` where true has type `Bool -> Bool ->
Bool`.

### The Type AST

Types are their own AST. A type is either a base type - an atomic label like
`Nat` or `Bool` - or an arrow type `A->B`. STLC is parametric in its base types;
the theory does not care how many you have or what you call them. `Nat` is just
a name. What matters is that the typechecker can tell them apart and refuses to
mix them up.

```odin
Type :: union {
  TypeBase,
  TypeArrow,
}

TypeBase :: struct {
  name: string,
}

TypeArrow :: struct {
  domain:   ^Type,
  codomain: ^Type,
}
```

We also need to extend `Abs` in our term AST with a `param_type` field, and
extend the parser to handle type annotations. Since a lambda now looks like
`\x:A. t`, `parse_abs` needs to read the colon and the type between the
parameter name and the dot.

Parsing types is its own small recursive descent. A type is either a base name
or a parenthesised type, optionally followed by `->` and another type. The
recursion handles arrow types correctly, and right-associativity - `A->B->C`
means `A->(B->C)` - falls out for free, the same way left-associativity fell out
of `parse_app`.

```odin
parse_type :: proc(p: ^Parser) -> (^Type, bool) {
  domain: ^Type; ok1: bool

  if _, is_lparen := peek(p).(TLParen); is_lparen {
    advance(p)
    domain, ok1 = parse_type(p)
    if !ok1 do return nil, false
    if !expect(p, TRParen) do return nil, false
  } else {
    name, is_name := peek(p).(TName)
    if !is_name do return nil, false
    advance(p)
    domain = base(name.value)
  }

  if _, is_arrow := peek(p).(TArrow); !is_arrow do return domain, true
  advance(p)
  if codomain, ok := parse_type(p); ok do return arrow(domain, codomain), true
  return nil, false
}
```

## The Typechecker

To implement the typechecker, we just translate the above rules into code. It
takes a term and a context, and either returns the type of the term, or fails.

```odin
typecheck :: proc(ctx: map[string]^Type, term: ^Term) -> (^Type, bool) {
  if var, ok := term.(Var); ok {
    if t, ok := ctx[var.name]; ok do return t, true
    return nil, false
  } else if abs, ok := term.(Abs); ok {
    abs_ctx := make(map[string]^Type)
    for key, value in ctx do abs_ctx[key] = value
    abs_ctx[abs.param] = abs.param_type

    codomain, ok := typecheck(abs_ctx, abs.body)
    if !ok do return nil, false

    return arrow(abs.param_type, codomain), true
  } else if app, ok := term.(App); ok {
    f, ok1 := typecheck(ctx, app.rator)
    if !ok1 do return nil, false

    f_arrow, ok2 := f.(TypeArrow)
    if !ok2 do return nil, false

    a, ok3 := typecheck(ctx, app.rand)
    if !ok3 do return nil, false

    if !are_same_type(a, f_arrow.domain) do return nil, false
    return f_arrow.codomain, true
  }

    unreachable()
}
```

This is a pretty direct reflection of our rules: Var just looks up the context.
Abs copies the context, extends it with the parameter's declared type, recurses
on the body, and wraps the result in an arrow. App recurses on both sides,
checks that the function's type is an arrow, checks that the type of the argument
matches the type of the domain, and returns that type.

Youl'll notice that typechecking is entirely straightforward in STLC: no
unification, no inference, no backtracking. The annotations give you everything
you need.

Let's do a quick test that the parser update and typechecker are working:

```odin
ctx := make(map[string]^Type)

if ast, ok = parse(`\f:i->i. \x:i. f x`); ok {
    if t, ok := typecheck(ctx, ast); ok {
        fmt.println(type_to_string(t))
    }
}
```

This correctly returns `(i->i)->i->i`: a function from a function `(i->i)` and a
base type `i` to a result `i`.

So, we can just wire our new typechecker in between the call to parse and the
calls to evaluate in our evaluation logic and STLC is done. Find the complete
source [here](https://github.com/fidzod/lambda-calculus/tree/main/stlc). Now
let's see what STLC can do.

## The Wall
At this point we have a working typed language, let's try and reimplement the
standard library from our untyped implementation.

Once again we'll start with the simplest thing:

```text
let tru = \x. \y. x
let fls = \x. \y. y
```

These need type annotations now. `tru` takes two arguments and returns the
first, so tentatively:

```text
let tru = \x: A. \y: B. x
```

The typechecker will tell us the full type of `tru` is `A->B->A`. But what are A
and B? Let's say we have `Bool` and `Nat` - these are just names - and pick one:

```text
let tru = \x: Bool. \y: Bool. x
```

The typechecker accepts this: `tru : Bool->Bool->Bool`. Now let's try `and`:

```text
let and = \p: Bool->Bool->Bool. \q:Bool->Bool->Bool. p q fls
```

This says: apply `p` to `q` and `fls`. But `p : Bool->Bool->Bool` - those don't
match, and we get a type error.

The problem is that `p q` requires `q` to have the same type as `p`'s domain,
but `p` *is* a `Bool->Bool->Bool`, so its domain is `Bool->Bool->Bool`, which
means `q` would need to be a `Bool->Bool->Bool` whose domain is
`Bool->Bool->Bool` and so on. You need a self-referential type, and STLC can't
express this.

Church numerals fail for exactly the same reason. The numeral `n` applies a
function `f` to a value `x` exactly `n` times - so `n : (A->A)->A->A` for some
`A`. But to pass a numeral to another numeral, you'd need `A = (A->A)->A->A`
which is again self-referential. Arithmetic via Church encoding requires
polymorphism - the ability to quantify over type variables - and STLC doesn't
have it.

What about the Y combinator? `Y = \f. (\x. f (x x)) (\x. f (x x))`. The inner
term `x x` applies `x` to itself, so `x` would need to have type `A→B` and type
`A` simultaneously - that is, `A = A→B`. Which is, again, self-referential.

Furthermore, our `tru` definition might well have been accepted by the
typechecker, but you've probably noticed we can't pass it a value to test it.
There's nowhere to get a `Bool` from.

Almost nothing from the untyped standard library survives contact with the
typechecker. It is as if, by introducing it, we have made our language nearly
useless.

## Getting Something Back: Programming Computable Functions

The problem is that we are still trying to encode everything as functions. We
can't do that, so we need to introduce things as primitives. We want to try and
find the minimal primitive core that will allow for adequate expressiveness.

### Literals

The first thing we need is something to actually talk about. Notice how before
we were able to implement `tru` but not test it? The solution is literals. So,
we add `true`, `false` and `0` to the term AST.

```odin
Term :: union {
  Var, Abs, App,
  True, False, Zero,
}

True  :: struct {}
False :: struct {}
Zero  :: struct {}
```

We also need three new cases in `parse_atom`. `true` and `false` are just names
we intercept before falling through to `Var`. For numbers, we extend the lexer
with a `TNumber` token and handle it in the parser - if the value is zero,
return `Zero`; for now, anything else is an error.

In the typechecker we add a line for each constructor:

```odin
if _, ok := term.(True);  ok do return base("Bool"), true
if _, ok := term.(False); ok do return base("Bool"), true
if _, ok := term.(Zero);  ok do return base("Nat"),  true
```

The reducer is simple - they are already in normal form, so they just return
`nil, false`.

```text
λ> true
true : Bool
λ> 0
0 : Nat
λ> let x = true
x = true : Bool
```

Now we have values, but we can't do much with them yet.

### Succ, Pred and Iszero

We need three new term constructors, where each wraps a single
body term. The parser just dispatches on the keyword and parses the body:

```odin
parse_tname :: proc(p: ^Parser, tname: ^TName) -> (^Term, bool) {
    switch tname.value {
    case "true":  return make_true(), true
    case "false": return make_false(), true
    case "succ":
        body, ok := parse_term(p)
        if !ok do return nil, false
        return make_succ(body), true
    case "pred":
        body, ok := parse_term(p)
        if !ok do return nil, false
        return make_pred(body), true
    case "iszero":
        body, ok := parse_term(p)
        if !ok do return nil, false
        return make_iszero(body), true
    case:
        return make_var(tname.value), true
    }
}
```

The typechecker for all three follows the same pattern: check the body is `Nat`,
then return the appropriate type. `succ` and `pred` return `Nat`, `iszero`
returns `Bool`.

The reducer is more interesting. `succ` just reduces its body if possible,
otherwise it's stuck - a fully reduced `succ` applied to a numeral is itself a
numeral - `succ (succ 0)` represents 2. `pred` has two base cases before it
tries to reduce:

```odin
if pred, ok := term.(Pred); ok {
    if _, body_is_zero := pred.body.(Zero); body_is_zero do return pred.body, true
    if succ, body_is_succ := pred.body.(Succ); body_is_succ do return succ.body, true
    if body_reduced, ok := reduce_step(pred.body); ok {
        res := new(Term)
        res^ = Pred{body_reduced}
        return res, true
    }
    return nil, false
}
```

`pred 0` just returns `0`. `pred (succ n)` needs to unwrap one layer of `succ`
and return the body. If neither applies then we try to reduce the body further.
`iszero` follows the same pattern: `true` if the body is `Zero`, `false` if it's
a `Succ`, otherwise reduce the body. The important thing to remember here is
that we are reducing code that has *passed* typechecking. We can be sure that these
functions have a `Nat` type body.

We also need to extend `is_free` and `substitute` for all the new constructors.
`True`, `False`, and `Zero` contain no variables, so `is_free` returns false and
`substitute` returns the term unchanged. For `Succ`, `Pred`, `Is_Zero`, we just
recurse into the body - the same pattern as the existing `Abs` case.

```text
λ> succ (succ (succ 0))
succ (succ (succ 0)) [=3] : Nat
λ> pred (succ (succ 0))
succ 0 [=1] : Nat
λ> iszero 0
true : Bool
λ> iszero (succ 0)
false : Bool
```

### If

We can't write `if` as a function, because a function `if : Bool->T->T->T` would need a
type variable `T`, which STLC doesn't have. So we add it as a special form, and
the typechecker handles it directly.

Parsing and reduction are straightforward, they follow the pattern established by
`succ`, `pred`, and `iszero`. The typechecking rule is interesting:

```odin
if if_stmt, ok := term.(If); ok {
    cond_type, ok := typecheck(ctx, if_stmt.condition)
    if !ok do return nil, false
    if !is_base_type(cond_type, "Bool") do return nil, false

    cons_type, ok1 := typecheck(ctx, if_stmt.consequent)
    if !ok1 do return nil, false

    alt_type, ok2 := typecheck(ctx, if_stmt.alternate)
    if !ok2 do return nil, false

    if !are_same_type(cons_type, alt_type) do return nil, false
    return cons_type, true
}
```

The condition must be `Bool`. Both branches must have the same type - whatever
that type is. This is what makes `if` polymorphic without type variables: the
typechecker checks both branches and insists they agree, rather than requiring
them to match a fixed type. The reducer just fires the appropriate
branch once the condition has reduced to `true` or `false`.

```
λ> if true then (succ 0) else 0
succ 0 [=1] : Nat
λ> if (iszero 0) then false else true
false : Bool
```

### Fix

`fix` is the final missing piece, and arguably the most consequential. Without
it we have no recursion - we can compute, but only finitely. With `Fix`
we get a universal computer, but at a cost. More on this later.

`fix f` reduces to `f (fix f)`, giving `f` a reference to itself. The typing
rule is `fix : (τ→τ)→τ`. Given a function from `τ` to `τ`, `fix` produces a
`τ`. The typechecker verifies that the body is an arrow type whose domain and
codomain match:

```odin
if fix, ok := term.(Fix); ok {
    body_type, ok := typecheck(ctx, fix.body)
    if !ok do return nil, false

    arrow, is_arrow := body_type.(TypeArrow)
    if !is_arrow do return nil, false
    if !are_same_type(arrow.domain, arrow.codomain) do return nil, false

    return arrow.domain, true
}
```

The reducer caused me a little bit of trouble. The subtlety lies in the fact
that a bare `fix` sitting on its own ought to return `nil, false` - it does not
reduce until it's applied to something. So we handle the recursion in the `App`
case:

```odin
if fix, ok := app.rator.(Fix); ok {
    new_fix := new(Term)
    new_fix^ = Fix{fix.body}
    inner := new(Term)
    inner^ = App{rator = fix.body, rand = new_fix}
    result := new(Term)
    result^ = App{rator = inner, rand = app.rand}
    return result, true
}
```

When we see `(fix f) arg`, we rewrite it to `(f (fix f)) arg`. This hands `f`
two things: a copy of `fix f` - the recursion - and the actual argument. `f` can
then decide whether to call the recursion or return a base case. Crucially, `fix`
never disappears — it copies itself into the rewritten term. If `f` always
recurses, the reduction runs forever. This is what brings back non-termination,
and with it, Turing completeness.

What we have built here matches the following spec:

```text
-- Terms
t ::= x                    -- variable
    | λx:τ. t              -- abstraction
    | t t                  -- application
    | true | false         -- boolean literals
    | 0                    -- natural number literal
    | succ t               -- successor
    | pred t               -- predecessor
    | iszero t             -- zero test
    | if t then t else t   -- conditional
    | fix t                -- fixed point

-- Types
τ ::= Bool | Nat | τ → τ

-- New reduction rules
succ n                    →  n+1
pred 0                    →  0
pred (succ n)             →  n
iszero 0                  →  true
iszero (succ n)           →  false
if true  then t₁ else t₂  →  t₁
if false then t₁ else t₂  →  t₂
fix f                     →  f (fix f)
```

It turns out that this has a name: PCF, or Programming Computable Functions,
introduced by [Gordon Plotkin](https://en.wikipedia.org/wiki/Gordon_Plotkin)
in 1977. What we have accomplished is analogous to what McCarthy did in 1960
(see [part one](/blog/lambda-calculus-interpreter-in-odin) of this series),
when he took the untyped lambda calculus and added just enough primitives to
get a real language. We have done the same thing, one layer up.

## At Last: The Standard Library

With `Bool`, `Nat`, literals, `succ`, `pred`, `iszero`, `if`,
and `fix` in place, we have enough to write a standard library. Let's start with
`add`:

```text
let add = fix (\go: Nat->Nat->Nat. \m:Nat. \n:Nat.
  if (iszero m)
    then n
    else (succ (go (pred m) n)))
```

`go` is the recursive call, arranged by `fix`. If `m` is zero, return `n`.
Otherwise, decrement `m` and increment the result - addition as iterated
successor. `mult` is the same idea: iterated addition:

```text
let mult = fix (\go: Nat->Nat->Nat. \m:Nat. \n:Nat.
  if (iszero m)
    then 0
    else (add (go (pred m) n) n))
```

Subtraction works a lot like add too. We no longer need the slide trick from part
one since we have `pred` - we just need to iterate it:

```text
let sub = fix (\go: Nat->Nat->Nat. \m:Nat. \n:Nat.
  if (iszero n)
    then m
    else (go (pred m) (pred n)))
```

Boolean operations are direct, because `if` is a primitive and `Bool` is a real
type:

```text
let and = \x:Bool. \y:Bool. if x then y else x
let or  = \x:Bool. \y:Bool. if x then x else y
let not = \x:Bool. if x then false else true
```

Compare this to the untyped versions. In part one, `and p q` was `p q fls` -
booleans as selectors. Here, `and` just uses `if` directly. The encoding is
gone and the meaning is on the surface.

With `sub` and `iszero` we get comparisons:

```text
let eqnat = \p:Nat. \q:Nat. and (iszero (sub p q)) (iszero (sub q p))
let lte   = \p:Nat. \q:Nat. iszero (sub p q)
let lt    = \p:Nat. \q:Nat. and (lte p q) (not (eqnat p q))
```

And with that, we are in a position to write an actual program:

```text
import std

let fib = fix (\go: Nat->Nat. \n: Nat.
  if (lte n 1)
    then n 
    else (add (go (pred n)) (go (sub n 2))))
```

```text
λ> fib 0
0 : Nat
λ> fib 1
1 : Nat
λ> fib 7
13 : Nat
```

This is fibonacci in a real, typed, functional programming language, built
from the ground up.

## The Typechecker is a Proof Checker!

Let's look back at the typing rules we've been working with:

```text
Γ, x:A ⊢ x : A                   (Var)

Γ, x:A ⊢ t : B
─────────────────────────────    (Abs)
Γ ⊢ λx:A. t : A→B

Γ ⊢ t₁ : A→B    Γ ⊢ t₂ : A
─────────────────────────────    (App)
Γ ⊢ t₁ t₂ : B
```

Now look at these - the natural deduction rules for propositional implication:

```text
Γ, A ⊢ A               (Assumption)

Γ, A ⊢ B
──────────             (→-Intro)
Γ ⊢ A → B

Γ ⊢ A → B    Γ ⊢ A
───────────────────    (→-Elim)
Γ ⊢ B
```

To go from one set of rules to the other, you merely erase the terms. Strip out
`x`, `t`, `t₁ t₂` - everything left of the colon - and what remains is exactly
the natural deduction rules. The typing rules *are* the inference rules, with
terms attached.

This is the [Curry-Howard correspondence](
https://en.wikipedia.org/wiki/Curry%E2%80%93Howard_correspondence), also known
as the Curry-Howard isomorphism. Types are propositions, and terms are proofs.
`t : A` means "t is a proof of A". The typing context *Γ* is a set of
assumptions. Type-checking is proof-checking.

The arrow type, a term of type `A->B`, is a proof that A implies B. A function
that takes a proof of A and returns a proof of B. This isn't a metaphorical
thing, this is exactly what the abstraction rule says. If you can prove B
assuming A, you have a proof of `A->B`.

Application is modus ponens. You have `A->B` - you have A, you get B. The
function application we've been writing since part one *is* modus ponens.

### Strong Normalisation as Cut Elimination

STLC is strongly normalising - every well-typed term reduces to a normal form.
Under Curry-Howard, this says something about the logic: every proof can be
simplified to a *direct* proof, one with no unnecessary detours.

The detours are the redexes. When you write `(\x: A. t) s`, you're introducing
something - a value of type A - and immediately eliminating it. You went via a
lemma you didn't need. Beta reduction removes the detour. Strong normalisation
says the process always terminates: every proof has a fully direct form.

This result is called cut elimination, and it's a central theorem of proof
theory. In STLC it just falls out of the semantics, almost for free. Proof
simplification *is* computation. They're the same thing.

### Fix Proves False

Something broke when we added `fix`. `fix (\x: τ. x))` has type `τ` for any `τ`
you choose. Hand the identity function to `fix` and you get a term of whatever
type you like. Under Curry-Howard, that means a proof of any proposition -
including false ones and contradictions. The logic becomes trivial, because
every proposition is provable.

This isn't a bug in the implementation though, it's just the cost of general
recursion. `fix` introduces non-termination - terms that reduce forever without
reaching a normal form. A non-terminating proof is a proof that never completes.
Cut elimination fails. The correspondence is ruptured.

There is a clean trade-off: you can have consistent logic, or you can have
Turing completeness, but you can't have both. PCF chooses Turing completeness,
and `fib` works, and the logic is inconsistent.

Languages that sit on the other side of this trade-off - Agda, Coq, Lean -
refuse fix in its unrestricted form. They only permit recursion that can be
proven to terminate. Every type genuinely means something, so the typechecker is a
proof assistant, not just a gatekeeper. The cost is that you have to convince the
system your program halts.

## Conclusion

The untyped lambda calculus gave us universal computation from just three rules,
but had no notion of what anything *means*. Adding a type system changes that:
terms have to make sense before they get evaluated.

STLC is the simplest such system - three inference rules, annotations on
lambdas, and a typechecker that sits between the parser and the evaluator.
Clean, but mostly useless in isolation. The Church encodings that powered the
untyped standard library require polymorphism STLC doesn't have, and the wall
arrives almost immediately.

PCF is what you get when you add just enough primitives to make the language
habitable: `Bool`, `Nat`, literals, the arithmetic operations, `if` as a special form,
and `fix`. 

Curry-Howard isomorphism reframes everything we built. The typechecker was
always a proof checker, function types always were implications, application
always was modus ponens. The terms were proofs all along, we just didn't read
them that way.

`fix` comes in and breaks that correspondence. A term of any type can be
constructed from the identity function and fix, which means every proposition
becomes proveable, and hence all of them cease to mean anything. We trade
consistent logic for Turing completeness and get PCF.

The natural next question is *what if we didn't have to choose?* What if we
could have polymorphism *and* a meaningful type system?

The [Lambda Cube](https://en.wikipedia.org/wiki/Lambda_cube) is a map of type
systems ordered by what kinds of abstraction they allow. Each axis adds a new
dependency: types depending on types, terms depending on types, types depending
on terms. At the far corner is the Calculus of Constructions, which is both a
programming language and a proof assistant.

In the next post we'll explore the cube, implement one of its inhabitants, and
see what it looks like to write a program that is also a proof - without breaking
the logic to do it.
