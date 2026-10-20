@sys.tools
upgrade-resolution-truth-and-release-recovery.plan.md
- [x] 1844d84 fix(http): remove the redundant keyboard lazy import
- [x] 8196518ce fix(workspace): separate package resolution from graph health
- [x] 210399bad fix(tools): reject unavailable registry metadata as a successful check
- [x] 61b4dbd9a fix(tools): verify refreshed public versions monotonically
- [x] d2b9d969c fix(tools): surface bounded resolver recovery detail
- [ ] GATE human authorizes corrected dependency and tools publication

## Status

- Phase: release recovery — source corrections are recorded in the opening arc; publication and
  external bootstrap acceptance remain outstanding.
- Independent review verdict: `MATERIAL CONCERN`.
- Cross-model adjudication: complete against source and Deno 2.9.5 runtime evidence.
- Architecture review: the universal `modules[].error` gate was rejected after it treated an
  intentional bundler asset as a broken workspace graph.
- Current direction: separate package selection from transitive diagnostics, enforce integrity only
  within the code-module graph, and harden degraded/verification paths without redesigning the
  upgrade UI or advisory schema.

## Objective

Restore truthful `@sys/tools` self-upgrade behavior from outside the `sys` repository when:

- JSR has published a newer version;
- Deno still holds that version under minimum-dependency-age policy; and
- `deno info --json` also reports an unrelated transitive module error.

The correct result in that state is a pending/standing-down upgrade, not resolver unavailability.
Both of these surfaces must derive from the same corrected facts:

- the upgrade table must not render `local:next unknown`; and
- the root CLI must render its pending standdown prelude after the advisory is persisted.

The repair must not convert a genuine requested-root resolution failure into a successful upgrade
fact or claim upgrade success before Deno verification.

## Concrete observed evidence

External reproduction directory:

- a temporary directory outside the repository (`/tmp` in proof examples)

Observed package versions during diagnosis:

- executing `@sys/tools`: `0.0.490`;
- registry latest: `0.0.492`;
- exact latest resolution: blocked by Deno's default 24-hour minimum-dependency-age policy.

The unpinned `deno info --json --no-config --no-lock jsr:@sys/tools` result contains an explicit
root package fact:

```text
"@sys/tools@*": "@sys/tools@0.0.490"
```

The same result contains this transitive graph error:

```text
Module not found "https://jsr.io/@sys/http/0.0.322/src/http.server/m.HttpServer/u.keyboard.ts".
```

The published `@sys/http@0.0.322` graph contains the same bad lazy import from:

- `code/sys/http/src/http.server/m.HttpServer/m.Server.ts`

It imported `./u.keyboard.ts`, while the module is located at `./u/u.keyboard.ts`. The local source
correction landed as `1844d84 fix(http): remove the redundant keyboard lazy import`.

A direct external cache operation for the published tools package succeeds despite the graph
diagnostic:

```text
deno cache --no-config --no-lock jsr:@sys/tools
```

That proves the transitive `deno info` diagnostic is not, by itself, evidence that Deno failed to
select or cache the requested tools package.

### Adjudication measurements

The independent reviewer could not run Deno. The adjudication pass closed that uncertainty with Deno
2.9.5 and isolated caches:

- unpinned `jsr:@sys/tools`: exit `0`; `roots` contains the literal requested specifier; `packages`
  contains `"@sys/tools@*": "@sys/tools@0.0.490"`; the unrelated HTTP error is an HTTPS module
  entry;
- pinned `jsr:@sys/tools@0.0.490`: exit `0`; the exact package fact is present; the same unrelated
  HTTP error remains;
- pinned `jsr:@sys/tools@0.0.492`: exit `0`; `roots` and the sole error module both contain the
  literal requested specifier; no root package fact is present; the error contains Deno's minimum
  dependency date;
- clean control `jsr:@std/assert@1.0.19/equal`: exit `0`; literal root, exact package fact, and no
  module error; and
- local `code/sys/http/src/-exports/-http.server.ts`: exit `0`; the missing keyboard target appears
  as a `file:` module error.

Therefore the incident takes the successful-JSON branch of `resolvePackage`; no process-failure
branch redesign is needed. Deno's `roots` array is sufficient provenance for root-attributable
module errors in every measured shape.

## Baseline proof already established

All of the following passed during diagnosis before the HTTP correction:

- root workspace check: 53 packages;
- `@sys/workspace` resolver suite: 17 steps;
- `@sys/tools` upgrade suite: 56 steps;
- `@sys/http` JSR publish dry-run.

This is a proof-fidelity gap, not an absence of tests. The existing resolver test suite codifies
module-error precedence, while current check and publish-dry surfaces do not execute the broken lazy
import.

## Current architecture

The upgrade path has coherent layers:

1. JSR metadata supplies latest published version and creation time.
2. `WorkspaceResolve.resolvePackage` invokes `deno info --json` for Deno policy-selected facts.
3. `getVersionInfo` combines registry and resolver facts and, when pending, probes the exact latest
   version.
4. `toVersionState` derives the canonical upgrade state.
5. command rendering and advisory persistence consume that derived state.
6. cache refresh is followed by public-specifier verification before success is reported.

The fault enters at step 2. `firstModuleResolutionError` first looks for a requested-root error,
then falls back to the first error anywhere in the transitive graph. That unrelated error is
classified as `unknown`, producing `resolution.ok: false`.

The downstream behavior is internally consistent with that false input:

- `toVersionState` derives `resolver-unavailable`;
- `getVersionInfo` does not run the exact-latest standdown probe;
- the table renders `local:next unknown`;
- the persisted advisory status is `resolver-unavailable`;
- the root pending prelude is omitted; and
- if an upgrade reaches cache refresh while the same diagnostic exists, post-refresh
  `getVersionInfo` also returns resolver-unavailable and falsely reports a successful refresh as a
  verification failure.

## Required invariants

### Resolver and graph facts

1. Registry publication, Deno package selection, resolver policy, and graph health are distinct
   facts.
2. `resolvePackage` answers which requested package version Deno selected under the supplied
   resolver options. It does not certify every lazy or transitive module path.
3. Deno's `roots` array is the primary provenance boundary for a requested-root module error.
4. When `roots` is absent, only exact equality with the requested specifier may serve as fallback
   provenance; package-name or URL-prefix matching is too broad.
5. An unrelated transitive module error must not erase an explicit requested-root package fact.
6. A root-attributable error wins over a coexisting package fact and remains fail-closed.
7. Process failure and ambiguity without an exact root fact remain fail-closed.
8. Minimum-dependency-age classification continues to come from Deno output; do not recreate Deno
   policy locally.
9. Graph collection owns integrity of the code-module graph, not every bundler-specific asset
   import. An unresolved target inside the positive code-module domain fails closed with its Deno
   diagnostic; an explicit local non-code asset target is an opaque leaf and does not become a graph
   node or edge. This boundary must not name SVG, Vite, or any plugin-specific asset type.

### Upgrade state and degraded input

10. Registry latest is not automatically actionable.
11. Failed JSR metadata is a failed probe, never an implicit `remote = local` success.
12. A Deno-selected version newer than the executing version is the only immediate upgrade target.
13. A newer registry version held by proven minimum-age policy is pending, not unavailable.
14. A genuine inability to establish requested-root selection remains resolver-unavailable.
15. Rendering and advisory persistence remain projections of the same derived state.
16. New regression tests enter through fact-producing boundaries and never hand-author `is.pending`
    or `is.resolverUnavailable` to force their expected state.

### Mutation and recovery

17. Cache refresh does not run without a verified target.
18. Post-refresh verification asks only what the reloaded public specifier resolves; it does not
    depend on a second registry metadata fetch.
19. Because refresh intentionally targets the unpinned public specifier, a resolved version newer
    than the pre-refresh target is a successful monotonic upgrade and must be reported as the actual
    installed version.
20. A resolved version below the target, an ambiguous fact, or resolver failure remains a hard
    verification failure.
21. A fixed published release must be discoverable by the currently deployed old client from a fresh
    external environment.
22. Old-client discovery depends on the candidate tools release having a clean code-module graph;
    the old client cannot consume the workspace resolver fix until after that upgrade succeeds.

## Final implementation boundary

### 1. Remove the redundant HTTP lazy boundary

In `code/sys/http/src/http.server/m.HttpServer/m.Server.ts`:

- replace the broken dynamic import with a static import of `keyboard` from `./u/u.keyboard.ts`; and
- expose that function through the existing `HttpServer.keyboard` member without a second wrapper.

`u/u.start.ts` already statically imports the same module, so the dynamic import provides no actual
loading boundary. Removing it makes normal static graph checks own the path and avoids a terminal-
binding smoke test whose behavior would be environment-sensitive.

The generic code-module graph regression below is the durable defect-class proof. The captured local
`deno info` result is the package-specific red evidence.

### 2. Separate requested-package resolution from graph health

In `code/sys/workspace/src/m.resolve/u.package.ts`:

- preserve `roots` in the reduced `PackageResolutionInfo` shape;
- define root errors as module errors whose specifier is exactly present in `info.roots`;
- only when `roots` is absent, fall back to exact equality with the requested specifier;
- remove fallback to the first arbitrary graph error;
- keep a root-attributable error ahead of package-fact acceptance;
- allow an explicit root package fact to survive every unrelated graph diagnostic; and
- preserve current process-failure, policy classification, and ambiguous-version failure behavior.

Do not add graph-health fields to `PackageResolutionFact`. Do not use package-identity or JSR URL
prefix matching for error attribution: that would misclassify an optional or lazy error elsewhere in
the requested package as failure to select its version and recreate the same category error one
level closer to the root.

The measured minimum-age output has literal requested-root identity in both `roots` and the error
module, while the HTTP error is an unrelated HTTPS identity. The successful-JSON branch is therefore
the complete causal repair surface for Deno 2.9.5.

### 3. Enforce code-module graph integrity without modeling bundler assets

In the existing `code/sys/workspace/src/m.graph` owner:

- retain optional `error` in the deliberately partial Deno info schema;
- define graph eligibility positively around Deno-native code-module roots and targets rather than
  maintaining a denylist of SVG or other plugin asset extensions;
- make `collectInfoJson` reject an errored code-module target, or an errored target whose identity
  is too ambiguous to classify safely, with the collection root, failing module, and Deno message
  preserved;
- treat an explicit local non-code asset target as an opaque leaf: omit its errored module record so
  it cannot become a normalized node or edge; and
- keep package ordering derived only from the resulting code-module graph.

`WorkspaceGraph.collect` already runs `deno info --json` over discovered package exports and is used
by workspace prep and `check:graph`. It owns code dependency integrity, but it does not certify or
model bundler asset pipelines.

Add two real temporary-workspace tests: a missing dynamic code-module import must reject, while an
unsupported non-code asset import must collect successfully with that asset absent from normalized
modules and edges. The control fixture must use a generic asset suffix so the policy cannot become
an SVG or Vite exception. Together these replace a flaky `HttpServer.keyboard` terminal smoke test.

### 4. Reject unavailable registry metadata as successful state

In `getVersionInfo`:

- retain the full `Jsr.Fetch.Pkg.versions` response;
- require `ok: true` and metadata data before assigning `remote`;
- propagate a bounded registry-fetch error otherwise; and
- never fall back from missing metadata to `remote = local`.

The detached advisory probe already converts a thrown version probe into an `ok: false` advisory
record. Foreground upgrade invocation must fail truthfully rather than rendering a green
`is up to date` assertion. This does not require a new advisory status or schema migration.

A genuine successful registry response with `remote === local` remains truthfully up to date even if
an unnecessary resolver probe fails; no parity-state change is required.

### 5. Verify refresh through the narrow resolver fact

Factor one internal helper for resolving the unpinned public tools specifier with the existing
`--no-config --no-lock` policy. Both `getVersionInfo` and post-refresh verification use it.

After cache refresh:

- call that resolver helper directly with reload enabled;
- do not call full `getVersionInfo`, because verification does not need registry metadata;
- require an unambiguous successful public-specifier fact;
- accept `resolved >= target` under semantic-version ordering because refresh intentionally targets
  the unpinned public specifier;
- fail when resolved is lower than target or unavailable; and
- print the actual resolved version, not the pre-refresh target.

This closes both the transitive-error false negative and the publication/minimum-age boundary race
without weakening the postcondition.

### 6. Surface bounded resolver recovery detail in the foreground

Keep root advisory startup fail-quiet. Every normal root invocation already starts a detached fresh
probe, so advisory TTL/liveness policy is a separate product decision, not part of this incident.

For explicit foreground `upgrade` invocation only, extend the existing resolver-unavailable block to
include:

- one bounded diagnostic line derived from `state.reason.message`; and
- the exact direct cache-refresh command as an operator retry path.

Do not describe that command as a policy bypass or guaranteed rescue. It cannot bypass minimum-age
policy and may remain on the current version until a clean release becomes eligible.

### 7. Preserve the current state compatibility boundary

Do not remove or rename `latest`, `actionable`, or `is.*` in this arc. Their overlap is real debt,
but combining that migration with the incident would enlarge compatibility and rollback risk.

The exact-latest probe remains gated on the initial pending state. No reachable contradiction was
established after fixing root resolution, and changing the gate would add an extra Deno graph probe
on the failure path without evidence of product benefit.

New tests must not author `is.pending` or `is.resolverUnavailable` to force expected state. They
enter through `getVersionInfo` with registry and resolver fact dependencies, or through the narrower
resolver helper for post-refresh verification.

## Required regression proof

### Red-before-green causal tests

The following must fail for their intended reason before the corresponding production change:

1. the captured/reduced Deno info shape, represented with neutral test identities, contains a valid
   requested-root package fact plus an unrelated HTTPS error and returns success only after the
   resolver correction;
2. `WorkspaceGraph.collect` over a temporary package rejects a missing dynamic code-module import,
   while a generic unsupported non-code asset remains an omitted opaque leaf;
3. failed JSR metadata must no longer produce a successful up-to-date `VersionInfo`;
4. post-refresh public resolution strictly newer than target must no longer throw; and
5. explicit resolver-unavailable output must include bounded reason/retry detail.

Record the red failure text during implementation before making each case green.

### `@sys/workspace`

Use the measured Deno shapes, reduced to `roots`, causally relevant `modules`, `redirects`, and
`packages`, with neutral `@test` and `example.test` identities in general behavior tests. Cover:

- explicit root package fact with no module errors: success;
- explicit root package fact plus an unrelated HTTPS error: success;
- requested-root minimum-age error with no package fact: policy failure;
- exact root error plus a package fact: root error wins and fails closed;
- roots-normalized attribution independent of module array order;
- multiple versions without an exact root fact: unchanged fail-closed behavior;
- local graph collection rejects a dynamic missing code-module entry; and
- local graph collection accepts a generic unsupported non-code asset import without emitting an
  asset module or edge.

Do not commit the 178,000-line raw tools graph. Retain the concrete observed
command/specifier/version provenance in this plan rather than presenting real `@sys` identities as
generic test fixtures.

### `@sys/tools`

Through `getVersionInfo` with fact-level dependencies and no hand-built `is` state, prove:

- unpinned selected version equals local;
- registry latest is newer;
- pinned latest receives Deno minimum-age policy;
- state is pending rather than resolver-unavailable;
- the table does not contain `local:next unknown`; and
- persisted advisory yields the root pending standdown prelude.

This consumer projection may characterize an already-correct downstream path; the resolver fixture
is the mandatory red causal test.

Also prove:

- failed registry metadata rejects and the advisory probe writes failure rather than success;
- post-refresh verification does not perform a registry metadata fetch;
- unrelated graph diagnostics cannot turn a successful root resolution into verification failure;
- resolution equal to target succeeds;
- resolution greater than target succeeds and reports the actual version;
- resolution below target or unavailable still fails;
- unavailable foreground output is bounded and actionable; and
- existing intermediate, refresh-failure, advisory-failure, and genuine resolver-unavailable cases
  remain intact.

## Release and bootstrap sequence

This incident is not fixed when only local tests pass.

1. Land and prove the HTTP static-boundary correction.
2. Land the workspace resolver correction and code-module graph gate together: one side accepts only
   requested-package facts, while the other rejects unresolved code dependencies without claiming
   ownership of bundler assets.
3. Land the bounded tools degraded-input and verification hardening.
4. Under separate human release authority, publish corrected `@sys/http` and `@sys/workspace`
   releases before publishing a tools release that pins both corrected versions.
5. Wait until the full corrected tools graph is eligible under Deno's active minimum-dependency-age
   policy.
6. From `/tmp` with isolated caches, verify both the current public entrypoint and the old-client
   bootstrap path.
7. Confirm the old `0.0.490` client discovers a concrete fixed target rather than `unknown`.
8. Confirm the corrected release persists pending/upgrade advisory truth and renders it on the next
   root invocation.

### Bootstrap truth

A deployed `0.0.490` process continues executing its old `@sys/workspace@0.0.147` resolver until it
successfully upgrades. Because `^0.0.x` ranges do not admit the next patch version, publishing the
workspace resolver fix cannot repair discovery in place.

Old-client discovery succeeds when the newest policy-eligible tools candidate has a clean published
code-module graph. The HTTP correction reaching that tools release is therefore load-bearing for
immediate bootstrap; the workspace resolver correction becomes active after the upgrade and prevents
the same category error in future probes. The local code-module gate makes that clean-candidate
assumption a release invariant without coupling release validity to bundler assets.

The existing direct cache command is a retry surface, not a guaranteed rescue and not a policy
bypass. Already-published clients cannot acquire corrected pending copy while the fixed release is
standing down.

No package publication, version bump, git operation, cache deletion, or arc progression is
authorized by this plan. Each requires the corresponding explicit human authority or completed gate.

## Proof commands

Focused deterministic proof from the workspace root:

```sh
deno task --cwd code/sys/http check
deno task --cwd code/sys/http test
deno task --cwd code/sys/http dry
deno task --cwd code/sys/workspace test:resolve
deno task --cwd code/sys/workspace test
deno task --cwd code/sys/workspace dry
deno task --cwd code/sys.tools test:upgrade
deno task --cwd code/sys.tools dry
deno task check:graph
deno task check
```

External proof after the corrected releases become policy-eligible:

```sh
cd /tmp
DENO_DIR=/tmp/@sys.tools-upgrade-proof-current deno run -A jsr:@sys/tools upgrade
DENO_DIR=/tmp/@sys.tools-upgrade-proof-0.0.490 deno run -A jsr:@sys/tools@0.0.490 upgrade
```

Before those probes, record the concrete fixed tools version and its JSR creation timestamp in this
plan. Preserve full command output. Use isolated paths that do not inherit the repository's active
`DENO_DIR`.

## Non-goals

- No structural upgrade formatter rewrite; one bounded resolver-unavailable diagnostic is allowed.
- No root-startup warning, advisory TTL, or liveness-policy redesign in this incident arc.
- No advisory schema migration.
- No `@sys/http`-specific resolver exception.
- No package-name or URL-prefix approximation of Deno root provenance.
- No local recreation of Deno minimum-age policy.
- No broad `VersionInfo` compatibility cleanup or removal of `is` in this arc.
- No change to exact-latest probe gating without a separately proven reachable contradiction.
- No whole-workspace release-system redesign.
- No SVG, Vite, plugin, or asset-extension exception in workspace graph policy.
- No claim that package selection proves every optional runtime feature works.

## Independent-review adjudication

The external `MATERIAL CONCERN` review was assessed finding by finding rather than adopted
wholesale.

- **F1 — confirmed defect:** transitive graph errors poison root selection; apply the core resolver
  correction.
- **F2 — confirmed manifestation:** the same fact poisons post-refresh verification; add diagnosis
  and proof, not a second resolver workaround.
- **F3 — accepted hardening:** missing registry metadata renders green success; failed metadata now
  fails the probe truthfully.
- **F4 — amended:** preserve and use exact `info.roots`; reject the proposed package-identity
  fallback as overbroad.
- **F5 — confirmed proof defect:** hand-built `is` can create false-green tests; new integration
  tests enter through fact boundaries, while only causal tests are required to be red.
- **F6 — amended after architecture review:** `WorkspaceGraph.collect` owns unresolved code-module
  dependencies, not bundler asset loadability. The initial fail-on-every-error implementation was
  rejected after the intentional UI asset control exposed the category mistake.
- **F7 — confirmed with correction:** old-client bootstrap uses a clean future code-module graph;
  HTTP cleanliness is load-bearing for discovery, the resolver fix activates after upgrade, and
  cache retry is not a bypass.
- **F8 — accepted narrowly:** resolver-unavailable discards useful reason; foreground output gains
  bounded reason/retry detail while root startup remains fail-quiet.
- **F9 — accepted hardening:** strict target equality fails on a newer resolved version;
  verification becomes monotonic and reports actual resolution.
- **F10 — confirmed canon breach, fixed:** the plan opening arc was absent; the canonical
  filename/arc block now occupies lines 1–7.
- **F11 — rejected:** resolver failure at registry parity is not false success; a successful
  registry fact equal to the executing version already proves up-to-date.
- **F12 — deferred debt:** compatibility version nouns remain untruthful; named follow-up is one-way
  raw facts to derived state, then retirement of `latest`/`is.latest`.
- **F13 — deferred observation:** the resolver has one cross-package consumer, but package placement
  is not causal and moves no boundary in this arc.

### Additional adjudication correction

Once failed registry metadata stops collapsing to local, full `getVersionInfo` is no longer a safe
post-refresh verifier: a transient second metadata failure could report failure after a successful
cache mutation. Post-refresh verification therefore uses the narrow public-specifier resolver helper
directly. This follows the same one-fact-per-question principle as the primary resolver correction.

### Degraded-mode decision

Every root invocation already starts a detached fresh advisory probe. Root startup remains
best-effort and fail-quiet so a transient network or resolver failure cannot dominate unrelated
tools. A future product decision may add an age-based health notice, but it requires explicit noise
threshold, staleness, opt-out, and recovery semantics and is not smuggled into this incident fix.

## Acceptance criteria

The implementation arc is complete only when all of the following are proven:

- unrelated transitive graph errors cannot poison requested-root package selection;
- Deno-root-attributable failures still win and fail closed;
- minimum-age policy remains Deno-derived;
- local workspace graph collection fails on unresolved code modules with causal diagnostics while
  omitting explicit non-code asset leaves;
- the redundant HTTP dynamic import no longer exists;
- failed registry metadata cannot produce a successful/up-to-date state or success advisory;
- both reported UI symptoms recover from the same corrected resolver fact;
- new projection tests do not hand-author derived `is` state;
- post-refresh verification is registry-independent, resolver-backed, monotonic, and reports the
  actual resolved version;
- foreground resolver failure exposes bounded evidence and a non-bypass retry command;
- all focused package, graph, dry-run, and root checks pass;
- corrected dependency and tools publication occurs only under separate human authority;
- the fixed tools release is verified outside the repository with isolated caches; and
- the exact old `0.0.490` client has a proven automatic path to that policy-eligible clean release.
