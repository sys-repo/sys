@sys
deno-api-containment.plan.md
- [x] 5d789e432 docs(sys): map Deno capability owners and public facades
- [x] b328700ab docs(sys): checkpoint direct Deno usage audit
- [ ] docs(sys): audit direct Deno usage across the repository
- [ ] docs(sys): design capability-sized Deno containment migrations

## Intent

Contain Deno coupling at intentional runtime boundaries so migration work lands at the owner, not
throughout its consumers. Prefer existing public `@sys` facades; do not build a parallel runtime
abstraction or chase a zero-match count.

This plan produces design documentation only: an owner map, a usage inventory, and a reviewed
migration design. Completing it does not authorize source changes, new facades, enforcement code,
configuration changes, or Git mutation. Each work pass and Git mutation needs explicit instruction.

## Commit shape and artifacts

The arc preserves three documentation outcomes: owner map, complete usage audit, and migration
design. The audit checkpoint records a partial delivery without satisfying or replacing the original
audit item. Plan creation and lifecycle commits remain separate from that arc.

Keep the governing plan beside its companion directory under `-agent/-plan/@sys/`:

```text
deno-api-containment.plan.md
deno-api-containment.plan/
  owners.md
  inventory.md
  inventory.candidates.md
  inventory.sites.md
  migration-design.md
```

Create each supporting document when its work begins; do not prefill unverified findings. The
companion directory is created with the first document. Proposed future source-code commits belong
in `migration-design.md`, not in this documentation-only arc.

## Scope

Audit all repository-owned content, including `code/`, `deploy/`, root and package scripts,
`.github/`, configuration, templates, tests, fixtures, samples, specs, and documentation. Include
tracked hidden paths and relevant untracked authored content; preserve unrelated open work.

Exclude `.git/`, `.pi/`, installed dependencies, caches, temporary runtime data, build outputs, and
vendored content. Record the exact exclusions and generated-source authorities. Do not silently skip
an authored hidden directory or an ignored source template. Do not collect secret values or read
`.env` files for this audit.

Generated output is changed only through its identified source authority. Distinguish executable
templates and embedded programs from inert teaching examples; neither is a parent-runtime call
merely because its text mentions Deno. Prioritize production consumers without silently dropping the
other categories.

## 1. Map capability owners

Deliver `deno-api-containment.plan/owners.md`, using live public exports, type contracts, and
implementation evidence. Record the repository revision and relevant worktree deltas.

For each discovered capability family, record:

- Deno operations and types;
- owning package, public import path, and actual facade symbols, or an explicit gap;
- exact internal adapter files that legitimately touch Deno;
- return, error, default, authority, lifecycle, and import-time behavior differences; and
- owner-level tests supporting the contract, with proof limits distinguished from executed results.

Start with filesystem/path/cwd, child processes and stdio, environment, terminal interaction,
networking/server operations, permissions, and test/runtime tooling. Discover additional families
from the scan rather than assuming this list is complete.

Being inside an owner package does not automatically legitimize every direct call. Separate the
adapter implementation from higher-level code that should compose its own primitives. Check that
adoption would not introduce an upward dependency, cycle, or eager host dependency into a portable
leaf.

## 2. Audit consumers

Deliver `deno-api-containment.plan/inventory.md`, with `inventory.candidates.md` preserving
historical discovery and current-set reconciliation, and `inventory.sites.md` recording
source-backed operations. Record baseline revision, exact search scope and commands, exclusions,
totals, and coverage limitations. Search results locate candidates; opened source establishes
classifications. Ledger records may group equivalent occurrences; neither record counts nor
candidate-file counts are repository-wide runtime-call totals.

Find runtime calls, property reads, type references, `typeof Deno`, optional/bracket access,
`globalThis.Deno`, aliases, destructuring, and Deno code embedded in fixtures or generated strings.
Trace aliases from their binding sites. A literal `Deno.*` search alone is not exhaustive.

Give every candidate a path plus stable owning symbol or location, capability, content category,
classification, target public facade when available, semantic risk, and brief justification:

| Classification               | Disposition                                                      |
| ---------------------------- | ---------------------------------------------------------------- |
| Owner implementation         | Retain within an evidenced adapter boundary.                     |
| Consumer bypass              | Schedule adoption of the verified public facade.                 |
| Facade gap                   | Record the concrete need and owner; do not invent an API.        |
| Runtime-specific integration | Retain only with a concrete contract or runtime reason.          |
| Unresolved                   | Investigate before deciding; never silently count as legitimate. |

Track public Deno type exposure separately from runtime usage. Tests, fixtures, templates, and docs
are content categories, not automatic exceptions. Native-behavior tests may legitimately retain
Deno; ordinary setup does not gain an exemption merely by living under `-test`.

End the inventory with evidence-backed candidate groups and unresolved questions for the migration
design. Facade gaps and public-type redesign are separate decisions, not assumed bypass cleanups.

### Evidence and review boundaries

The checkpoint preserves discovery and initial triage in the two original inventory documents, not
operation-level closure of the original audit scope. The continuation ledger records 151 grouped
records at its documented baseline. The inventory preserves the original 625-file discovery snapshot
and the reconciled 624-file set at `b328700ab`, not a claim about every later worktree. Keep
changing counts and detailed findings in those supporting artifacts, not as a second status ledger
here.

The supplied earlier blind review assessed the initial checkpoint in a bounded sample, not the later
151-record expansion. Its actual reviewer model and effort were not supplied; a recommended model is
not execution provenance. Its disposition is recorded in the inventory's review-adjudication section
and does not establish audit completion.

The subsequent supplied Claude reports were adjudicated against the documents and selected source at
`d84704d24`; its only committed delta from `b328700ab` is `-agent/-plan.buffer.md`. Their sampled
source observations do not establish repository-wide closure or runtime proof. Retain these bounded
consequences, not the review transcripts:

- **Accounting clarification accepted:** prose-reviewed operations outside the numbered ledger need
  record IDs or an explicit uncounted triage list. Distinguish ledger-reviewed, prose-reviewed but
  not normalized, and unopened candidates. The 151-record table is not an all-reviewed-site total;
  approximate reviewer file counts must not be added to operation counts.
- **Non-runtime clarification accepted:** A12 teaching text and A15 injected mock keys need explicit
  native-runtime disposition `n/a`, with their content categories preserved. Any retention rationale
  remains separate; the existing executable totals already exclude these two records.
- **Discovery omission rejected:** `inventory.candidates.md` already records the added Vite fixture
  and F25. Future blind packets must include baseline/current-set reconciliation while withholding
  prior verdicts. The historical-list-only packet was insufficient to judge current-set omissions.
- **Substitution objections bounded:** S06 removal remains U because absence/retry behavior differs.
  C32/C33 optional hooks retain the existing catch boundary; `Fs.stat` is not disqualified merely
  because it propagates other errors. `Fs.Is.file` is an alternative requiring preflight/race proof.
  W09 embedded CI reads and W20's owner decision are not resolved by reviewer preference or
  injection.

The external Claude review pilot is paused, not adopted as a routine dependency of this arc. Its
validated contribution is accounting clarity, not a new behavioral defect. Reported tool-boundary
deviations do not establish compliant execution; do not infer Git staging from device file copying.
No third broad review is scheduled. Further review must earn its cost through a named unresolved
question under existing Canon; no new framework, review gate, or arc item is introduced.

Any independent review must follow Canon's blind-review contract. Withhold previous verdicts and
adjudication, including this section and embedded review-history passages in supporting documents.
Required behavioral contracts and baseline reconciliation must remain available. Adjudicate findings
against source; reviewer agreement is not proof.

The later coverage review supplied ordinary production/type counterexamples to the completion claim;
see the source adjudication in [inventory.md](./deno-api-containment.plan/inventory.md).
Correcting those examples does not establish occurrence coverage. For audit closure, reconcile each
current candidate's executable, type, text and embedded-program roles to exact ledger selectors.
Verify residual Y/Q intersections and earlier-record precedence against mixed-role source; family
navigation and record arithmetic are not substitutes for that evidence. Refresh final totals and
source drift against the reconciled map. Ground the final migration design and its human review in
that inventory; an existing draft is not coverage proof. These are obligations within the original
audit/design items, not another checkpoint, review gate or source-migration authorization.

## 3. Design the migration

Deliver `deno-api-containment.plan/migration-design.md`, grounded in the owner map and inventory.
Produce a small ordered proposal, not source changes. For each discrete future step, specify:

- one exact Conventional Commit subject;
- capability, owning facade, consumer paths/symbols, dependencies, and explicit exclusions;
- semantic differences and how observable behavior and authority would be preserved;
- acceptance criteria, focused regression cases, and exact proposed owning check/test tasks; and
- remaining decisions, evidence limits, and conditions requiring a separate API-design item.

Prefer one future commit per capability with shared semantics and proof. Split only for independent
risk or ownership; avoid both an omnibus refactor and a commit per textual replacement. Omit empty
batches. Compare errors, defaults, missing resources, encoding, sync/async behavior, permissions,
stream ownership, cancellation, cleanup, and import-time/dependency effects.

If existing facades cannot preserve a consumer's behavior, report the concrete gap and lowest
truthful owner. Do not solve it with speculative wrappers, swallowed errors, broadened authority, or
weakened security. Propose shared API extensions only under canonical primitive-admission rules.

Include a regression-enforcement design: smallest existing tooling home, declared task and
integration point, narrow exceptions, stale-exception detection, and positive/negative fixtures.
Cover direct, bracket/global, and aliased access without treating comments or inert examples as
runtime calls. Separate runtime enforcement from public type exposure and state syntax/coverage
limits. Designing this check does not authorize building it.

Review the proposal with the human and resolve material findings in the design. Any later source
implementation needs a separately authorized implementation plan and instruction.

Known seed evidence, to revalidate during the audit:

- `code/sys/fs/src/m.Fs/u/u.read.ts`: `Fs.readText` returns a structured result, unlike throwing
  `Deno.readTextFile`; substitution must preserve the consumer's failure behavior.
- `code/sys/fs/src/m.Fs/u/u.remove.ts`: `Fs.remove` defaults to recursive removal, handles missing
  paths, and retries selected failures. Passing `recursive: false` alone does not prove equivalence.
- `code/sys/process/src/m.process/t.proc.ts`: process contracts distinguish bounded capture,
  inherited IO, owned-child cleanup, and ambient PID authority. Match those semantics explicitly.
- `code/sys/fs/src/m.Env/t.ts`: `Env.load({ search: 'none' })` provides asynchronous process-only
  get/has without dotenv discovery; missing values resolve to an empty string. It is not a
  demonstrated replacement for synchronous callers or every `Deno.env` operation.
- `code/sys/fs/src/m.Fs/t.ts` and `code/sys/std/src/m.Is/t.ts`: public contracts expose
  `Deno.FileInfo` and `Deno.NetAddr`. Alias containment is not type portability.

## Verification and completion

- Owner map: public facades and adapter boundaries are backed by opened source, not names alone.
- Inventory: every discovered candidate is classified; unresolved cases and coverage limits remain
  explicit. Every prose-classified operation maps to a ledger record or explicit uncounted triage
  entry; no such triage remains outside normalized accounting at closure. Keep non-native matches
  separate from runtime dispositions. Reconcile scope with the final revision/worktree state.
- Migration design: each proposed future step has a commit subject, bounded scope, semantic risk,
  acceptance criteria, and verification route; material review findings have a recorded disposition.
- Documentation proof: verify cross-references, task definitions, internal consistency, and
  exact-file formatting, preserving the canonical opening block. Inspect the target-attributed diff
  and confirm that only this plan and its supporting documents changed.
- No source tests or CI runs are required merely to deliver documentation. Inspect existing tests as
  evidence; label proposed commands and unexecuted proof truthfully. Do not claim runtime proof from
  source inspection or a dated report.
- Completion means the design is documented and reviewed, not that bypasses are removed, a guard
  exists, or remaining Deno use is all legitimate. Zero textual matches is not an acceptance
  criterion.

Supporting documents, created by their respective steps:

- [Owner map](./deno-api-containment.plan/owners.md)
- [Usage inventory](./deno-api-containment.plan/inventory.md)
- [Candidate manifest](./deno-api-containment.plan/inventory.candidates.md)
- [Operation ledger](./deno-api-containment.plan/inventory.sites.md)
- [Migration design](./deno-api-containment.plan/migration-design.md)

These links name planned deliverables, not claims that the documents already exist. Keep evidence
and review dispositions in the companion directory. The opening arc alone records landing state.

## Non-goals

- Source migration, new public APIs, enforcement implementation, or task/CI/configuration changes.
- Porting the repository to Node, Workers, or another runtime, or claiming compatibility there.
- Replacing Deno calls with Node calls to improve the count.
- A new universal runtime wrapper, speculative facades, or wholesale public type redesign.
- Migrating legitimate adapter internals away from the runtime capability they own.

The existing [runtime portability audit](./runtime-portability-audit.md) is dated background
evidence, not a prerequisite or adopted implementation plan. Revalidate relevant claims against live
source.
