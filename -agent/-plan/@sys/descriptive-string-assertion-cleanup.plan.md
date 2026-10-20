@sys
descriptive-string-assertion-cleanup.plan.md
- [ ] refactor(sys): remove redundant descriptive string assertions

## Run shape

This plan is one unattended maintenance run and one final implementation unit.

- one deterministic queue;
- one package at a time;
- no intermediate commits or staging;
- uncertain candidates are skipped and recorded, not escalated during the run;
- progress is persisted after every touched package;
- one final repository proof; and
- one final human-reviewed commit after the overnight run.

The package loop is internal execution, not a multi-commit campaign. The model must not stop for
ordinary classification questions. It chooses the conservative result, records the residue, and
continues.

## ELI5

A descriptive alias such as `t.StringUrl` is still plain `string`. It gives a contract a useful
name, but it does not validate or brand a value.

```ts
type StringUrl = string;
```

This assertion is certainty-shaped noise:

```ts
const href = url.href as t.StringUrl;
```

The cleanup removes that false certainty. It preserves the real signal on the contract:

```ts
function hrefOf(url: URL): t.StringUrl {
  return url.href;
}
```

The distinction is:

- descriptive alias → vocabulary;
- runtime parser or validator → evidence;
- branded, opaque, template-literal, or union type → compiler-visible distinction;
- assertion to a descriptive alias → neither evidence nor distinction.

The job is subtraction without flattening: remove non-signal, preserve contracts.

## Purpose

Remove redundant assertions into descriptive plain-string aliases throughout this repository while
preserving runtime behavior, public type vocabulary, contextual typing, literal inference, readonly
contracts, tests, fixtures, and generated-source authority.

This is **low-reasoning, high-proof** work. It is suitable for a lower-cost coding model because the
run never guesses through ambiguity. Mechanical cases are fixed; every other case is left unchanged
and reported.

## Canonical authority

The sole governing rule is
[`../sys.canon/-canon/protocol.lang.md`, `### Descriptive Plain-String Aliases`](../../../../sys.canon/-canon/protocol.lang.md#descriptive-plain-string-aliases).

The executor must reopen that exact live section:

1. before the run;
2. after every context compaction, restart, or model handoff; and
3. before final closure.

The canonical anchor for this plan is
`cc6ab881f8e47109ed917047ff29bcda7c3c701e docs(canon): clarify descriptive plain-string aliases`. Do
not launch unless that commit is reachable from `../sys.canon` and the live section still contains
the same rule. Record both the anchor and current canon `HEAD` in the run report before source
edits. Do not execute from this plan's summary when the live canon section is missing or materially
different.

The binding rule is:

- a descriptive alias resolves transitively to plain `string`;
- the alias supplies domain vocabulary, not validation or nominal identity;
- put the semantic name on the owning contract, not a cast on the produced value;
- an assertion from a known string is redundant;
- an assertion from an unproven value bypasses narrowing or validation; and
- branded and opaque types, intersections, template-literal types, unions, and genuine external
  interop contracts are outside this cleanup.

The branded-type contrast is absolute:

> Descriptive aliases and branded strings are different contracts. A descriptive alias names intent
> while remaining plain `string`. A branded string adds a compiler-enforced distinction; only its
> canonical validation or construction boundary may establish the brand. Branding does not itself
> validate at runtime.

## Baseline

The principal declaration authority is
[`code/sys/types/src/t/t.String.ts`](../../../code/sys/types/src/t/t.String.ts). Its module contract
states: “Descriptive type alias only; no runtime validation.” Every alias currently declared there
resolves directly or transitively to plain `string`.

A seed search from repository root observed **1,434 matches across 358 files**:

```sh
rg --stats --count-matches -g '*.ts' -g '*.tsx' -g '*.mts' -g '*.cts' '\bas\s+(?:readonly\s+)?t\.String[A-Za-z0-9_]*(?:\[\])?' code deploy -scripts
```

That is a candidate count, not an edit target. Search syntax cannot establish type semantics.

## Scope

Included:

- TypeScript and TSX beneath `code/`, `deploy/`, and repository `-scripts/`;
- tests, fixtures, samples, specs, and package scripts;
- `code/-tmpl` source templates; and
- generated files only through an identified template or generator authority.

Excluded:

- `../sys.canon` beyond reading the committed rule;
- branded, opaque, intersection, template-literal, union, conditional, generic, and external interop
  contracts;
- `as const`, non-null assertions, and assertions unrelated to descriptive plain-string aliases;
- vendored, cached, dependency, build-output, and `.pi` content;
- Markdown examples outside this plan and its run report;
- lockfile, dependency, runtime-validation, branding, and behavior changes; and
- unrelated or concurrently owned worktree deltas.

Tests and fixtures are included because they are part of the repository's teaching surface.

## No-signal-loss invariant

The cleanup removes false certainty, not semantic vocabulary.

1. **Runtime expressions do not change.** No literal, argument, property key, call, branch,
   ordering, parser, coercion, or normalization may change.
2. **Public vocabulary remains explicit.** Move an alias from an exported expression only through an
   exact owner-move shape documented below; otherwise retain it as `OWNER_DESIGN_REQUIRED`.
3. **Branded types are untouched.** A `StringX` name or string runtime value is never proof of
   plain-string eligibility.
4. **Inference is preserved.** Do not alter literal, tuple, readonly, generic, overload,
   conditional, or discriminant behavior.
5. **No bypass replaces a bypass.** Do not introduce `as string`, chained assertions, `any`,
   `unknown` bridges, `@ts-ignore`, or `@ts-expect-error`.
6. **No validation is invented.** An unproven source is retained for later human review.
7. **Generated authority comes first.** Edit and regenerate from the source authority or skip the
   candidate.
8. **No incidental cleanup.** Do not rename, reorder, reformat surrounding code, or refactor
   adjacent implementation.
9. **Uncertainty is residue.** Leaving a candidate unchanged is correct when mechanical safety is
   not proven.

A compile pass is necessary but cannot prove signal preservation: plain-string aliases are mutually
assignable, so TypeScript cannot detect when an inferred public declaration loses its semantic name.

## Eligibility rule

A candidate is mechanically eligible only when all of these are visible from the live source:

- its exact target declaration chain is local and readable;
- every alias hop resolves to the primitive `string`;
- no hop introduces a brand, opaque marker, intersection, template literal, union, conditional,
  generic constraint, or external type;
- the source expression is already known to be a string; and
- the assertion performs no separate interop or inference function.

The aliases in `code/sys/types/src/t/t.String.ts` are the canonical baseline. Additional aliases may
be used only after their exact declaration chain is recorded in the run report.

Names are not evidence:

- `StringPkgName = string` is descriptive;
- `StringDir = StringPath` is descriptive only because `StringPath = string`;
- `StringScopedPkgName` is a template-literal contract and is excluded;
- `TextUpdate.StringOffset = number` is excluded despite its name; and
- branded strings are excluded even though their runtime values are strings.

Trace `t.StringX` through the call site's actual local `t` pool. Do not assume that equal names in
different namespaces identify equal contracts.

## Mechanical decision table

| Observation                                                                                | Action                                                      |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Known string; alias adds no owner-level signal                                             | Remove the assertion                                        |
| Exact contextual owner already carries the alias                                           | Remove only the assertion                                   |
| Candidate has one exact owner-move shape shown below                                       | Move the alias exactly as shown                             |
| Choosing an owner would require design judgment                                            | Leave unchanged; report `OWNER_DESIGN_REQUIRED`             |
| Source is `unknown`, generic, external, or not narrowed to string                          | Leave unchanged; report `UNPROVEN_SOURCE`                   |
| Target is branded, opaque, intersection, template-literal, union, conditional, or external | Leave unchanged; report `NON_PLAIN_TYPE`                    |
| Owner annotation may alter inference                                                       | Leave unchanged; report `INFERENCE_RISK`                    |
| Generated authority is unknown                                                             | Leave unchanged; report `GENERATED_AUTHORITY`               |
| Candidate overlaps unrelated work                                                          | Leave unchanged; report `CONCURRENT_DELTA` and stop the run |

No ordinary row requires human interaction during the overnight run. The conservative rows are
expected outcomes, not failures.

### Closed auto-edit envelope

The unattended model may edit only these four cases:

1. remove an assertion when an existing variable annotation, function return, parameter contract, or
   `satisfies` owner already carries the exact alias;
2. remove an assertion from a non-exported local scalar whose source is visibly a string and whose
   alias carries no owner-level signal;
3. apply the exact scalar, function, exported-value, or collection owner move shown below without
   changing any neighboring type; or
4. remove a type-only import made unused solely by one of the first three cases.

Anything else is residue. In particular, do not choose an owner for a nested exported object,
overload, generic, callback, union, conditional, tuple, or multi-property inference surface. Record
`OWNER_DESIGN_REQUIRED` or `INFERENCE_RISK` and continue.

## Allowed transformations

### Scalar

```ts
// Before:
const href = url.href as t.StringUrl;

// After, when no local contract annotation is useful:
const href = url.href;
```

### Function contract

```ts
// Before:
export const hrefOf = (url: URL) => url.href as t.StringUrl;

// After:
export const hrefOf = (url: URL): t.StringUrl => url.href;
```

If the function already declares `t.StringUrl`, remove only the assertion.

### Exported value

```ts
// Before:
export const href = url.href as t.StringUrl;

// After:
export const href: t.StringUrl = url.href;
```

### Collection owner

```ts
// Before:
const paths = [] as t.StringPath[];
const origins = [] as readonly t.StringUrl[];

// After:
const paths: t.StringPath[] = [];
const origins: readonly t.StringUrl[] = [];
```

Preserve mutable versus readonly intent exactly.

### Existing contextual owner

When a variable annotation, function return, parameter type, or existing `satisfies` contract
already provides the intended context, remove redundant property assertions without replacing them.

Do not add a broad object annotation when it would alter inference elsewhere. Leave that candidate
as `INFERENCE_RISK`.

## Forbidden transformations

Do not:

- replace `as t.StringX` with `as string`;
- remove or forge a branded or opaque assertion;
- alter a type declaration to make a candidate eligible;
- add `String(value)`, interpolation, parsing, normalization, or runtime guards;
- introduce `satisfies` merely to eliminate an assertion;
- widen an exported alias to inferred `string`;
- change mutable and readonly collection contracts;
- alter fixture values or test expectations;
- edit generated output without source authority;
- remove a runtime import; or
- make unrelated formatting, lint, API, naming, or style changes.

A type-only import may be removed only when it became unused solely through this cleanup. Do not
reorder remaining imports.

## Overnight execution

### Clean launch

The run starts only in a human-provided clean, isolated worktree containing this plan and the
committed canon rule.

Before edits:

1. reopen the plan and canon section;
2. require `git status --short` to be empty;
3. create `-agent/-plan/@sys/descriptive-string-assertion-cleanup.run.md` with the repository base
   commit, canon anchor, current canon `HEAD`, execution model, declaration allowlist, and complete
   package queue;
4. run `deno task ci` from repository root as the full baseline proof; and
5. record the exact baseline result in the run report.

If the worktree is dirty or baseline CI fails, do not start. Never stash, reset, clean, switch,
checkout, or create a branch/worktree without explicit human authorization.

### Deterministic queue and internal canary

Run this canary first, in order:

1. `code/sys/types` — contract and type-test signal;
2. `code/-tmpl` — future generated-source authority; and
3. `code/sys/fs` — representative production path and collection usage.

Process each canary member with the normal package loop below. After each canary member, also run
`deno task check` from repository root. If that root check fails, precisely restore the current
canary member, rerun its proof and root check, record the restoration, and stop. A failed canary
means the transformation policy is not safe enough for the full queue.

After all three canaries pass, process the remaining members in the root `deno.json` workspace
order, skipping the already completed canaries. Process repository `-scripts` last.

For each queue member:

1. search only that member for candidates;
2. if none exist, append `NO_CANDIDATES` and continue;
3. read each target declaration chain not already in the allowlist;
4. append a `STARTED` checkpoint before the first source edit;
5. apply only transformations inside the closed auto-edit envelope;
6. leave every uncertain candidate unchanged and append one residual row;
7. reopen each changed file and inspect every hunk;
8. inspect the member's declared tasks, then run `check` and `test` when present;
9. for each absent task, record `TASK_ABSENT`; when `check` is absent, run `deno task check` from
   repository root after that member;
10. run `git diff --check` from repository root;
11. append the member result and exact proof to the run report; and
12. continue immediately to the next member.

Do not stage or commit during the queue. Do not run a repository-wide replacement. Search locates
candidates; declaration reads, precise edits, and proof decide them.

### Append-only checkpoint journal

Create the run-report header and ordered queue once. After every queue member, append one immutable
checkpoint block containing:

- package path and status: nonterminal `STARTED`, or terminal `NO_CANDIDATES`, `COMPLETE`,
  `SKIPPED`, or `RESTORED`;
- candidate, removal, owner-annotation, and residual counts;
- exact package proof commands and observed results; and
- residual rows keyed by path plus owning declaration or stable symbol.

Never rewrite, delete, reorder, or silently correct an earlier checkpoint. Append a superseding
block that names the earlier block and reason when a correction is necessary. Update the report
through read/edit/write tools; never use shell redirection or an ad hoc script.

The journal is the restart checkpoint. It is not permission to infer Git state. A queue member is
complete only when its latest checkpoint block has a terminal status. Use `SKIPPED` when candidates
exist but every candidate is retained as residue; use `RESTORED` when attempted edits were precisely
removed after failed proof. At most one member may have latest status `STARTED`.

After compaction, restart, or handoff:

1. reopen this plan, live canon, and complete run journal;
2. inspect `git status --short`, `git diff`, and `git diff --cached`;
3. derive package state from each member's latest checkpoint block;
4. confirm that observed changes match terminal `COMPLETE` members plus at most the one `STARTED`
   member;
5. resume the `STARTED` member when present, otherwise the first member without a terminal
   checkpoint; and
6. never rely on a compacted summary for exclusions or progress.

### Package failure

If a package check or test fails after edits:

1. repair only an obvious mistake inside the closed auto-edit envelope;
2. otherwise restore every change made in that package using precise file edits;
3. rerun the package proof;
4. append a `RESTORED` checkpoint with the exact failure; and
5. stop when the package is a canary, otherwise continue to the next package.

Do not use Git reset, checkout, restore, stash, or clean as rollback tools.

If precise restoration is not possible, or the restored package still differs from its launch state,
stop the run. Safety outranks overnight throughput.

### Hard stops

Stop the unattended run only when:

- the plan, canon, or run report cannot be reopened;
- the worktree contains unexplained or concurrent changes;
- the full baseline CI failed before edits;
- a canary package or its root check failed after precise restoration;
- a change would alter runtime code, fixture data, or a branded/non-plain contract;
- a package cannot be restored precisely after failed proof;
- sandbox, provenance, signing, dependency, or policy enforcement fails; or
- repository state no longer matches the checkpoint report.

Do not stop merely because an individual candidate is ambiguous. Record it and continue.

## Run report contract

The run creates one sibling artifact:

```text
-agent/-plan/@sys/descriptive-string-assertion-cleanup.run.md
```

It records:

- repository base commit;
- canon anchor, current canon `HEAD`, and exact heading;
- execution model;
- exact search commands;
- declaration allowlist with source paths;
- deterministic package queue;
- append-only checkpoint blocks;
- package proof commands and observed results;
- aggregate transformation counts; and
- every retained candidate with package, path, owner, target type, classification, and terse reason.

Do not identify residue by line number alone. Lines drift during cleanup. Use path plus an owning
symbol or nearest stable declaration.

Removed candidates need aggregate counts, not one row each. Every remaining closure match must have
a residual row or be proven outside scope.

## Final closure

After the queue completes:

1. reopen the canon rule;
2. run all closure searches;
3. reconcile every remaining match with the run report;
4. inspect every changed hunk against the allowed transformation set;
5. run `deno task ci`;
6. append the CI result, closure totals, and final residual totals to the run journal;
7. run the final report-format and diff checks shown below; and
8. make no further edits before stopping with the completed worktree for human review.

Do not stage or commit. The human may authorize the single final commit after reviewing the diff and
run report.

Run these closure searches from repository root:

```sh
rg -n -g '*.ts' -g '*.tsx' -g '*.mts' -g '*.cts' '\bas\s+(?:readonly\s+)?t\.String[A-Za-z0-9_]*' code deploy -scripts
rg -n -g '*.ts' -g '*.tsx' -g '*.mts' -g '*.cts' '\bas\s+(?:readonly\s+)?String[A-Z][A-Za-z0-9_]*' code deploy -scripts
rg -n -g '*.ts' -g '*.tsx' -g '*.mts' -g '*.cts' '\bas\s+(?:Array|ReadonlyArray)<[^>]*String[A-Z][A-Za-z0-9_]*' code deploy -scripts
rg -n -g '*.ts' -g '*.mts' -g '*.cts' '<t\.String[A-Za-z0-9_]*>' code deploy -scripts
```

After recording the final CI result, run these final checks from repository root:

```sh
deno fmt --check -- -agent/-plan/@sys/descriptive-string-assertion-cleanup.run.md
git diff --check
git status --short
```

Completion does not require zero textual matches. It requires:

- the queue has no `PENDING` members;
- zero unclassified matches;
- zero mechanically eligible assertions left for convenience;
- every retained match is represented in the run report;
- public semantic aliases remain on owning declarations;
- branded and other non-plain types are untouched;
- generated outputs align with their authority;
- package and repository proof is green; and
- the diff contains no unrelated or runtime-bearing change.

If final repository proof fails, record the exact failure and stop without claiming completion or
attempting unrelated repairs.

## Required post-run review

Before the final commit, review the completed run as a falsification pass rather than trusting its
volume or green checks:

- inspect every exported owner move, not a sample;
- inspect at least one changed hunk from every other transformation class and every top-level
  package family;
- reconcile all remaining search matches against the append-only journal;
- confirm branded and other non-plain declarations were not changed;
- confirm generated outputs trace to changed template or generator authority;
- confirm the initial and final `deno task ci` results are both recorded and green; and
- reject the run if any hunk cannot be explained by the closed auto-edit envelope.

Review completion does not authorize Git mutation. The final commit still requires an explicit human
instruction and an available signing path.

## Final diff audit

Every changed hunk must be exactly one of:

- deleting a redundant descriptive-alias assertion;
- moving the alias to an owning type annotation;
- preserving mutable or readonly collection context through an owner annotation;
- removing a newly unused type-only import; or
- updating an identified template/generator and its generated output.

Reject any hunk that changes a runtime token, string value, property key, control-flow edge,
function call, argument order, public member, fixture value, test expectation, or unrelated
formatting.

## Non-goals

- no intermediate commits or staging;
- no conversion of descriptive aliases into brands;
- no removal or weakening of brands;
- no runtime validation campaign;
- no path, URL, hash, identifier, or package-name semantics redesign;
- no inferred public API simplification from `t.StringX` to `string`;
- no repository-wide formatter pass;
- no unrelated import or style cleanup;
- no generated-file edit without authority;
- no forced zero-match target; and
- no Git mutation inferred from this plan or from overnight execution intent.
