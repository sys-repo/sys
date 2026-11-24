# Account-contract execution receipt

Scope: `feat(passkey): define account service contracts`, governed by
[passkey-panel.plan.md](../passkey-panel.plan.md). This records execution from the implementing
session, not new execution during documentation reconciliation or an independent post-fix review.

## Source boundary

- Execution baseline: HEAD `19dc218dd01fc119570b11526b591e72750c905f` plus the attributable account
  contract/core-UI partition worktree delta, including untracked files.
- Resulting source landing: `c7e4d66861b659280e480d90a98ec044a17c7cd9`. Its passkey/package source
  matches the inspected post-correction worktree. This is **not** a claim that the commands below
  ran in an isolated checkout of that commit.
- Delta: new `m.Accounts` types/readers/schemas/docs/tests; UI-independent common/type lanes;
  specimen navigation/link and shared-test helper relocations; boundary tests and consumer import
  updates. No service, runtime, HTTP implementation, verifier dependency, or public export was
  added.
- The final correction touched `m.Accounts/t.ts`, `m.Accounts/u.schema.ts`,
  `m.Accounts/-test/-wire.test.ts`, and `m.Accounts/-test/-consumer.test.ts`: three registration
  response members became required in both declaration and admission; `publicKey` stayed optional.
- Unrelated dirty template sources, generated template bundle, plans, and tests were present and
  were not edited for this increment. No complete hash-indexed snapshot of that wider dirty tree was
  captured. Dependency authority/projections, package metadata, lockfile, and owning-module config
  had no diff in the recorded final checks.

Paths above are relative to `code/sys.ui/ui/-sample/passkey/` unless otherwise named. The source
landing is the recovery anchor for the full delta; a file count is not its identity.

## Red evidence

Execution cwd: `/Users/phil/code/org.sys/sys/code/sys.ui/ui`.

```sh
deno task test --trace-leaks ./-sample/passkey/m.Accounts/-test/-wire.test.ts
deno task test --trace-leaks ./-sample/passkey/m.Accounts/-test/-consumer.test.ts
```

These were separate pre-correction runs:

- Wire test: 10 steps passed and the required-member step failed because `account.create.finish`
  still admitted a response missing `authenticatorData`. The loop stopped at that first failing
  assertion; this red does not claim every omission was executed before the fix.
- Consumer test: typechecking failed with three optional-member assignment errors and three unused
  `@ts-expect-error` directives, exposing all three permissive declarations. This is compile-time
  evidence, distinct from the behavioral red.

The initial module-creation red was only missing-module compilation. Canonical Num/Obj substitutions
preserved behavior; no separate red is claimed for them.

## Green evidence

Same cwd, after the required-member correction:

```sh
deno task test --trace-leaks ./-sample/passkey/m.Accounts/-test ./-sample/passkey/-test/-boundary.test.ts
deno task test --trace-leaks ./-sample/passkey
deno task check
deno task test
deno task dry
```

Outcomes in command order:

1. 3 suites / 18 steps passed.
2. 11 suites / 117 steps passed with leak tracing.
3. Owning-module typecheck passed.
4. 20 suites / 192 steps passed.
5. Publication simulation passed; sample code remained excluded from publishing.

For both registration finish commands, the green wire cases independently reject omission of each
required member, accept empty transports and omitted public keys, and reject null for those members
and `publicKey`. Compile-time consumers access the required members without fallback narrowing and
reject each incomplete response shape.

Exact final correction checks, from the same cwd:

```sh
deno fmt --check ./-sample/passkey/m.Accounts/t.ts ./-sample/passkey/m.Accounts/u.schema.ts ./-sample/passkey/m.Accounts/-test/-wire.test.ts ./-sample/passkey/m.Accounts/-test/-consumer.test.ts
deno lint ./-sample/passkey/m.Accounts/t.ts ./-sample/passkey/m.Accounts/u.schema.ts ./-sample/passkey/m.Accounts/-test/-wire.test.ts ./-sample/passkey/m.Accounts/-test/-consumer.test.ts
```

Both passed for four files after one surgical line-wrap correction. Earlier increment-wide records
reported formatting of 33 source/documentation files and lint of 32 sources; those counts are not a
replacement for the exact final-correction commands above.

Final observations from `/Users/phil/code/org.sys/sys`:

```sh
git diff --check
git diff --stat -- deps.yaml imports.json deno.lock package.json code/sys.ui/ui/deno.json
git diff --cached --stat
```

No whitespace error, listed dependency/config delta, or staged delta was emitted. Tracked Git diff
checks do not cover untracked bytes; the Deno checks explicitly included the new account sources.
The governing plan's formatter objection was its required two-line identity header, not a source
formatting failure.

## What this establishes

The checks establish structural wire admission, native option typing, operation-specific outcomes,
forbidden selector/secret fields, numeric boundaries, exhaustive client handling, core/UI
separation, and regression compatibility of the existing sample. The supplied blind review found the
required-member defect; the implementing session corrected and tested it without claiming another
independent review.

They do not establish real authentication, generator/verifier interoperability, challenge
single-use, atomic commits, bounded HTTP execution, live mutation-isolated runtime observations,
BFCache behavior, real browser/authenticator/AT acceptance, or service-line-budget feasibility.
Those remain the explicit acceptance obligations of their later owners.
