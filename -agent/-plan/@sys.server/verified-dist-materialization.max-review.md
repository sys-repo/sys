verified-dist-materialization.max-review.md

## Authority

This is the non-authoritative review protocol for the
[verified Dist materialization plan](./verified-dist-materialization.plan.md). The governing plan is
the sole source of implementation truth, commit order, and status. Review findings change the arc
only through an explicit reconciliation of that plan.

Reviewing authorizes no implementation edit, test run, staging, or commit. The human retains staging
and commit ownership.

## Existing Claude review

The initial Claude/Opus 5 architecture review is complete and adjudicated. Its output remained
unread until the independent MAX architecture baseline below was recorded; the resulting chronology
and decisions are preserved in the Phase A and Phase B records.

That review was **not an extra gate**. Although it launched before this file existed, it became the
external input to [Gate 1](#gate-1-architecture-closure). The human copied the architecture prompt
from the preceding conversation into Claude.

The [reference brief](#reference-brief-for-the-completed-claude-review) below is a normalized record
of that prompt's intent. It is not claimed to be a byte-for-byte transcript of the text pasted into
Claude. Any separately retained exact launch text and response remain provenance evidence; they do
not create a second governing plan.

## Proportionate review model

There are two formal gates:

1. **Architecture closure:** run one independent MAX audit, adjudicate the completed Claude review,
   then freeze the governing plan.
2. **Final arc closure:** run one complete internal audit and one independent final Opus review.
   Rerun only proof affected by accepted findings.

Each commit still receives normal owner tests, checks, semantic diff review, and relevant residue
proof. That is ordinary engineering acceptance, not another MAX gate.

A clean review is a valid pass. Do not create additional review loops, abstractions, or findings to
demonstrate diligence. Reopen architecture after Gate 1 only for a concrete blocker or a human
design change.

## Shared standard

Review these protected outcomes:

```text
externally pinned remote Dist reference
  → bounded authenticated acquisition
  → immutable verified local generation

verified immutable generation
  → separately pinned and checksum-bound local hosting

generic GitHub release/repository source
  → useful bounded and confined generic download
  → no verified-Dist claim without external artifact authority
```

Require:

- exact caller-supplied external manifest integrity for verified Dist;
- explicit finite network, origin, credential, retry, concurrency, byte, time, and progress
  authority;
- Rooted staging, authenticated bytes, no-clobber publication, complete verification, immutable
  success, truthful cancellation, cleanup, and worker quiescence;
- one ordinary verified-Dist authority model with no easier URL-only, optional-integrity,
  raw-directory, injected-transport, overwrite, alias, or compatibility route;
- first-class generic GitHub release/repository APIs whose weaker trust semantics are explicit;
- a small API whose ceremony is justified by concrete protection or repeated-use DX.

Do not attempt to prohibit deliberate use of generic Fetch or filesystem APIs. Do not preserve a
weaker Dist route merely because it has tests or a compatibility name.

## Gate 1: Architecture closure

### Phase A — independent MAX baseline

Run this before reading the completed Claude response:

```text
MAX ARCHITECTURE CLOSURE — VERIFIED DIST MATERIALIZATION

Review only. Make no implementation edit.

Read repository canon, the governing materialization plan, the downstream local hosting plan, fresh
history for every landed plan commit, and current public types, runtime exports, implementations,
tests, scripts, config, documentation, samples, and production consumers for Fetch, HttpPull,
Rooted, Pkg.Dist, @sys/server, @sys/tools/pull, generic GitHub pull, Cell, and Dist serving.

Define the protected outcomes and enumerate every realistic public, configured, documented,
aliased, indirect, or compatibility route to them. For each route record:
- external integrity and trust root;
- network/resource authority;
- target confinement, collision, staging, publication, verification, and immutability;
- cancellation, quiescence, cleanup, and evidence truth;
- shortest realistic caller example and discoverability;
- whether generic output can be laundered into a verified-Dist claim.

Answer:
1. Is the easiest ordinary Dist path the secure path?
2. Can integrity, bounded policy, Rooted ownership, owned transport, verification, or staging be
   omitted or selected away?
3. Do aliases, overloads, config, CLI, examples, scripts, tests, or indirect consumers preserve a
   lower-authority route?
4. Does generic GitHub pull remain useful without masquerading as verified Dist?
5. Which proposed factories, brands, wrappers, namespace splits, or scanners provide concrete
   protection or repeated-use DX, and which are ceremony?
6. What is the smallest coherent API and atomic commit order?

Return:
A. protected outcomes and trust roots;
B. route/authority matrix;
C. BLOCKER / WORTHWHILE / UNNECESSARY / DEFER findings with repository evidence;
D. concrete first-use, repeated-use, GitHub-release, and GitHub-repo call sites;
E. recommended public API and commit order;
F. negative closure proof and unresolved human decisions;
G. readiness verdict and confidence.

A clean category is valid. Do not manufacture novelty or reopen landed foundations without concrete
evidence.
```

Record the result before opening Claude's response.

### Reference brief for the completed Claude review

```text
INDEPENDENT ARCHITECTURE REVIEW — SECURE DIST + GENERIC GITHUB PULL

Review only. Read repository canon, the governing materialization plan, downstream hosting plan,
current implementation, and consumers.

Determine whether Sys can expose one small, secure-by-default verified Dist authority while
retaining first-class programmatic GitHub release/repository pulling that is useful, bounded, and
honest about not being verified Dist authority.

Non-negotiable:
- retain generic GitHub release/repository Pull;
- do not force generic GitHub downloads through verified Dist semantics;
- do not preserve URL-array/raw-directory HttpPull under an alias, adapter, private copy, or
  compatibility name;
- do not make verified-Dist integrity optional or derive its pin from the same network acquisition;
- do not mutate authenticated bytes and continue to present them as verified;
- do not attempt to prohibit arbitrary raw Fetch/filesystem use;
- do not add factories, brands, builders, scanners, or package splits without concrete protection or
  DX value.

Inspect HttpPull, HttpFetch, Rooted, Pkg.Dist verification naming, planned Server composition, Tools
HTTP/GitHub flows and config, generated manifests, clear/write/rewrite behavior, Cell guidance, and
known Dist-serving call sites.

For each operation distinguish bounded network work, source/credential authority, target
confinement, overwrite behavior, content checksum, external artifact authority, immutable staging,
and complete-tree verification.

Return an executive verdict; evidence-backed BLOCKER / WORTHWHILE / UNNECESSARY / DEFER findings;
compact API and caller examples; guarantee matrix; autocomplete/misuse and security-theater review;
minimal atomic commit order; negative proof obligations; strongest alternative; and final
recommendation. A clean pass is valid.
```

### Phase B — adjudicate Claude

After Phase A is recorded, read the complete Claude response. For each finding:

1. restate the concrete claim;
2. confirm or refute it from repository evidence;
3. compare it with the independent baseline;
4. classify `ACCEPT`, `REJECT`, `DEFER`, or `NEEDS-HUMAN-DECISION`;
5. state the smallest correction, protection gained, DX effect, owner, and proof;
6. reject unsupported novelty, compatibility residue, and ceremony.

Do not decide by reviewer agreement. Explicitly record issues found by only one review.

### Phase C — freeze the plan

Gate 1 passes when:

- every blocker is resolved or returned to the human;
- verified Dist has one selected authority model;
- generic GitHub Pull has an explicit retained contract and honest guarantee boundary;
- concrete first-use and repeated-use call sites are accepted;
- the governing plan reflects the selected API, commit order, and negative proof;
- no pending implementation is authorized by obsolete compatibility text.

After this point, stop architecture review unless implementation exposes a concrete blocker.

## Per-commit engineering discipline

This is not a formal gate and requires no separate MAX report. Before requesting staging or commit
authorization, inspect the exact candidate diff, affected public contracts/exports, changed
tests/docs/config, direct production consumers, and focused proof.

Confirm that:

- the diff owns exactly the governing-plan item;
- the easiest affected call site follows the frozen authority model;
- no removed overload, alias, config, helper, test, example, script, or private copy survives;
- generic GitHub Pull remains available and gains no false verified-Dist claim;
- affected bounds, cancellation, quiescence, publication, cleanup, and evidence remain truthful;
- every added abstraction earns concrete protection or repeated-use DX;
- owner proof is green and unrelated worktree content is excluded.

Record this in the commit's ordinary verification summary. Do not repeat the full architecture audit
or manufacture polish churn.

## Gate 2: Final arc closure

Run after every reconciled implementation commit has landed.

### Phase A — internal final closure

```text
MAX FINAL CLOSURE — VERIFIED DIST MATERIALIZATION

Review final repository state, fresh history, the governing plan, and complete landed semantic diffs.
Do not rely on commit messages or earlier summaries.

Reconstruct end-to-end caller journeys for:
- pinned remote Dist → immutable verified generation;
- existing/concurrent-winner generation → freshly verified success;
- generic GitHub release Pull;
- generic GitHub repository Pull;
- Tools and Cell consumers;
- handoff to pinned local hosting.

Once, at final scope:
- enumerate all public/configured/documented routes to those outcomes;
- run easiest-path, alias, optionality, laundering, indirect-consumer, post-verification mutation,
  and residue checks;
- verify bounds, credentials, cancellation, quiescence, staging, publication races, complete
  verification, cleanup, sanitized evidence, and type/runtime parity;
- assess first-use and repeated-use DX;
- remove only evidence-backed complexity or residue;
- run focused and full affected-owner tests/checks/publish proof in dependency order.

Return the final route/authority matrix, caller examples, blockers, verification evidence, residual
non-goals, and readiness for independent Opus review. A clean pass is valid.
```

### Phase B — final Opus implementation review

Use Opus 5 at maximum review effort only after Phase A reports an implementation-ready candidate:

```text
INDEPENDENT FINAL IMPLEMENTATION REVIEW — VERIFIED DIST MATERIALIZATION

Review only. Read repository canon, the governing plan, this protocol, exact landed commit range,
final source, public exports, tests, documentation, config, examples, consumers, and verification
evidence.

This is a polished candidate that has already received architecture and internal final review. Search
for residual defects; do not propose speculative redesign or manufacture novelty. Reopen landed
foundations only with concrete evidence.

Judge whether the final system has one secure-by-default verified-Dist authority, exact external
integrity, bounded acquisition, Rooted immutable publication, complete verification, truthful
cancellation/cleanup/quiescence, no lower-authority Dist alias or indirect route, useful honest generic
GitHub APIs, and proportionate DX.

Inspect aliases, optional authority, result laundering, post-verification mutation, resource-policy
bypass, publication races, caller-forged evidence/handles/transports, indirect Tools/Cell/sample
paths, and unjustified factories/brands/wrappers/scanners/package splits.

Return an executive verdict; evidence-backed BLOCKER / WORTHWHILE / UNNECESSARY / DEFER findings;
route/authority and caller-DX assessment; verification gaps; strongest case that the implementation
is already complete; and final recommendation. For each finding give exact evidence, concrete
failure, smallest correction, protection, DX effect, and proof. A clean pass is valid.
```

### Phase C — adjudicate and close

Adjudicate every Opus finding against final source and Phase A evidence as `ACCEPT`, `REJECT`,
`DEFER`, or `NEEDS-HUMAN-DECISION`.

- If no accepted finding changes code or contract, Gate 2 passes after adjudication. Do not run a
  ceremonial extra audit.
- If accepted findings change code, rerun affected owner proof and the relevant route/residue
  checks.
- Repeat the complete final audit only if a change alters the frozen architecture or a protected
  outcome.

Gate 2 passes when there is no blocker, all accepted changes have proof, the governing plan matches
fresh history, generic GitHub Pull remains available and honest, and negative closure finds no
removed-contract residue.

## Evidence record

Record only material findings and observed proof:

```text
Gate and HEAD:
Finding and source:
Classification:
Repository evidence:
Decision:
Smallest correction and owner:
Protection / DX effect:
Proof required:
Proof observed:
Unresolved human decision:
Gate verdict and confidence:
```

## Gate 1 Phase A baseline

### Record

- Review point: `ff19f54ec`; latest landed materialization prerequisite: `c4b0a8109`.
- Independence: the completed Claude/Opus response remained unread while this baseline was derived.
- Scope: governing and downstream plans, landed prerequisite history, current Fetch/Pull/Rooted/Pkg
  contracts, Server exports, Tools HTTP/GitHub/config/result flows, Cell guidance/samples, static
  Dist adapters, and known Dist verification/fetch/serving consumers.
- Constraint: unrelated modified and untracked worktree content was observed but not changed.

### Protected outcomes and trust roots

1. **Verified remote Dist materialization.** Trust begins only with a caller-supplied SHA-256 of the
   exact remote `dist.json` bytes. HTTPS, URL, redirect destination, manifest self-report, generated
   local metadata, and `dist.hash.digest` are not artifact authority.
2. **Verified local hosting.** Trust begins with a fresh bounded `Pkg.Dist.verifyPinned` result for
   the exact local generation and caller pin. Materialization evidence is informative output, not a
   reusable hosting token.
3. **Generic GitHub pulling.** Trust is limited to the GitHub source observation made by the
   operation. A selected release, mutable ref, resolved commit, Git object identifier, downloaded
   bytes, or locally generated `dist.json` is not external verified-Dist authority.

### Route inventory

- `Http.Pull` currently exposes checksum-bound `Resource[] + Rooted` and legacy
  `string[] + raw directory` overloads under the same `toDir` and `stream` names. The shared kernel
  preserves cancellation/quiescence truth, but the legacy branch still permits URL-derived targets,
  caller-selected transport, retries/defaults, and replacing writes.
- Tools `kind: http` currently fetches an unpinned manifest, trusts its paths/hashes, optionally
  clears the target, uses legacy HttpPull, writes directly to a mutable directory, and rewrites HTML
  after download. This is the easiest checked-in remote-Dist path today.
- Tools `github:release` and `github:repo` are reachable programmatically only through config-driven
  `Pull.run`. Their internal helpers are not a stable first-class public API. Downloads use
  unbounded Octokit/global-fetch bodies, serial force writes, optional clearing, and no aggregate
  byte/time/resource policy. Release Pull also generates and saves `dist.json`, which can blur local
  indexing with external artifact authority.
- `Pkg.Dist.verify` performs local/self-consistency verification and sits beside the stronger
  `verifyPinned`. The shorter/autocomplete-obvious name is the weaker operation; DenoEntry uses it
  before generic local static fallback serving.
- `Pkg.Dist.fetch` is a public unbounded, unpinned global-fetch convenience returning a structural
  `DistPkg`. Server/HTTP samples teach feeding that result into `FilesStatic.fromDist`.
- `FilesStatic.fromDist` is a structural read-only adapter, not verification authority. Generic raw
  static servers and direct Fetch/filesystem composition likewise remain deliberate lower-level
  capabilities and must not claim verified-Dist success.
- Cell help and samples currently teach URL-only `pull latest` followed by ordinary serving. They
  are indirect production guidance for the weak Tools route.
- The planned Server materializer is the only route that composes exact external integrity, bounded
  acquisition, Rooted private staging, complete pinned verification, and immutable promotion.

### Authority verdict

The final target architecture is sound, but the governing plan is not yet architecture-closed. It
correctly specifies checksum-bound HttpPull, immutable Server composition, pinned Tools migration,
and legacy HttpPull removal. It still omits public Dist-surface cleanup and a first-class bounded
GitHub contract, and it leaves Tools result/config laundering insufficiently specified.

The easiest-path verdict is therefore **fail before reconciliation** and **passable after the
corrections below**. Raw Fetch/filesystem/static APIs may remain because they do not themselves
claim verified Dist authority.

### Findings

#### BLOCKER — ambiguous public Dist authority remains outside HttpPull

Evidence:

- `code/sys/fs/src/m.Pkg/t.ts` exports both `verify` and `verifyPinned`.
- `code/sys/std/src/m.Pkg/t.ts` exports `Pkg.Dist.fetch`.
- `code/sys/std/src/m.Pkg/u/u.dist.fetch.ts` uses global Fetch without finite response policy or an
  external integrity pin.
- `code/sys.driver/driver-deno/src/m.cloud/m.DenoEntry/u.verify.ts` calls the weaker `verify`.
- checked-in Server/HTTP samples teach unpinned `Pkg.Dist.fetch → FilesStatic.fromDist`.

Correction:

- Rename local/self-consistency `Pkg.Dist.verify` to an honest non-authority name such as
  `Pkg.Dist.check`; retain no alias.
- Keep `Pkg.Dist.verifyPinned` as the only public `verify*` operation in this arc.
- Remove public `Pkg.Dist.fetch` and its response/options types; retain no unpinned replacement
  under the Dist namespace.
- Migrate local-build consumers and samples to explicit local-check or bounded lower-level behavior,
  with no verified claim.

Protection/DX: autocomplete no longer selects a weaker `verify`, and an unpinned global-fetch helper
cannot masquerade as the normal Dist entry point. This removes ambiguity rather than adding
ceremony.

#### BLOCKER — generic GitHub Pull is neither first-class nor finitely bounded

Evidence:

- public `Pull` exposes only `resolve` and `run`;
- GitHub helpers live under internal bundle modules;
- Octokit/global-fetch responses and binary decoding have no explicit finite byte/time policy;
- execution force-writes sequentially after lexical path checks and can clear a target;
- release Pull automatically computes/saves `dist.json`.

Correction:

- Add one direct public `Pull.github.release(...)` and `Pull.github.repo(...)` programmatic surface;
  config-driven execution must call the same operations.
- Require explicit finite programmatic policy for metadata/body bytes, entries, per-file and total
  bytes, time, and progress/cancellation; Tools CLI may supply one reviewed finite owner policy.
- Accept one explicit target directory, create and own Rooted confinement internally, and use full
  batch admission plus no-clobber publication; do not expose downloader/client injection publicly.
- Return resolved GitHub source evidence under `github:release | github:repo`, never verified-Dist
  evidence.
- Remove automatic release `dist.json` generation from the Pull success path. Callers that
  deliberately compute local package metadata must do so separately and cannot upgrade trust.

Protection/DX: generic GitHub remains useful and gains a short direct API, while its weaker trust
boundary becomes explicit and resource exhaustion/path publication are bounded.

#### BLOCKER — Tools config and result types can launder trust

Evidence:

- `ConfigYaml.Bundle` mixes `kind: http` with GitHub variants;
- HTTP config has only `dist` URL and mutable `local` target;
- `Bundle.ResultMeta` shares optional `dist`/`dists` across HTTP and GitHub;
- Cell guidance presents URL-only Pull as owner materialization.

Correction:

- Replace `kind: http` with `kind: dist`; require canonical exact manifest `integrity` and a
  manifest URL. Reject old unpinned config instead of synthesizing or migrating a pin.
- Make any mutable copy/rewrite an explicitly named projection, separate from the immutable verified
  generation and from its evidence.
- Replace the shared optional-result shape with discriminated Dist and GitHub results. A projection
  result must not carry or imply verification for projected bytes.
- Update CLI add/help, schemas, migrations, tests, Cell DSL, samples, scripts, and serving guidance.

Protection/DX: the normal config says what it does, unpinned input cannot silently upgrade, and
callers do not infer authority from an optional `dist` field.

#### WORTHWHILE — bind materializer authority without a factory

The planned one-shot `Dist.materialize` is preferable to a factory: no current evidence shows a
factory adding protection, and callers can reuse a frozen authority object directly.

Recommended call shape:

```ts
const result = await Dist.materialize({
  source: { url: manifestUrl, integrity },
  storeDir,
  authority,
  until,
});
```

`authority` should compose canonical upstream construction/options types for manifest Fetch,
resource Pull, and pinned verification limits. It may carry credential material admitted by those
owners, but it must not accept a Fetch instance, verifier, parsed manifest, Rooted target handle, or
verification evidence. Exact field spelling remains a scaffold decision; the source/integrity pair
and one reusable authority value are the semantic boundary.

#### WORTHWHILE — remove FilesStatic from materialization orchestration

`FilesStatic.fromDist` builds a Files backing; it does not expose a public pure resource-admission
index and is not verification authority. Requiring the materializer to construct/query a Files
backing adds a model dependency and ceremony without strengthening Rooted target admission or final
`verifyPinned`.

The materializer should snapshot authenticated canonical manifest entries, parse each part with
`Pkg.Dist.Part.parse`, reserve `dist.json`, submit the complete target batch to Rooted/HttpPull, and
resolve encoded asset URLs from the authenticated final manifest URL. Downstream hosting may still
use `FilesStatic.fromDist` from fresh pinned verification evidence.

#### WORTHWHILE — keep both terminal and observable Pull projections

`toDir` and `stream` are acceptable because they share one execution and authority model. Replacing
them with a ceremonial builder/start factory provides no demonstrated protection. Final proof must
show neither projection accepts weaker inputs or initiates a separate executor.

### Recommended public call sites

Verified Dist, first use:

```ts
const result = await Dist.materialize({
  source: { url: manifestUrl, integrity },
  storeDir,
  authority,
  until,
});
```

Verified Dist, repeated use:

```ts
const authority = Object.freeze({ manifest, resources, verification });
for (const source of sources) {
  await Dist.materialize({ source, storeDir, authority, until });
}
```

The reusable value is ordinary caller data, not a required library factory.

Generic GitHub repo:

```ts
const result = await Pull.github.repo({
  repo: 'owner/repo',
  ref: 'main',
  path: 'packages/view',
  dir: targetDir,
  policy,
  until,
});
```

Generic GitHub release:

```ts
const result = await Pull.github.release({
  repo: 'owner/repo',
  tag: 'v1.2.3',
  assets: ['view.tar.gz'],
  dir: targetDir,
  policy,
  until,
});
```

These GitHub results report downloaded source observations only. Neither call returns
materialization evidence or creates a verified Dist.

### Phase A arc proposal before external adjudication

```text
1. refactor(dist)!: distinguish local and pinned Dist authority
2. feat(http): enforce bounded pull resource policy
3. feat(tools): expose bounded GitHub pull authority
4. feat(server): compose immutable verified Dist materialization
5. feat(tools)!: require pinned Dist materialization
6. refactor(http)!: remove legacy pull materialization
```

This proposal is retained only as the independent pre-Claude record. The governing plan contains the
adjudicated executable arc.

The Dist authority refactor removes `Pkg.Dist.fetch`, renames the local consistency operation
without an alias, and updates affected consumers/proof. The GitHub feature lands a direct bounded
API before the breaking Dist config/result migration, preserving GitHub availability throughout the
arc. Server then composes only canonical pinned owners. Tools migrates the sole legacy HttpPull
production consumer, after which the legacy HTTP branch is deleted immediately.

### Negative closure proof

Final closure must find none of:

- `Pkg.Dist.verify` with local/self-consistency semantics;
- public `Pkg.Dist.fetch` or an unpinned Dist-fetch alias;
- `kind: http` Dist config, URL-only Dist config, trust-on-first-use pin synthesis, or migration
  that manufactures integrity;
- shared optional `dist` metadata that lets GitHub/generic output resemble verified materialization;
- automatic GitHub release `dist.json` generation in Pull;
- URL-array/raw-directory HttpPull overloads, `HttpPull.Map`, injected Pull clients, mapping
  options, force-write branch, private copy, alias, or temporary script;
- mutable projection bytes represented by materialization evidence;
- production call sites, help, samples, Cell DSL, scripts, or tests teaching removed routes.

### Phase A verdict

**Not ready to implement yet; ready for Claude adjudication.** The core immutable materialization
transaction is technically sound and proportionate. The blockers are public-surface closure,
first-class bounded GitHub preservation, and trust-honest Tools contracts—not a need for more review
gates or more capability brands. Confidence: high.

## Gate 1 Phase B adjudication

### Input and independence

The complete Claude/Opus 5 response was read only after the Phase A baseline above was recorded.
Claude could not read `../sys.canon`; this session did read the workspace and canonical instruction
set. No accepted finding conflicts with canon. The missing canon access lowers the external review's
procedural completeness but does not invalidate its repository evidence.

### Accepted findings

- **Accept:** rename self-consistency `Pkg.Dist.verify` to `Pkg.Dist.checkSelfReported`, with no
  alias; keep `verifyPinned` stable as the only public `verify*` Dist operation.
- **Accept and extend:** delete GitHub release `computeReleaseDist`, remove shared optional
  `dist`/`dists` result metadata, and give GitHub flat result records structurally distinct from
  HttpPull and materialization results.
- **Accept:** replace the checksum-bound HttpPull overloads with one
  `HttpPull.start({ resources, rooted, policy, credentials?, until? })` before Server composition.
  Legacy `toDir`/`stream` remain single-signature only until their immediate final deletion.
- **Accept:** remove the async iterator from the pinned operation. Keep `events()` as a disposable
  non-cancelling observer and `done` as canonical terminal truth; `cancel()` remains explicit.
- **Accept:** reserve "verified" for `verifyPinned` evidence and use "checksum-pinned" rather than
  "secure" or "verified" for HttpPull records, docs, and failures.
- **Accept:** export a direct `GithubPull.release/repo` API from `@sys/tools/pull`; config-driven
  GitHub execution must call the same owner operations.
- **Accept and strengthen:** GitHub policy must bound metadata bytes, entries, per-file bytes,
  aggregate bytes, and total time with no unlimited defaults. Fixed GitHub source admission and
  credential confinement remain owner-controlled.
- **Accept:** remove `kind: http`; `kind: dist` requires exact publisher-provided manifest
  integrity. Ship no TOFU helper, migration, CLI flag, or fallback that derives the pin from
  downloaded bytes.
- **Accept:** keep one-shot `Dist.materialize`; reject a factory, nominal integrity brand, permanent
  import scanner, package split, `Unsafe`/`Legacy` aliases, and forcing generic GitHub through Dist.
- **Accept:** update Cell guidance and samples in the Tools migration, and keep HTML rewriting only
  in a separately typed mutable projection.
- **Accept:** remove HttpPull runtime access from the universal `@sys/http`/`Http.Pull` surface in
  the final deletion commit; retain the checksum-pinned primitive through `@sys/http/server`.
- **Accept:** require publisher-side production of the exact serialized `dist.json` SHA-256 so the
  pinned config has an honest source.

### Independent findings Claude missed

- **Retain Phase A blocker:** remove public unbounded/unpinned `Pkg.Dist.fetch` and its public
  option and response types. Claude did not address this competing Dist-named route.
- **Retain Phase A simplification:** do not use `FilesStatic.fromDist` as materialization
  orchestration. It is a downstream structural adapter, not a public manifest-resource parser or
  trust owner.
- **Retain stronger GitHub confinement:** lexical checks plus force-write are insufficient against
  symlinked parents. The normal public API accepts an explicit target directory and creates Rooted
  confinement internally. A required `create | replace` mode names mutation; after any explicit
  replace clear, publication remains full-batch-admitted and no-clobber. Output is still an ordinary
  mutable directory and carries no verified claim.

### Modified or rejected details

- **Modify:** Claude's reason for rejecting `Dist.create` overstates that every factory necessarily
  widens origins. The factory is still rejected because it adds a lifecycle noun and no concrete
  protection or repeated-use benefit.
- **Modify:** `HttpFetch.ResponsePolicy.maxBytes` is already the per-response/per-file bound; do not
  duplicate it as an independently drifting `HttpPull.maxFileBytes` field unless implementation
  evidence proves a distinct semantic need.
- **Modify:** GitHub's single `timeout` must cover the whole operation, and metadata transport must
  itself be byte/time bounded. Merely checking decoded Octokit results is insufficient.
- **Modify:** Server success returns the canonical generation directory produced from Rooted
  admission; callers do not reconstruct it from `storeDir + integrity`.
- **Modify:** credential material for manifest and resources must compose canonical Fetch/Pull
  construction options and remain separately confineable; no injected client is accepted.
- **Reject:** treating generic `@sys/tools/serve` as a defect to be converted into pinned hosting.
  It is an intentional arbitrary-directory server and must remain honestly generic. The downstream
  local-host plan adds a separate verified-or-refuse service.
- **Reject for now:** extracting a cross-package private worker kernel for GitHub. Reuse only if a
  concrete owner and public dependency boundary emerge during implementation; do not create a new
  package or private import to avoid a small serial loop.

### Reconciled architecture

The final public shape is:

```text
Pkg.Dist.checkSelfReported(...)                 local consistency; no external authority
Pkg.Dist.verifyPinned(...)                      exact manifest pin + complete local verification
HttpPull.start({ resources, rooted, ... })      checksum-pinned bounded publication
Dist.materialize({ manifestUrl, integrity, ... }) immutable verified generation
GithubPull.release/repo(...)                    bounded confined generic download, no Dist claim
```

`Pkg.Dist.fetch`, URL-array/raw-directory HttpPull, shared generic/Dist result metadata, automatic
GitHub manifest generation, and unpinned Dist config have no final compatibility surface.

The reconciled atomic order is:

```text
refactor(dist)!: make Dist trust authority explicit
feat(tools)!: expose bounded GitHub pull authority
feat(http)!: bind pinned pull to one bounded operation
feat(server): compose immutable verified Dist materialization
feat(tools)!: require pinned Dist materialization
refactor(http)!: remove legacy pull materialization
```

### Gate verdict

**PASS.** The governing plan is reconciled to the decisions above and its architecture gate is
closed. No further architecture review or Claude rerun is required. Implementation may begin with
the first pending commit under ordinary commit acceptance and explicit human authorization.
Confidence: high.

## Final Server pre-implementation TMIND closure

This is an ordinary requested readiness review, not a third formal gate. It reopened Gate 1 only for
one concrete result-truth defect found while composing the landed Rooted and `verifyPinned`
contracts. The governing plan contains the authoritative reconciliation.

### Finding — stage evidence was insufficient for promoted success

**Classification:** BLOCKER, accepted and resolved in the governing plan.

`Rooted.promoteStage` truthfully preserves `kind: published` after the rename even when later target
observation or cleanup reports a committed failure. The previous Server transaction returned
`promoted` using evidence produced against the private stage. That could conflate committed
filesystem publication with verified final-generation truth.

The reconciled invariant is stronger and uniform: every `existing` or `promoted` result carries
fresh `Pkg.Dist.verifyPinned` evidence produced against the exact returned `dir`. Stage verification
continues to gate promotion but is never returned as final-generation evidence. After `published`,
the final target is independently verified; failure returns `failed` with `publication: committed`.
An invalid concurrent winner returns `failed` with `publication: occupied`. Neither result claims
rollback or deletes the visible target.

### Finding — `missing` conflated absent and malformed existing generations

**Classification:** WORTHWHILE contract correction, accepted.

`Pkg.Dist.verifyPinned` intentionally reports `missing` when either the generation root or its
`dist.json` is absent. The former may enter acquisition; the latter is an existing invalid target
and must block network work. After Rooted admission, one canonical read-only `Fs.lstat` observation
records initial target presence. Fresh verification still owns all authority. `missing` continues
only when the target was initially absent; an initially present target fails closed without
credential evaluation or transport.

### Accepted hardening latches

- Snapshot the complete input, nested policies, and credential callback references before the first
  await; credential callbacks remain lazy so valid existing generations are zero-network results.
- Require exact part sizes and reject directly provable Fetch/Pull/verification limit conflicts
  before asset transport, while leaving complete validation to each canonical owner.
- Dispose the owned manifest Fetch capability on every path and await `HttpPull.done` before
  verification or cleanup.
- Do not reuse an aborted caller signal for safe cleanup or final-target settlement after Rooted has
  established `published | occupied`; visible truth must reach a quiescent terminal result.
- Preserve sanitized failures: no private stage path, raw host cause, credentials, abort reason,
  integrity/evidence, or unauthenticated manifest claim enters `failed`.

### Readiness verdict

**READY.** The Server boundary now has one complete success invariant, an explicit committed-outcome
failure vocabulary, a zero-network existing-target rule, and deterministic settlement semantics. No
unresolved design decision or technical prerequisite remains. This verdict authorizes no runtime
edit, test run, staging, or commit; implementation still requires a separate explicit human go.
Confidence: high.

## Gate 2 Phase A internal final closure

### Review point and scope

- Review point: `f1ed33f52`; landed materialization endpoint: `064f12a8c`.
- Candidate: the landed arc plus the unstaged closure hardening listed below. Unrelated modified and
  untracked workspace state was preserved and excluded.
- Method: fresh canon traversal; governing/downstream plan review; reachable history and landed
  semantic review; end-to-end tracing across Fetch, HttpPull, Rooted, `Pkg.Dist.verifyPinned`,
  Server Dist, Tools Dist/GitHub, Cell guidance, and downstream hosting; adversarial route and
  residue scans; affected-owner proof.
- Posture: BMIND first-principles reconstruction, TMIND hostile-input and race review, DMIND caller
  fit, then STIER residue closure.

### Protected outcomes

1. Caller-supplied exact `dist.json` integrity → bounded acquisition → Rooted private staging →
   complete staged verification → no-clobber immutable promotion → fresh final-directory evidence.
2. Existing or concurrent-winner generation → zero acquisition when initially present → fresh
   `verifyPinned` evidence for the exact returned directory.
3. Generic GitHub release/repository source → bounded, origin-confined, Rooted-confined mutable
   files without Dist integrity, verification evidence, or a provenance claim.
4. Immutable generation → optional mutable Tools projection whose copy/rewrite result carries no
   generation evidence and cannot feed verified hosting.

### Final route and authority matrix

| Route                           | Trust root                                         | Network authority                                                                | Filesystem/publication                                               | Terminal truth                                                        |
| ------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `Dist.materialize`              | Caller pin for exact manifest bytes                | Explicit finite Fetch + Pull policy; separate source/credential origins          | Rooted stage, no-clobber generation promotion                        | Every success has fresh `verifyPinned` evidence for its exact `dir`   |
| Existing/concurrent winner      | Same caller pin                                    | No network for an initially present target                                       | Target is never cleared or replaced                                  | `existing` only after fresh final-directory verification              |
| Tools `kind: dist`              | Required publisher pin                             | One reviewed finite owner policy                                                 | Immutable store; optional isolated mutable projection                | Generation and projection results remain disjoint                     |
| `HttpPull.start`                | Caller resource checksums and optional exact sizes | Owned finite Fetch; bounded retries, bytes, time, concurrency, progress, origins | Full-batch Rooted admission and no-clobber file publication          | Quiescent `done`; checksum-pinned records, not verified Dist evidence |
| `GithubPull.release/repo`       | GitHub source observation only                     | Fixed GitHub origins; finite metadata/file/aggregate/time limits                 | Explicit `create\|replace`; Rooted target claim and file publication | Mutable generic files only; truthful partial records                  |
| Generic Fetch/fs/static serving | None supplied by this arc                          | Caller-owned lower-level authority                                               | Caller-owned lower-level authority                                   | Cannot produce a materialization success or verification evidence     |

### Caller journeys

Direct materialization:

```ts
const result = await Dist.materialize({
  manifestUrl,
  integrity,
  storeDir,
  policy,
  credentials,
  until,
});
```

Tools configuration:

```yaml
- kind: dist
  manifest: https://cdn.example.com/app/dist.json
  integrity: sha256-<exact-publisher-manifest-byte-hash>
  store: ./.dist-store
  project:
    dir: ./view/.pulled/app
    mode: replace
```

Generic GitHub calls remain short and explicitly weaker:

```ts
await GithubPull.release({ repo, tag, assets, into, mode, limits, token, until });
await GithubPull.repo({ repo, ref, path, into, mode, limits, token, until });
```

### Accepted closure findings

#### ACCEPT — asynchronous credential authority could escape synchronous admission

Repository evidence:

- `HttpPull` accepted typed callback references but delegated evaluation to Fetch after Rooted
  admission. A JavaScript or contextually typed async header callback could return a thenable, and
  an async token callback could manufacture invalid credential data.
- Server manifest credentials needed the same fail-closed callback boundary while preserving lazy
  evaluation on the network branch.

Correction:

- `code/sys/http/src/http.server/m.HttpPull/u.resource/u.input.ts` now evaluates credential
  callbacks synchronously, rejection-drains thenables, snapshots canonical headers, and rejects
  callback failure before Rooted admission or transport.
- `code/sys/server/src/m.server.dist/u.input.ts` preserves lazy manifest credential evaluation, then
  rejects/drains asynchronous token or header callbacks before transport.
- Focused tests cover both token and header thenables and prove zero admission/network work.

Protection/DX: typed synchronous callbacks remain unchanged; accidental async authority fails closed
without unhandled rejection or late mutation.

#### ACCEPT — manifest tokens did not share canonical Fetch normalization

Repository evidence: the Server credential snapshot had to preserve Fetch's trim, single `Bearer`
prefix, header inspection, override, and deletion semantics after moving callback evaluation ahead
of Fetch construction.

Correction: `prepareManifestCredentials` now materializes canonical Bearer/header semantics once and
passes an immutable synchronous header snapshot into the owned Fetch capability.

Protection/DX: manifest and resource credentials behave consistently without repeated callback
evaluation or credential leakage.

#### ACCEPT / RESOLVED — canonical Fetch header ownership is centralized

Landed correction: `af3c841aa refactor(http): centralize Fetch header snapshots`.

- `Fetch.defaultHeaders` is the reviewed `@sys/http/client` composition API for canonical
  access-token normalization and default-header mutation semantics;
- `HttpFetch.DefaultHeaders` owns the shared method and option contracts used by checksum-pinned
  HttpPull and Server manifest credentials;
- option getters and callbacks are snapshotted once, asynchronous callback results fail closed, and
  thenable rejections are drained before any specialized consumer can admit or start transport;
- HttpPull and Server consume the public API, preserve frozen replay snapshots and lazy zero-network
  behavior, and no longer deep-import or reproduce the implementation;
- Bearer/header policy remains absent from transport-neutral `@sys/std`.

The final local TMIND review found one hostile native-Promise escape: `Promise.resolve(input)` could
return the same Promise and invoke a caller-shadowed `.catch`, leaving its private rejection
unhandled. The landed implementation adopts every thenable into a fresh native Promise before
attaching rejection handling. Direct regression proof covers a rejected native Promise with a
hostile own `.catch`, alongside fulfilled and rejected non-synchronous callback results.

Protection/DX: one discoverable upstream HTTP contract replaces private reach-through and copied
security semantics without widening transport, credential-origin, filesystem, or Dist trust
authority.

#### ACCEPT — GitHub input, cancellation, and target claim needed final owner hardening

Repository evidence:

- optional GitHub values were read structurally rather than only through own-property authority;
- unknown own keys were not rejected;
- `Dispose.abortable` bridges a pre-aborted signal on a microtask, so GitHub transport could begin
  before the cancellation became observable;
- target creation used direct `Deno.mkdir` after Rooted admission, outside the canonical filesystem
  substrate.

Correction:

- `code/sys.tools/src/cli.pull/u.github/u.pull.ts` validates exact operation/limit keys, requires
  own mandatory keys, reads optional authority only when owned, and snapshots every accepted value;
- one scheduler boundary latches pre-aborted lifecycle authority before client execution;
- the output directory is claimed through Rooted stage promotion, preserving one-winner
  create/replace truth without direct production filesystem syscalls;
- policy tests cover inherited authority, enumerable/non-enumerable/symbol unknown own keys, and
  pre-aborted zero-transport behavior; release/repository tests cover create/replace, concurrent
  one-winner claiming, symlink ancestry, partial publication, and cleanup.

Protection/DX: the public call shape is unchanged while ambient authority, pre-cancel network work,
and a filesystem abstraction bypass are removed.

### Adversarial closure result

No implementation blocker remains after the accepted corrections.

Negative scans found no relevant public or production residue for:

- local consistency under `Pkg.Dist.verify`, public `Pkg.Dist.fetch`, or an unpinned Dist-fetch
  alias;
- `kind: http` outside an explicit rejection test, URL-only Dist config, TOFU pin synthesis, or
  missing-integrity migration;
- `HttpPull.toDir`, `HttpPull.stream`, `HttpPull.Map`, `Http.Pull`, URL-array/raw-directory Pull,
  injected transport, force-write publication, async iteration, compatibility alias, or private
  mirror copy;
- universal runtime exposure of `HttpPull`;
- GitHub `dist.json` generation, verified evidence, shared Dist result metadata, or unbounded public
  downloader injection;
- mutable projection results carrying generation integrity or verification evidence;
- production direct Fetch or direct Deno filesystem calls inside the final Server/HttpPull/GitHub
  owner paths.

Broader `ResourceResult`, `kind: 'http'`, generic Fetch/filesystem, and generic serve hits were
classified by owner and are unrelated lower-level protocols or explicit rejection fixtures. They do
not claim Dist verification.

### Verification observed

- `@sys/http`: **44 passed / 321 steps**; check passes.
- `@sys/server`: **29 passed / 109 steps**; check passes.
- `@sys/tools` Pull: **22 passed / 93 steps**.
- Full `@sys/tools`: **117 passed / 642 steps**; check passes.
- `@sys/cell`: **31 passed / 241 steps**; check passes.
- All affected closure and header-snapshot files pass scoped lint and `deno fmt --check`; scoped
  `git diff --check` passes.
- Final route, direct-syscall, callback-authority, removed-API, universal-export, TOFU, laundering,
  and terminology scans pass.
- Earlier arc dependency regeneration (`deno task prep:imports` and `deno task lock:sync`) was
  clean; this closure delta adds no dependency.
- Repository-wide lint remains an unrelated known baseline failure; no module declares a scoped lint
  task for these files. Existing feature-scoped lint evidence remains green.
- Final clean-tree JSR publish dry-runs remain pending a human-owned clean checkout. The configured
  module `dry` task carries `--allow-dirty`; it was not rerun under the active provenance policy. A
  direct Tools `deno publish --dry-run` stopped at the dirty-tree gate, and no override was used.

### Residual non-goals

This result does not claim signature trust, key rotation, replay prevention, activation selection,
persistent provenance receipts, crash-durable publication, hostile same-principal filesystem
resistance, or verification of mutable projections and generic GitHub outputs. Downstream pinned
hosting must run fresh `verifyPinned` against the exact served directory.

### Internal verdict

**READY FOR INDEPENDENT OPUS 5 REVIEW.** Closure hardening landed as `80c7cd9e5`, Fetch header
centralization landed as `af3c841aa`, and the final local MAX/TMIND review accepted the combined
candidate after correcting and proving the hostile native-Promise drain case. The frozen trust
architecture was unchanged. Confidence: high.

Historical process note: the obsolete terminal review-completion gate wording was bookkeeping, not a
technical or dependency blocker. Final reconciliation represented the independent review's one
accepted code finding as the ordinary local commit item that landed at `246fa3ac1`.

## Gate 2 Phase B self-contained Opus 5 handoff

The Fetch header-snapshot refactor and its adversarial follow-up are landed and reconciled below.
Paste this prompt into a fresh Claude Opus 5 session with maximum review effort. External execution
and repository access remain human-owned.

```text
INDEPENDENT FINAL IMPLEMENTATION REVIEW — VERIFIED DIST MATERIALIZATION

You are the final independent security and engineering reviewer. Review only: do not edit, stage,
commit, regenerate, or clean files.

Repository root:
/Users/phil/code/org.sys/sys

First read and apply:
- /Users/phil/code/org.sys/sys/AGENTS.md
- /Users/phil/code/org.sys/sys.canon/AGENTS.md
- every file directly under /Users/phil/code/org.sys/sys.canon/-canon/
- /Users/phil/code/org.sys/sys/-agent/-plan/@sys.server/verified-dist-materialization.plan.md
- /Users/phil/code/org.sys/sys/-agent/-plan/@sys.server/verified-dist-materialization.max-review.md
- /Users/phil/code/org.sys/sys/-agent/-plan/@sys.server/local-dist-host.plan.md

If canon access is unavailable, state that limitation before judging process compliance. Preserve all
unrelated dirty/untracked workspace state.

Review the exact landed arc from `e85f8de02` through `af3c841aa`, including closure hardening
`80c7cd9e5` and Fetch header centralization `af3c841aa`. Inspect these final closure files:
- code/sys/http/src/http.client/-.test.ts
- code/sys/http/src/http.client/m.HttpFetch/-test/-authority.test.ts
- code/sys/http/src/http.client/m.HttpFetch/m.Fetch.ts
- code/sys/http/src/http.client/m.HttpFetch/t.ts
- code/sys/http/src/http.client/m.HttpFetch/u/u.headers.ts
- code/sys/http/src/http.server/m.HttpPull/common.ts
- code/sys/http/src/http.server/m.HttpPull/t.ts
- code/sys/http/src/http.server/m.HttpPull/u.resource/u.input.ts
- code/sys/http/src/http.server/m.HttpPull/-test/-u.start.policy.test.ts
- code/sys/server/src/m.server.dist/t.ts
- code/sys/server/src/m.server.dist/u.input.ts
- code/sys/server/src/m.server.dist/-test/-authority.test.ts
- code/sys.tools/src/cli.pull/u.github/u.pull.ts
- code/sys.tools/src/cli.pull/u.github/-test/-u.pull.policy.test.ts
- code/sys.tools/src/cli.pull/u.github/-test/-u.pull.release.test.ts

Record current HEAD and distinguish landed arc bytes from unrelated worktree changes. Do not infer
behavior from commit subjects or the internal review record: inspect public types/exports,
implementations, tests, config/schema/help/samples, and direct consumers.

This arc already incorporated the salient findings from an earlier Claude Opus architecture review:
- Pkg.Dist.checkSelfReported is explicitly non-authoritative; verifyPinned is the only Dist verify*
  authority; public unpinned Pkg.Dist.fetch is removed.
- GithubPull.release/repo is public, finite, confined, mutable, and carries no Dist verification
  claim or generated dist.json.
- HttpPull has one server-only checksum-pinned start operation with owned bounded Fetch, Rooted
  no-clobber publication, explicit cancel, observation-only events, and quiescent done.
- @sys/server/dist composes exact manifest-byte authentication, Rooted staging/promotion, strict
  staged verification, and fresh final-directory verifyPinned evidence.
- Tools requires kind: dist + manifest + independent canonical integrity + immutable store; optional
  mutable projection is evidence-free and isolated.
- URL-array/raw-directory HttpPull, injected transport, universal Http.Pull/HttpPull runtime exports,
  aliases, shims, TOFU paths, and migration fallbacks were removed rather than renamed.

Do not repeat those as recommendations unless you find concrete surviving residue or a broken
implementation. Search for residual defects, not novelty. A clean pass is valid.

Protected outcomes:
1. pinned remote Dist → bounded authenticated acquisition → immutable verified generation;
2. valid existing/concurrent winner → zero unnecessary acquisition → fresh evidence for exact dir;
3. generic GitHub release/repo → useful bounded confined mutable files → no verified-Dist laundering;
4. verified generation → optional mutable projection → no inherited evidence;
5. verified generation → downstream pinned hosting, which must independently verify again.

Adversarially inspect:
- complete synchronous input snapshots, own-property optional authority, unknown-key rejection, lazy
  credentials, synchronous callback enforcement, thenable draining, and canonical Bearer behavior;
- exact source and credential origins, redirect hops/downgrade, header stripping, sanitized failures,
  raw reasons, and private first-cause cancellation;
- finite resource/count/byte/time/retry/concurrency/progress accounting, overflow headroom, failed
  retry charging, timeout races, and pre-aborted zero-work behavior;
- full-batch target admission, symlink/alias/collision handling, Rooted-only mutation, no-clobber
  publication, one-winner races, stage cleanup, and committed-publication truth;
- exact manifest bytes, exact declared asset sizes/checksums, strict complete-tree verification,
  final-directory evidence, existing-invalid zero-network behavior, and post-publication settlement
  independent of caller cancellation;
- public type/runtime parity, universal/server export boundaries, event non-authority, result
  laundering, mutable projection isolation, Cell/help/sample paths, and direct/indirect compatibility
  residue;
- first-use and repeated-use DX, but reject factories, brands, builders, scanners, wrappers, package
  splits, or compatibility layers unless they close a demonstrated failure or repeated-use burden.

Threat boundary:
- exact external SHA-256 is the artifact trust root; HTTPS, URL, manifest self-report, and
  dist.hash.digest are not;
- checksum-pinned HttpPull is not complete Dist verification;
- GitHub commit/tag/source observation is not verified-Dist authority;
- arbitrary generic Fetch/filesystem/static serving may remain if it cannot produce or claim the
  protected result;
- signatures, replay policy, activation, crash durability, and malicious same-principal filesystem
  writers are explicit non-goals.

Observed internal proof to verify rather than trust:
- HTTP 44/321; Server 29/109; Tools Pull 22/93; Tools full 117/642; Cell 31/241;
- HTTP/Server/Tools and Cell checks pass; clean-tree publish dry-runs remain pending a clean checkout;
- affected closure files pass scoped lint/format/diff checks; negative route/residue scans clean;
- direct HTTP proof covers one-time getter/callback snapshots, canonical Bearer/header behavior,
  thenable rejection, and a rejected native Promise with a hostile own `.catch` that must never be
  invoked.

Return exactly these sections:
A. Executive verdict and confidence.
B. Final route/authority matrix, including the easiest ordinary caller path.
C. Findings grouped as BLOCKER, WORTHWHILE, UNNECESSARY, or DEFER. A group may be empty.
D. Verification gaps or affected proof that must be rerun.
E. Strongest evidence-based case that the implementation is already complete.
F. Final recommendation: ACCEPT, ACCEPT WITH CHANGES, or REJECT.

For every non-empty finding include:
- concrete claim;
- exact repository evidence (path, symbol, and line/range when available);
- executable failure or misuse sequence;
- affected protected outcome;
- smallest coherent correction and owner;
- protection gained and DX effect;
- exact proof required.

Do not manufacture findings, report generic hardening advice, reopen foundations from preference, or
confuse a documented non-goal with a defect. Distinguish implementation signal from process/document
noise. If no blocker or worthwhile correction survives repository evidence, say so plainly.
```

## Gate 2 Phase C final adjudication and closure

### Independent Opus 5 verdict

- Review point: `af3c841aa refactor(http): centralize Fetch header snapshots`.
- Recommendation: **ACCEPT WITH CHANGES**.
- Confidence: high static and semantic confidence.
- Architecture result: no architecture or Dist trust blocker; all protected immutable-generation
  outcomes remained intact.
- Accepted finding: one WORTHWHILE mutable-projection cancellation defect in
  `pullDistBundle`/`projectGeneration`.
- Verification reconciliation: the reviewer structurally reconciled HTTP **44/321**, Server
  **29/109**, Tools Pull **22/93**, full Tools **117/642**, and Cell **31/241**.
- Review limitations: the reviewer could not read `/Users/phil/code/org.sys/sys.canon/`, so made no
  canon-compliance judgment, and could not execute Deno because the runtime was unavailable and the
  download endpoint was blocked by the environment allowlist.

### Finding adjudication

**ACCEPT.** The mutable projection used short-lived `Rx.abortable(until)` probes. Each probe read
its new signal synchronously before the queued bridge from an already-aborted caller signal fired,
then disposed the bridge. Cancellation after immutable materialization could therefore be classified
as `invalid-target` or allow projection to enter target clearing/copying.

The finding was closure-blocking for mutable projection truth only. It did not weaken authenticated
manifest/resource bytes, immutable generation publication, `verifyPinned` evidence, or any returned
Server success. The smallest coherent correction was one operation-scoped abortable shared by
materialization and projection, one scheduler boundary before materialization, direct signal reads
at projection gates, and one `finally` disposal. No public config, result shape, immutable evidence,
or Dist trust authority changed. No other external finding required code or contract change.

### Landed correction

`246fa3ac1 fix(tools): latch dist projection cancellation authority`

- `pullDistBundle` creates one `Rx.abortable(options.until)`, latches it with
  `await Schedule.micro()`, and passes its signal through `Dist.materialize` and
  `projectGeneration`;
- projection reads that shared signal before capability admission, after admission, and after the
  asynchronous create-mode occupancy check;
- the ephemeral `isCancelled()` lifecycle was removed and the operation lifecycle is disposed once
  in `finally`;
- replace mode avoids the unnecessary existence probe without changing mutation authority;
- the regression cancels after an existing verified generation settles but before mutable
  projection, requires `projection.reason === 'cancelled'`, proves zero refetch, and proves the
  occupied projection remains unchanged.

### Accepted-delta proof

- Red proof: before the correction, the new regression returned `invalid-target` rather than
  `cancelled`.
- Focused regression: **1 passed / 3 steps**.
- `@sys/tools` Pull: **22 passed / 94 steps**.
- Full `@sys/tools`: **117 passed / 643 steps**.
- `@sys/http`: **44 passed / 321 steps**.
- `@sys/server`: **29 passed / 109 steps**.
- `@sys/cell`: **31 passed / 241 steps**.
- Tools owner check, scoped lint, formatting, diff checks, and cancellation-residue scans pass.
- Clean-tree publishing remains governed by the release workflow, is not claimed as accepted-delta
  proof, and was never bypassed with `--allow-dirty`.

### Final Gate 2 verdict

**PASS — CLOSED.** No architecture, trust, implementation, or accepted-finding blocker remains. The
governing plan matches reachable history through `246fa3ac1`; generic GitHub Pull remains bounded,
confined, mutable, and non-verified; negative closure remains clean; and the accepted correction has
complete affected proof. The verified Dist materialization arc is closed and
`local-dist-host.plan.md` is unblocked. Confidence: high.
