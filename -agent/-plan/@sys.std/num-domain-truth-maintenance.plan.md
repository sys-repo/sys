num-domain-truth-maintenance.plan.md
- [x] 5f1ed22ee fix(std): codify Num predicate correspondence
- [x] 7e48ca5cb fix(std): enforce exact random integer ranges
- [x] 7e89518a9 fix(std): validate percent ranges truthfully
- [x] a30261b7b fix(std): make ratio approximation truthful
- [x] 55f15937e docs(std): define Num display formatting semantics

## Purpose

Make `@sys/std/num` a self-describing numeric standard library whose names, native correspondence,
operational refinements, published compatibility, and proof agree.

This campaign preserves established ECMAScript meanings and exact public compositions. It hardens
only the operations whose current behavior makes a stronger promise than their implementation can
support. It adds no speculative API and performs no compatibility cleanup without separate evidence
and authority.

This plan records migration scope; it is not durable API authority. Every lasting rule must land in
the public type spine, runtime/module hierarchy docs where relevant, and executable tests.

## Completion evidence

All five local items landed as the uniquely reachable commits recorded in the opening arc, in that
order. Their committed path sets match the item-attribution boundaries below. No package version
bump, publication, speculative API, production-consumer migration, or deferred work entered the arc.

Final proof from `code/sys/std` after the display-formatting item:

```text
deno task test --trace-leaks src/m.Num
  7 tests | 112 steps | 0 failed

deno task test --trace-leaks
  185 tests | 2244 steps | 0 failed

deno task check
  passed

deno task dry
  passed
```

The display suite also passed under both the host `en-NZ` locale and an explicit `de-DE` default.
Mutation probes proved that its tests reject a hard-coded locale and a zero-argument-only
regression; the production body was restored before the final green proof. `git diff --check`
passed.

Workspace-wide root proof is not claimed: the wider worktree contained substantial unrelated
changes, so failure attribution was not independently safe. The plan makes that proof conditional;
complete package-local proof is recorded above.

## Foundational design rules

### Native correspondence

When a `Num` member resembles a `Number` or `Math` member, classify it explicitly:

- **exact correspondence** — preserve the native value or predicate semantics without narrowing;
- **compatible extension** — preserve the native base behavior while adding one stated capability;
- **intentional refinement** — state the stronger contract and use a self-describing name;
- **distinct operation** — avoid implying native conversion or alias semantics.

Public JSDoc must name the relevant native baseline and the precise delta. Boundary tests must prove
that delta. Documentation may explain an intentional difference; it must not rescue a misleading
name.

Canonical predicate relationships:

- `Num.Is.int` corresponds to `Number.isInteger`.
- `Num.Is.safeInt` corresponds to `Number.isSafeInteger`.
- The predicates remain distinct and neither is scheduled for removal.
- `Num.Is.safeInt` is the canonical predicate for contracts that require safely representable
  integer arithmetic, indexing, counts, bounds, or cardinality.
- `Number.isInteger` remains the raw ECMAScript authority when the Num namespace is not required.

### Safe operational integer contracts

A Num operation may refine integer-valued inputs to safe integers when its arithmetic or output
contract requires that stronger domain. The refinement must be documented on that operation and
proved at its boundaries; it does not redefine every occurrence of “integer” in Num.

- `Num.MAX_INT` aliases `Number.MAX_SAFE_INTEGER` and is the upper bound of explicitly safe-integer
  contracts.
- `Num.MIN_INT` aliases `Number.MIN_SAFE_INTEGER` and is the lower bound of explicitly safe-integer
  contracts.
- “Maximum exactly representable integer” is not truthful wording and must not remain.
- General numeric operations retain ordinary IEEE-754 semantics unless their own contract states a
  narrower domain.
- There is no generic “safe float” contract.
- Discrete options such as precision, decimal count, numerator, and denominator receive
  operation-specific bounds; noun matching is not a substitute for semantic review.

### Published compatibility

`@sys/std@0.0.380` is the local and observed published baseline for this plan. The following routes
are shipped and remain stable in this campaign:

- `Num.Is.int` and `Num.Is.safeInt` as distinct predicates;
- direct `Percent` and nested `Num.Percent` as the same runtime object;
- `Random.number` as the documented exact alias of `Num.random`;
- `Num.Ratio` as the published positive aspect-ratio utility;
- `Num.toString` and `Num.toLetter` under their existing names.

Exact alternate routes do not imply duplicate implementation ownership. Absence of a repository
consumer is not authority to remove a published route.

## Durable authority and self-description

The first item establishes the general rules in:

1. `code/sys/std/src/m.Num/t.ts`
   - primary public contract authority;
   - native correspondence and operation-specific refinements at the relevant hierarchy/member.
2. `code/sys/std/src/m.Num/m.Num.ts` and `code/sys/std/src/m.Num/mod.ts`
   - concise runtime/module wording where it improves first inspection and generated JSR docs.
3. `code/sys/std/src/m.Num/-test/`
   - executable native-correspondence and boundary proof.

Before revising published JSDoc, inspect local package metadata and current live JSR documentation
under the canonical JSR documentation protocol. Never describe unpublished local changes as live.

## Baseline and defect boundary

Focused baseline before implementation:

```text
7 tests | 100 steps | 0 failed
```

That baseline proves current examples but misses these contract failures:

- `Num.random.int` accepts unsafe endpoints and can compute an inexact or unreachable inclusive
  range.
- `Num.Percent.Range.isRange([0, 1, 2])` returns `true` despite claiming a two-element tuple.
- Percent ranges admit non-finite or reversed endpoints.
- `Num.Ratio.toFraction(0.0339, 32)` returns `1/29` although `1/30` is closer.
- Ratio denominator options can produce invalid sentinels or unbounded linear work.
- Ratio GCD arithmetic narrows through signed 32-bit bitwise operations.
- `Num.toString` is host-locale display formatting, but that correspondence is not explicit enough
  in its public contract or tests.

The tracked `code/sys/std` source is clean at plan revision. The wider worktree contains unrelated
filesystem, server, and driver changes. No item in this plan may absorb those deltas.

## Item attribution

### Predicate correspondence

Intended paths:

- `code/sys/std/src/m.Num/t.ts`
- `code/sys/std/src/m.Num/m.Num.ts`
- `code/sys/std/src/m.Num/mod.ts`
- `code/sys/std/src/m.Num/-test/-.test.ts`

Excluded: all downstream consumers.

### Random integer ranges

Intended paths:

- `code/sys/std/src/m.Num/t.ts`
- `code/sys/std/src/m.Num/u/u.random.ts`
- `code/sys/std/src/m.Num/-test/-Num.random.test.ts`

Excluded: `code/sys/fs`, `code/sys/server`, and unrelated random utilities.

### Percent ranges

Intended paths:

- `code/sys/std/src/m.Num/t.ts`
- `code/sys/std/src/m.Num/m.Percent/m.Range.ts`
- `code/sys/std/src/m.Num/m.Percent/-test/-m.Range.test.ts`

Excluded: Percent normalization and unrelated UI consumers.

### Ratio approximation

Intended paths:

- `code/sys/std/src/m.Num/t.ts`
- `code/sys/std/src/m.Num/m.Ratio.ts`
- `code/sys/std/src/m.Num/-test/-Num.Ratio.test.ts`

Excluded: new namespaces and downstream packages.

### Display formatting

Intended paths:

- `code/sys/std/src/m.Num/t.ts`
- `code/sys/std/src/m.Num/u/u.string.ts`
- `code/sys/std/src/m.Num/-test/-.test.ts`

Excluded: production consumers and `toLetter` behavior.

If implementation evidence requires another path, stop and update the item boundary before editing.
Do not infer attribution from package proximity or a shared file.

## Item 1 — predicate correspondence

Target outcome: the public Num contract explains its relationship to ECMAScript without changing
predicate behavior or inventing a local integer dialect.

Required changes:

1. Document `Num.Is.int` as a type-guard correspondence to `Number.isInteger`.
2. Document `Num.Is.safeInt` as a type-guard correspondence to `Number.isSafeInteger` and the
   canonical predicate for explicitly safe operational contracts.
3. Preserve their current distinct runtime behavior.
4. Correct `MAX_INT` and `MIN_INT` documentation to identify exact native aliases and safe-contract
   bounds.
5. Add the native-correspondence rule to the public hierarchy.
6. Classify existing Num members without expanding the API:
   - constants are exact aliases;
   - `round` is a precision extension whose zero/default case corresponds to `Math.round`;
   - `random` is a distinct bounded/source-aware operation;
   - `toString` is display formatting rather than native radix conversion;
   - `Percent` and `Ratio` are Num-owned numeric domains.
7. Add no `Num.Is.nan`; current uses are already served by exact native `Number.isNaN`.

Required proof:

- truth-table correspondence for `int` and `safeInt` across:
  - `MIN_INT`, `MAX_INT`, and the immediately adjacent unsafe values;
  - positive and negative integers;
  - fractions;
  - `NaN` and both infinities;
  - strings, bigint values, objects, null, and undefined;
- exact constant identity with `Number.MIN_SAFE_INTEGER` and `Number.MAX_SAFE_INTEGER`;
- no changed production consumer and no runtime predicate delta; and
- generated/public docs remain truthful about local versus published state.

## Item 2 — exact random integer ranges

Target outcome: `Num.random.int` returns only reachable safe integers within a mathematically exact
inclusive range, with source-specific distribution claims.

Contract:

- `min` and `max` must be safe integers.
- Bounds are inclusive and must satisfy `min <= max`.
- Compute cardinality as exact integer arithmetic before converting any value used by a number-based
  source mapping.
- Cardinality must be positive and no greater than `Num.MAX_INT`.
- Every returned value must be a safe integer in `[min, max]`.
- A fixed range (`min === max`) returns that endpoint without consulting the source.
- The `crypto` source promises unbiased selection across the accepted range and therefore uses
  rejection sampling over an exact 53-bit integer source.
- `math` and custom sources inherit the distribution of their supplied `[0, 1)` unit source; Num
  promises correct bounded mapping, not cryptographic uniformity.
- Unsafe endpoints, oversized cardinality, unordered bounds, and invalid source output fail legibly
  through the existing TypeError/RangeError families.

Implementation constraints:

- do not compute cardinality first with `max - min + 1` in Number arithmetic;
- do not use `floor(unit * span)` for the `crypto` path;
- do not weaken custom-source validation;
- preserve the existing float overloads and their interval semantics; and
- keep `Random.number === Num.random` by identity.

Red-before-green proof:

- fixed endpoints and ordinary positive/negative/cross-zero ranges;
- both unsafe endpoint boundaries;
- exact cardinality at the accepted maximum and one step beyond it;
- a cross-zero range whose Number subtraction would round;
- custom source values `0` and the largest representable unit below `1`;
- invalid custom source values below `0`, at `1`, `NaN`, and infinity;
- crypto rejection boundary and output property tests; and
- alias identity through `Random.number`.

## Item 3 — truthful percent ranges

Target outcome: `Num.Percent.Range.isRange` proves the complete runtime contract claimed by
`t.MinMaxNumberRange` as used by this module.

Contract:

- input must be an array of exactly two elements;
- both endpoints must be finite numbers;
- endpoints must satisfy `min <= max`;
- equal endpoints remain valid and preserve degenerate-range behavior;
- invalid runtime ranges continue to normalize `toPercent` and `fromPercent` to `0` for published
  compatibility; and
- `toPercent` returns `t.Percent` in the public type contract.

Required proof:

- exact valid tuple, equal endpoints, and ordinary positive/negative ranges;
- missing, extra, non-number, `NaN`, infinite, and reversed endpoints;
- preserved invalid-range result `0`;
- unchanged clamping outside a valid range; and
- round-trip behavior for valid non-degenerate ranges.

Do not change general Percent string normalization, `Percent.Is`, or downstream UI behavior in this
item.

## Item 4 — truthful ratio approximation

Target outcome: retain the shipped `Num.Ratio` noun while making its positive aspect-ratio contract,
approximation claim, integer output, and invalid-input behavior true.

Stable compatibility:

- retain `Num.Ratio` rather than inventing `AspectRatio` without a consumer;
- retain positive finite input semantics;
- retain `parse` and `toFraction` invalid input → `undefined`;
- retain `toString` invalid input → `"0/1"` and document it explicitly as a compatibility sentinel;
- retain the default denominator of `32`, spacing option, and `maxError` option; and
- retain decimal `/1` fallback when a valid ratio is not represented as an accepted fraction.

Decided ratio contract and algorithm:

- `toFraction` accepts a positive finite number and a positive safe-integer `maxDenominator`; an
  invalid ratio or denominator returns `undefined`. `toFraction` and `toString` validate numeric
  ratios without coercion; `parse` remains the explicit string-conversion route.
- A result is a reduced pair of positive safe integers. For every valid positive finite ratio,
  including ratios outside the exact safe-integer magnitude, return the closest pair in that safe
  output domain rather than rejecting the ratio; the approximation may therefore be coarse.
- “Best” means minimum absolute IEEE-754 error among all such pairs with `den <= maxDenominator`.
  Equal errors select the lower denominator, then the lower numerator.
- Use bounded continued-fraction convergents and the final admissible semiconvergent, constraining
  both numerator and denominator before recurrence multiplication. This compares candidates without
  a linear denominator walk, never materializes an unsafe recurrence, and has at most 80 accepted
  recurrence steps under the safe-integer output bounds, before the Fibonacci lower bound exceeds
  `Number.MAX_SAFE_INTEGER`.
- Convergents and semiconvergents are already reduced; remove the signed 32-bit bitwise GCD path
  rather than replacing it with another reduction pass.
- A supplied `maxError` is valid only when finite and non-negative. It accepts a fraction only when
  its absolute error is at most the threshold; an invalid or unmet supplied threshold produces the
  decimal `/1` fallback, while an omitted threshold accepts the closest fraction.
- For a valid ratio with an invalid denominator option, `toString` uses the decimal `/1` fallback,
  not the invalid-ratio sentinel. A finite ratio must never become an `Infinity/1` fallback.

Required proof:

- exhaustive comparison against a simple small-bound oracle over positive numerator and denominator
  candidates, including the documented tie rule;
- regression for `0.0339` with denominator bound `32` → `1/30`;
- exact/common fractions, reduced output, and monotonic non-increasing approximation error as the
  denominator bound grows;
- zero, negative, non-finite, fractional, oversized, malformed, and non-numeric runtime ratio or
  denominator inputs;
- tiny and large positive finite ratios, safe-output guarantees, and the coarse safe-domain
  boundary;
- recurrence candidates beyond signed 32-bit magnitude without bitwise narrowing; and
- explicit invalid-ratio sentinel, denominator fallback, `maxError`, decimal-fallback finiteness,
  and spacing compatibility tests.

The continued-fraction bound is concrete for this item: no iteration is proportional to the caller's
denominator value. It does not block earlier arc items.

## Item 5 — display formatting semantics

Target outcome: retain the earned `Num.toString` surface while making its presentation semantics and
native correspondence explicit.

Contract:

- `Num.toString` formats human-facing display text with `Intl.NumberFormat` and the host-default
  locale.
- It is not `Number.prototype.toString`, serialization, or radix conversion.
- `value` continues to default to `0`.
- `maxDecimals` maps to `Intl.NumberFormat` maximum-fraction-digit semantics, including its
  operation-specific coercion/range behavior.
- No speculative `Num.format` alias is added.
- Existing production consumers remain unchanged.

Required proof:

- compare representative outputs to an independently created `Intl.NumberFormat` using the same
  documented options and host locale;
- avoid fixed English grouping/decimal assumptions;
- cover default value, integers, fractions, negative values, trailing zeros, and zero decimals;
- cover the selected operation-specific `maxDecimals` boundaries and failure behavior; and
- prove that `toLetter` behavior is untouched by this item.

## Explicitly deferred

These are known questions but are not earned implementation in this campaign:

- `Num.toLetter` non-finite, fractional, negative, and unsafe-index policy;
- `Num.round` precision bounds beyond documenting its native-extension relationship;
- `Num.Is.nan`;
- `Num.parseInt`, `Num.parseFloat`, and other native mirrors;
- removal or deprecation of direct `Percent`, `Num.Percent`, `Random.number`, or `Num.Ratio` routes;
- a branded safe-integer type;
- bigint, arbitrary-precision, or decimal arithmetic; and
- broad downstream predicate or spelling migration.

A deferred question must receive its own concrete consumer, compatibility decision, contract, and
proof before entering a later implementation arc.

## Verification

Use red → green → refactor for every behavior correction. If a red step is impractical, record the
exact reason before implementation.

Focused proof from `code/sys/std`:

```sh
deno task test --trace-leaks src/m.Num
deno task check
deno task dry
```

Also run the focused `m.Random` test when random identity or behavior changes:

```sh
deno task test --trace-leaks src/m.Random
```

Before closing each item:

- reopen the plan and complete touched public type surface;
- inspect every changed hunk against the item attribution boundary;
- inspect `git status --short`, `git diff`, and `git diff --cached`;
- preserve all unrelated worktree deltas;
- run `git diff --check`; and
- distinguish package-local proof from published JSR truth.

After all focused package proof is green, run workspace verification only when failures can be
attributed independently of unrelated worktree changes:

```sh
deno task check
deno task test
deno task dry
```

An unrelated broad-check failure does not become Num work. Record it with evidence and stop rather
than absorbing another campaign.

## Acceptance criteria

The plan is complete only when:

- native correspondence is recoverable from the public Num contract without this plan;
- `Num.Is.int` and `Num.Is.safeInt` preserve their distinct ECMAScript meanings;
- safe operational refinements name and prove their stronger requirements;
- `MAX_INT` and `MIN_INT` are documented as exact aliases and safe-contract bounds;
- `Num.random.int` uses exact cardinality, safe endpoints, reachable outputs, and truthful
  source-specific distribution semantics;
- Percent range guards prove exact finite ordered tuples while preserving published fallbacks;
- Ratio naming, complexity, approximation, output integers, and sentinels are truthful;
- `Num.toString` is documented and tested as host-locale display formatting;
- shipped alias identities and alternate routes remain intact;
- no deferred API or downstream migration leaks into the diff;
- focused std proof passes for every item;
- final workspace proof passes when it is attributable; and
- local source, package metadata, and reported publication state remain distinct.

## Non-goals

- no redefinition of `integer` across the Num namespace;
- no complete `Number` or `Math` facade;
- no compatibility cleanup disguised as ownership convergence;
- no new parser, predicate, formatting alias, numeric brand, or namespace;
- no consumer migration through currently dirty filesystem or server paths;
- no unrelated formatting or test cleanup;
- no package version bump, publication, release, staging, commit, or remote action inferred from
  this plan; and
- no implementation item may begin while its own semantic or computational bound remains unresolved.
