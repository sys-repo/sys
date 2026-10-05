@sys.workspace
workspace-ci-closeout.plan.md
- [x] 93dc483cc fix(workspace): skip implicit publish dry runs for private packages
- [x] ec7925589 chore(tmpl): refresh repository template dependency snapshots
- [x] f2a6c3bfb fix(sample.r2): finish delivery presentation without custom asset sources
- [x] f50801189 style(tools): format Dist preview parity assertions
- [x] 7c0a98d8b feat(testing): add scoped temporary-directory helper
- [x] b27b10169 refactor(testing): organize server testing utilities and tests
- [x] 7bd81cdf8 refactor(testing): establish semantic ownership of server helper contracts

## Outcome and boundary

Land the identified open tree in attributable cuts, preserve its planning records, push a clean
snapshot, and obtain GitHub CI results for that exact revision. Restore the normal commit/push/CI
cadence before starting another product arc. Finish existing work; do not create a hardening
programme. Phil explicitly extended this closeout with one shared temporary-directory lifetime
primitive and its immediate Deploy adoption, then server-testing utility/test organisation and
semantic contract ownership. These authorised follow-ups preserve runtime lifetime behaviour; they
are not a general helper-promotion programme. The contract-ownership cut intentionally tightens
operation variance, so retained flat names are not a guarantee of full source compatibility.

Repository: `/Users/phil/code/org.sys/sys`. The inventory below was taken at
`57b80ef73af655f44efbcf8f8a24c1e67ef42067`; it is a bounded intake snapshot, not a second landing
ledger. Re-enumerate tracked, staged and individual untracked paths before each cut. Dirty state is
not ownership. Newly appearing or unattributable changes require a human scope decision, not silent
absorption, deletion, stashing, ignoring or a false clean-tree claim.

The opening arc is the sole landing ledger. Its subjects describe expected outcomes, not completed
implementation. Revise a subject or remove a no-op item only through an explicit plan-scope decision;
never manufacture a commit merely to check a box. Source and plan-artifact commits remain separate.
Phil requested treating retained-plan reconciliation as working-plan maintenance, not a separate
implementation cut. The former docs item is therefore removed rather than checked with a fictional
landing hash. Working plans may remain uncommitted; any later preservation or lifecycle action needs
its own explicit human instruction and never appears in this plan's source arc.

### Current closeout assessment

Observed at `b8bb8389a41d82c998ed1bafd03dc03e65d23002`: all seven source cuts above are landed.
Subsequent independent dependency upgrades, CRDT proof corrections, and workspace refresh are real
history, not extra items retroactively absorbed into this arc. The current root lockfile has no live
delta. Pending work is five modified tracked plans and seventeen untracked planning artifacts,
including this record; no assessed paths are staged. The excluded buffer remains outside this
assessment.

Source-arc completion is not final workspace closeout. Exact-candidate root/graph/build proof,
explicit planning-artifact disposition, the human push, and required hosted results remain pending.
Keeping working plans uncommitted is valid, but does not satisfy the existing clean-tree exit
criterion; changing that criterion requires a separate explicit decision. No new test, build,
published-consumer, provider, or hosted result is supplied by this maintenance update.

## One owner, no roadmap duplication

- [dist-content-identity.plan.md](../@sys.fs/dist-content-identity.plan.md) and
  [vite-build-repair.plan.md](../@sys.driver-vite/vite-build-repair.plan.md) remain completed source
  arcs. Do not append residual changes, retest their whole history, or reopen them for this closeout.
- [html-subresource-integrity.plan.md](../@sys.driver-vite/html-subresource-integrity.plan.md)
  retains the landed capability/image arc and future sample SRI adoption. This closeout owns the
  residual sample presentation and compatibility correction, not integrity opt-in.
- [workspace-chunking-and-ui-components-bundle.plan.md](../@sys.driver-vite/workspace-chunking-and-ui-components-bundle.plan.md)
  retains workspace chunk resolution and measured bundle tuning. This closeout owns only disposition
  of the existing visualizer flag. Its disposition is not a completed chunking or performance item.
- [r2-public-delivery.plan.md](../@sys.driver-cloudflare/r2-public-delivery.plan.md) retains mixed
  delivery, credential closeout and service-worker integration; hosted execution remains with its
  exposure owner. No provider work or service-worker change is needed to land this tree.

Phil approved the next-work order: finish this closeout, then sample SRI adoption, workspace chunk
resolution and ui-components bundle tuning, and the R2 public-delivery follow-on. SRI adoption does
not depend on the chunk-resolution repair; taking it first clears the remaining sample-integrity
item without moving it into this closeout. Existing product arcs and their internal order remain
unchanged. Approval of this planning revision alone authorises no source implementation or Git action.

These are ownership/navigation links, not prerequisite items or a dependency chain. Do not copy
another plan's commits into this arc. The open-tree closeout must not wait for those future arcs.
Existing release-hardening and external-consumer proof plans do not govern routine template refresh
or this landing operation; their independent work remains outside scope.

## Source cuts: inventory and authorised extension

Paths below are repository-relative. Attribution is by semantic delta, not directory proximity.

### 1. Private-package command selection

- `code/sys/workspace/src/m.run/u/u.worker.ts`
- `code/sys/workspace/src/m.run/-test/-u.worker.test.ts`

Preserve explicit non-empty tasks for private packages, skip only their implicit publication dry-run,
and retain public fallback and missing ordinary-task behaviour. Verify the three command-selection
cases and the owning workspace check/tests. The historical R3 correction receipt is provenance, not
proof of the final candidate. Do not alter publication policy, other task dispatch or CLI architecture.

### 2. Template dependency snapshots

- `code/-tmpl/-templates/tmpl.repo/-deps.yaml`
- `code/-tmpl/-templates/tmpl.repo/imports.json`
- `code/-tmpl/src/m.tmpl/-bundle.json`

Verify the existing selected versions against their owning workspace declarations and generator,
and exact source-to-embedded-bundle agreement. Preserve template preparation authority in
`code/-tmpl/-scripts/task.prep.ts`; do not hand-patch encoded payloads or change targets to make a
consumer check pass. Workspace-version agreement is not published-consumer acceptance.

Inspect declared preparation and test side effects before running them. The template bundle test can
rewrite the live bundle, and `prep` also cleans and bundles help. Avoid blanket regeneration; inspect
any resulting tracked/untracked delta and stop if it escapes this three-file outcome. No version
bump, dependency upgrade, registry acquisition or publication is authorised by this plan. A required
unavailable target or denied dependency is a reported blocker, not permission to bypass policy.

### 3. R2 sample presentation and supported asset handling

- `code/sys.driver/driver-cloudflare/-sample/deploy/-scripts/-test/-ui.images.test.ts`
- `code/sys.driver/driver-cloudflare/-sample/deploy/deno.json`
- `code/sys.driver/driver-cloudflare/-sample/deploy/src/-test/-app.test.ts`
- `code/sys.driver/driver-cloudflare/-sample/deploy/src/-test/-ui.render.test.tsx`
- `code/sys.driver/driver-cloudflare/-sample/deploy/src/m.app/u.http.ts`
- `code/sys.driver/driver-cloudflare/-sample/deploy/src/ui/index.html`
- `code/sys.driver/driver-cloudflare/-sample/deploy/src/ui/styles.css`
- `code/sys.driver/driver-cloudflare/-sample/deploy/src/ui/ui.App.tsx`
- `code/sys.driver/driver-cloudflare/-sample/deploy/vite.config.ts`

Finish the existing copy, table/caption styling and public-asset refusal assertions without redesigning
App or adding delivery machinery. Retain the distinction between manifest-byte checksums and content
identity. Configuration formatting must not change permissions or task semantics.

Resolve the convenience-link conflict at the sample, not by weakening the driver: remove the custom
`html.additionalAssetSources` override and use non-linked filename captions, retaining native image
references and public-R2 documentation links. Keep both accepted PNGs, their bytes, external delivery,
64-by-64 dimensions, footer placement outside React and public-only projection. Adjust only the
corresponding markup assertions. If clickable emitted-file captions remain a human requirement, stop
for that explicit scope decision; do not invent a transformer, runtime URL repair or SRI extension.

The current driver refuses custom HTML asset sources when integrity is enabled. Preserve that
refusal. Removing the unsupported composition is not SRI adoption or browser-enforcement proof.

Run the sample's owning tests and real build sequentially. Inspect written HTML and inventories for
both native image URLs, unchanged PNG bytes, no inlining, and only HTML as private payload. Retain
GET/HEAD refusal for public asset bodies through the private application, and the worker-output
refusal. No bucket publication, live reads, credentials, deployment, hostname change or SW admission.
Existing human layout acceptance is not a fresh browser/network proof; do not impose a new provider
or browser campaign for these captions.

#### Bounded R2 verification receipt

Observed against `ec79255897bc5f698e08d808b5c278a386492870` plus the sample candidate.
Paths in this receipt are relative to `code/sys.driver/driver-cloudflare/-sample/deploy`.
Git blob IDs bind the inspected source bytes, not landing state:

| Path | Blob |
| --- | --- |
| `-scripts/-test/-ui.images.test.ts` | `fefa6e1a92616f33e2e7adf91c72dbbbae474238` |
| `deno.json` | `58295747036e4e6f6ff80757b4f3807760795f5b` |
| `src/-test/-app.test.ts` | `e507f1be2c03d05b1c4f5c51a65f246ddf07d5da` |
| `src/-test/-ui.render.test.tsx` | `e7687db4692b1fa274d090dfce312eb9f006775f` |
| `src/m.app/u.http.ts` | `bfbfc9680632e5e296bb77fdc74695c28eb33ebb` |
| `src/ui/index.html` | `39534029533e4a12299ac3ae536bad56ec6a4d7c` |
| `src/ui/styles.css` | `9b49a98284288739cab7f536e9180e82239b4646` |
| `src/ui/ui.App.tsx` | `2451ca9197dc0e7353e62834ce7169962839c4e0` |
| `vite.config.ts` | `55b0a23efa9544d770e421fdc04cfa98abb39058` |

Initial commands ran from the sample module, tests before the build:

- `deno task test --frozen --cached-only --trace-leaks --filter 'native image examples'`:
  red on the new non-linked-caption assertion (2 anchors rather than 0), then green (1 step).
  The earlier leaf-name filter selected zero tests and supplies no proof.
- `deno task test --frozen --cached-only --trace-leaks`: 27 tests, 134 steps, 0 failures;
  includes exact accepted PNG SHA-256, public-only projection, UI checksum distinction and
  public-body GET/HEAD refusals before storage.
- `deno fmt --check ./-scripts/-test/-ui.images.test.ts ./deno.json ./src/-test/-app.test.ts ./src/-test/-ui.render.test.tsx ./src/m.app/u.http.ts ./src/ui/index.html ./src/ui/styles.css ./src/ui/ui.App.tsx ./vite.config.ts`:
  all 9 exact files pass; no formatter write.
- `deno task --frozen-lockfile build`: Vite 8.3.0 succeeds, 856 transformed modules,
  618225-byte payload total. This freezes task-level lock handling; the sample build task does
  not forward a child `frozen-cache` dependency policy. It is not a child cache-only receipt.
- `git diff --check -- code/sys.driver/driver-cloudflare/-sample/deploy` from repository root:
  passes. Post-build status adds no pending paths or tracked generator residue; index remains empty.

The TMIND/S-tier residue scan found one redundant per-link `data-image-link` assertion; the
whole-template absence assertion already covers it. After removing only that assertion, reran
`deno task test --frozen --cached-only --trace-leaks --filter 'native image examples'` (1 step),
`deno task test --frozen --cached-only --trace-leaks` (27 tests, 134 steps), and
`deno fmt --check ./-scripts/-test/-ui.images.test.ts`; all pass. The table records the polished
image-test blob. All other listed blobs are unchanged, so the real-build receipt remains bound
to the unchanged production bytes; no build rerun was needed for this test-only deletion.

Inspected both written HTML files and all three output inventories. Native image sources point to
public R2 at `pkg/a.BscawNaH.png` and `images/wax-seal.v1.png`, with no image inlining; captions
are plain code text, documentation links remain, and both images retain 64-by-64 dimensions outside
React. Private output contains only `index.html` and diagnostic `dist.json`. Both emitted PNGs in
original/public outputs and both tracked sources share Git blob
`9ab1bd18cd70f956c0efab237918cdf0062be49c`; tests pin their SHA-256 to
`9a110325ca0d22eb23c6c88d60960fdd3c9d9b9c5ccaa331b0ac27679239d83a`.

Removing the dirty custom override restores `vite.config.ts` to its HEAD bytes: no config delta
needs manufacturing. Its worker refusal and the unchanged driver's custom-asset-source refusal
remain. Eight files retain attributable source deltas. This removes the unsupported composition
without relaxing delivery boundaries or changing task/permission semantics. No SRI adoption,
browser-enforcement proof, provider publication, live reads or security certification is claimed.

### 4. Canonical Dist preview parity test

- `code/sys.tools/src/cli.deploy/-test/-u.preview.parity.test.ts`

Phil explicitly expanded this one-file cut after the formatting-only handoff: replace static YAML
line arrays with `Str.dedent`, remove direct Deno networking in favor of the public testing helper,
and reduce nesting and repeated setup with functional TypeScript. This replaces the existing local
item; it does not add a new source owner or reopen the Dist migration.

Preserve staged-root/content correspondence, successful-response hashes, unknown-path refusal,
explicit listener cleanup, port availability and content-mismatch refusal. Use `Testing.connect`
on the exact IPv4 loopback port, and require `ConnectionRefused` rather than accepting arbitrary
transport failures. Separately require `Net.Port.inUse(port) === false` to retain the bind/release
proof: its conservative public probe includes IPv4 and supported IPv6 wildcard/loopback targets.
Neither check reserves the port. Exercise the release assertion against a live listener to avoid
a vacuous closed-port proof. Retain one fixture lifetime, safe cleanup if an unexpectedly admitted
server starts, equivalent YAML mapping data, and canonical filesystem paths. Use `Obj.keys` for
manifest paths and `Is.str` for the parsed checksum guard. No producer, provider or shared-helper
changes. Run the scoped real parity test, owner check, and exact-file format/residue inspection.

The earlier formatting-only receipt below is historical, not proof of the refactored candidate.
Bounded proof against `f2a6c3bfbe216ef823bdf7590749119d9b888b0d` plus tools candidate blob
`cdad2453ec0046c62eb246ab140cbef4fc8caff9`: from `code/sys.tools`,
`deno fmt --check ./src/cli.deploy/-test/-u.preview.parity.test.ts` passes (1 exact file).
Repository-root `git diff --check -- code/sys.tools/src/cli.deploy/-test/-u.preview.parity.test.ts`
also passes. Full hunk and punctuation-level word-diff inspection show only wrapping the existing
three-argument `assertCheckedResponse` call and its formatter-authored trailing comma; arguments,
assertions, fixtures and listener lifetime are unchanged. No source edit or formatter write was
needed; no behavioral test rerun is claimed or required for this formatting-only delta.

Refactored-candidate proof against the same base plus tools blob
`7b0f7f54783f4b450fc318df99082c69846b5d07`: the original parity suite passed before the edit
(1 test, 1 step). This is a refactor, not a reproduced production bug, so no production red snapshot
is claimed. The permanent live-listener negative control exercises refusal of the release assertion;
after normal close and rejected mutated-root startup, both exact-loopback connection refusal and
the canonical bind-availability probes succeed. An unexpectedly admitted server is closed before
the missing-refusal assertion fails. The fixture still stages and verifies the declared root;
YAML mapping data and staged file contents are preserved.

From `code/sys.tools`, final-byte commands pass:

- `deno task test:deploy --frozen --cached-only --filter '/Deploy: (preview status|staged artifact and standard Dist serving parity)/'`
  — 2 tests, 2 steps; 0 failed; 40 unrelated tests filtered out; leak tracing is owned by the task.
- `deno task check --frozen --cached-only` — owner check succeeds.
- `deno fmt --check ./src/cli.deploy/-test/-u.preview.parity.test.ts` — 1 exact file.
- `deno lint ./src/cli.deploy/-test/-u.preview.parity.test.ts` — 1 exact file.

Repository-root `git diff --check -- code/sys.tools/src/cli.deploy/-test/-u.preview.parity.test.ts`
passes. Complete live-file and hunk inspection confirms one attributable source path, no direct
Deno calls, no fixture-array text assembly, no duplicated startup options or redundant manifest-key
sort, and preserved parity/mutation/cleanup assertions. No formatter write, dependency acquisition,
permission expansion, provider execution or production/shared-helper change was needed. Post-proof
inventory has no new pending paths or staged deltas, and HEAD is unchanged. This bounded proof does
not replace final root/build/hosted evidence.

Verification binding for the historical subject in the opening arc:
`f508011897e4dd6b7aeefb6aa1149576c31652c2` contains exactly the parity-test path, with blob
`7f404ec66c73be65aa6b038083632e17e00efacf`. Compared with the reviewed candidate, the only further
change is a blank line before the negative-control comment. Fresh exact-file format/lint and the
same filtered Deploy task pass against these bytes (2 tests, 2 steps, 0 failures; 40 filtered out).
The commit diff also passes whitespace inspection. The historical `style` subject underspecifies
the refactor but must remain exact in the arc; no history rewrite is needed for content correctness.

### 5. Scoped temporary-directory fixture primitive

Phil authorised this next source cut after reviewing the concrete Deploy fixture helper. Add
`Testing.withTmpDir` to `@sys/testing/server`, independently prove its lifetime/error contract at
that owner, and immediately delegate the existing Deploy `withTmpDir` wrapper to it. One bounded
commit owns the primitive plus adoption; no workspace-wide fixture migration or new plan is needed.
The existing `Testing.dir` creates a directory handle without callback-scoped cleanup, so it does
not already supply this contract. Leave its API, location options and behaviour unchanged.

Original seven-file source boundary (byte-bound owner/consumer proof is recorded below; subsequent
organisation and type-ownership changes have their own boundary in section 6):

- `code/sys/testing/src/m.server/m.Testing/t.ts`
- `code/sys/testing/src/m.server/m.Testing/m.Testing.ts`
- `code/sys/testing/src/m.server/m.Testing/u.withTmpDir.ts` (new)
- `code/sys/testing/src/m.server/m.Testing/-withTmpDir.test.ts` (new)
- `code/sys/testing/src/m.server/m.Testing/-.test.ts`
- `code/sys.tools/src/cli.deploy/-test/u.fixture.ts`
- `code/sys.tools/src/cli.deploy/-test/-u.fixture.test.ts` (new)

Original helper declaration through the existing type spine and frozen `Testing` composition (the
semantic operation contract is now owned by `TestingServer.WithTmpDir`, described in section 6):

```ts
withTmpDir<T>(
  fn: (dir: t.StringAbsoluteDir) => T,
  options?: { readonly prefix?: string },
): Promise<Awaited<T>>;
```

`T` is the callback's return type, including a Promise for async callbacks; `Awaited<T>` describes
the resolved result without pretending a returned Promise remains nested. Preserve the resolved
value and object identity rather than cloning or wrapping it. Prove sync/async result inference in
the checked owner tests through the existing `expectTypeOf` export.

The only option is a diagnostic prefix, defaulting to `sys.testing.`. Always allocate a fresh owned
OS temporary directory through `Fs.makeTempDir`; never accept a caller-owned directory for deletion.
Give the callback its canonical absolute path via `Fs.realPath`. Protect canonicalization as well as
callback execution after successful allocation, and await recursive cleanup of the original allocated
path through `Fs.remove` before settlement. Document awaited cleanup and propagated failures, not
unconditional deletion. A missing root already satisfies cleanup; other removal failures must fail.

Execution includes canonicalization and the sync/async callback. Settle only after cleanup:

| Execution | Cleanup | Outcome |
| --- | --- | --- |
| succeeds | succeeds or root already missing | return the resolved callback value unchanged |
| fails | succeeds or root already missing | rethrow the exact original execution value |
| succeeds | fails | rethrow the exact cleanup value |
| fails | fails | throw one standard aggregate with execution then cleanup diagnostics |

Use `Err.std` with an ordered two-element `errors` array for the dual failure. This is a standard
aggregate diagnostic, not a promise to retain raw error identity inside its normalized children.
Single failures retain identity even for non-Error throws: `undefined`, `null`, `false`, `0` and
strings. Track failure occurrence independently of the caught value; no truthiness/undefined sentinel
may turn a throw into success. `Err.Try.run` normalizes failures through
`code/sys/std/src/m.Try/u.catch.ts`, so it is not equivalent to this raw single-failure contract.
Native try/catch inside this resource-specific operation is justified; do not change `Try`, `Err`
or their public error semantics.

Allocation failure propagates directly: there is no owned path to clean. After allocation succeeds,
canonicalization failure skips the callback but still attempts cleanup of the original allocated
path exactly once. Await cleanup even when the callback fails. Do not hide failures, expand
permissions or add retries beyond existing `Fs.remove` semantics.

Use one implementation-module-only factory bound to the three operations `Fs.makeTempDir`,
`Fs.realPath` and `Fs.remove`. The public method binds the real operations; owner tests may bind
small deterministic fakes to exercise the same implementation. The seam is not re-exported from a
public barrel or accepted in public options. No general resource runner, filesystem adapter,
global monkeypatch or new mock dependency is needed.

Keep the local Deploy wrapper's existing async callback signature, generic return value, name and
`sys.tools.deploy.` default prefix, including omitted/explicitly undefined options and explicit
prefix overrides, while removing its allocation/canonicalization/deletion logic. Preserve the
existing destructured default rather than allowing an undefined override to replace it. Use the
existing testing export and avoid adding a production-common export solely for this fixture.
Keep authored Deploy fixture contents, parity assertions and existing call sites unchanged.

Owner proof must combine real filesystem tests of the public method with deterministic failure tests:

- fresh canonical usable paths; sync/async generic results (including undefined and object identity);
- cleanup before settlement after success, synchronous throw and asynchronous rejection, including
  exact non-Error single-failure values and an already-removed root;
- allocation failure without cleanup; canonicalization failure with no callback and original-path
  cleanup; original cleanup target when canonical and allocated paths differ;
- removal failure alone, execution-plus-removal failure and setup-plus-removal failure, with explicit
  order and both aggregate diagnostics; controlled deferred cleanup, not sleeps, proves settlement.
  Assert cleanup completion in both settlement handlers, with independent resolution/rejection cases
  that both fail against an isolated missing-`await` mutant;
- isolated nested/concurrent calls and neutral/default/custom prefixes;
- the existing API contract's exact additional method, frozen composition and inherited method
  identity, plus unchanged `Testing.dir` behaviour. Tests must not merely assert method existence.

Consumer proof covers the wrapper's default, undefined and custom prefixes, unchanged generic
results, cleanup and error delegation. Run the real parity/status tests, then all Deploy tests because
the shared local wrapper serves staging, endpoint and provider fixtures too. Its use in
`code/sys.tools/src/cli.deploy/-test/-u.stage.authority.ts` also requires the existing restricted
process proof: adding the testing import must not request env/net/run authority or relax any profile.
A refusal blocks this cut; do not expand grants or repair unrelated harness code.

Planned commands, run only during implementation, from their owning module directories:

- From `code/sys/testing`, start with
  `deno task test:unit --frozen --cached-only --trace-leaks --filter '/Testing[.]withTmpDir|Testing[.]dir|Server ← test helpers/'`,
  verifying that the new suite actually executes; then run
  `deno task test:unit --frozen --cached-only --trace-leaks`.
- From `code/sys/testing`, run `deno task --frozen-lockfile check`. The declared check wrapper contains
  `--`; appending child frozen/cache-only flags would make them paths. Task-level freezing is not
  child cache-only policy. Use the existing dependency graph, introduce no imports needing new
  acquisition, disclose that command's boundary, and stop at a dependency/authority refusal. Do not
  substitute a raw check or silently alter the task wrapper.
- From `code/sys.tools`, start with
  `deno task test:deploy --frozen --cached-only --filter '/Deploy: (temporary-directory fixture|preview status|staged artifact and standard Dist serving parity)/'`,
  then `deno task test:deploy --frozen --cached-only`, `deno task test:deploy:authority`, and
  `deno task check --frozen --cached-only`. The authority task owns its frozen/cache-only process
  commands; keep its declared presets unchanged.
- Check formatting/linting of only the exact touched source files from each owner, inspect every hunk
  and the complete tracked/staged/untracked inventory, and bind receipts to actual source bytes.
  Refresh final required root/build/hosted binding; old consumer proof does not prove this primitive.

TMIND design adjudication is grounded in the live `Testing.dir` implementation and API test,
`Fs.makeTempDir`/`realPath`/`remove`, `Err.std`, `Try` normalization, owner task definitions and the
Deploy wrapper's restricted-process consumer. The accepted constraints above address failure loss,
cleanup leakage, false-green tests, async result typing, compatibility and permission drift. This
was an in-thread design review, not a blind review or runtime receipt. Owner/consumer tests provide
implementation proof below, without adding a further review gate.

#### Bounded helper verification receipt

Observed from `f508011897e4dd6b7aeefb6aa1149576c31652c2` with the seven source bytes below.
Blob IDs bind proof and inspected deltas, not landing state:

- Testing paths relative to `code/sys/testing/src/m.server/m.Testing`:
  - `t.ts`: `ab3920c17530940f220ea7e69d6d8c4a2804c568`
  - `m.Testing.ts`: `1ac8cfdf1239a4bf17208485f8917e973b6dfa4c`
  - `u.withTmpDir.ts`: `7d406b5968ba405149d2ce2d6583100ab9288365`
  - `-withTmpDir.test.ts`: `22c6ea19f26d6c8e085fa172fe29e86c885e4aca`
  - `-.test.ts`: `fbcc6359aa5d1f7957ac28f1c72e4b55db04c79e`
- Deploy paths relative to `code/sys.tools/src/cli.deploy/-test`:
  - `u.fixture.ts`: `d60938f6b759c56bfc6fbf1432424976a07108dd`
  - `-u.fixture.test.ts`: `d534a057b3d46ac1a1a40e94b14ae0531962ea96`

The implementation-only factory first used the old allocation/realPath/try-finally idiom as a
controlled red baseline. Three owner steps failed for the intended gaps: missing cleanup after setup
failure, missing ordered aggregate diagnostics, and overwritten falsy callback failure. This was a
new-module regression baseline, not a reproduced production failure snapshot. The protected
canonicalization/callback phase and discriminated execution outcome then supplied green proof.

A human-supplied blind review identified a false-green scheduling checkpoint in the deferred-cleanup
case: observing cleanup entry did not prove that settlement depended on cleanup completion. The
accepted correction records completion after the controlled removal promise resolves and asserts it
in both settlement handlers. Resolution and rejection are independently registered cases, so a
failure in one cannot prevent the other from executing. The production lifetime logic is unchanged.

The corrected cases and deterministic fixture were replayed against an isolated copied kernel in
`code/sys/testing/.tmp/withTmpDir.hardening.mutant.test.ts`, via the owner's existing
`deno task test:unit --frozen --cached-only --trace-leaks ./.tmp/withTmpDir.hardening.mutant.test.ts`.
Only its relative common import was adapted for relocation: the intact kernel passed 1 test/2 steps.
Removing only `await` from that copy's `io.remove` call failed both completion assertions (1 failed
parent test/2 failed steps). The real factory then passed both cases in the focused and full suites.
No production mutation, sleep, global patch, permission change or harness repair was involved.
The negative-control kernel and replay are preserved under the same filenames with `.txt` appended,
keeping them outside ordinary test/check discovery. This closes the accepted finding locally; it is
not a new blind-review verdict on the revised bytes.

The separate human-supplied docs review's five corrections were accepted against live source:
TCP diagnostics rather than a returned connection, global console replacement/restoration without
forwarding and without overlapping captures, caller-owned directory creation/reuse versus scoped
path delivery without cwd mutation, file-only listing, and execution-then-cleanup normalized aggregate
diagnostics. Internal factory/fixture JSDoc is compact. These are comment-only changes within the
same seven-file boundary; no additional runtime behavior or public signature was changed.

All planned commands above were rerun from their owning modules on these final source bytes:

- Focused Testing proof: 3 tests, 35 steps; 25 unrelated tests filtered. The new suite executed all
  16 behavior steps, with real filesystem and deterministic failure/settlement coverage.
- Full Testing unit proof: 28 tests, 243 steps, zero failures; two deliberate constraint-transform
  fixture steps were ignored. This task deliberately excludes process/Chrome fixture execution.
- Focused Deploy fixture/parity/status proof: 3 tests, 5 steps; 40 unrelated tests filtered.
- Full Deploy proof: 43 tests, 414 steps, zero failures, with task-owned leak tracing.
- Restricted Deploy authority proof: 4 tests, 40 steps, plus `Deploy.stage authority proof passed.`
  The new Testing import worked without env/net/run expansion or profile changes.
- Both owner checks passed. Testing used the planned task-level freeze, not child cache-only policy;
  no new dependency acquisition or task-wrapper repair was introduced.
- Exact five Testing/two Deploy file formatting and lint checks passed without formatter writes.
  Every correction hunk and the seven-file boundary were self-reviewed; the supplied blind review
  examined the earlier bytes, not these revised bytes.

Formatter before-images were retained in each owner's ignored `.tmp` directory as `.txt` files.
Their initial TypeScript filenames accidentally entered Testing's full test/check discovery; those
attempts failed on backup-relative imports. Renaming only these agent-created copies preserved their
bytes, and the unchanged tasks passed on rerun. No ignore rule or task/harness repair was needed.
The complete inventory showed no additional source/config/lockfile delta beyond this boundary.
This is local owner/consumer proof, not final root/build/hosted CI evidence or release acceptance.

Non-goals: generic fixture/resource frameworks, disposables, hooks, retained directories, caller
cleanup policies, parent-directory/location options, cwd/HOME/env mutation, filesystem race or hostile
callback containment guarantees, `@sys/std`/`@sys/fs` changes, browser/provider execution and release
or dependency upgrades. This source boundary does not authorise wider fixture migration.

### 6. Server-testing organisation and semantic contract ownership

Phil authorised these two follow-ups to the helper cut. The organisation boundary moves three tests
into `-test/` and three utilities into `u/`, rewires the composition/imports, removes an unnecessary
one-line utility barrel, and fixes the inherited unused type import and awaited `exists` delegation.
The type-ownership boundary uses the existing namespace/type-plane/scoped-pool mechanisms rather
than introducing runtime machinery.

Current contract-ownership source boundary:

- `code/sys/testing/src/m.server/m.Testing/t.ts`
- `code/sys/testing/src/m.server/m.Testing/t.internal.ts`
- `code/sys/testing/src/m.server/m.Testing/common.ts`
- `code/sys/testing/src/m.server/m.Testing/m.Testing.ts`
- `code/sys/testing/src/m.server/m.Testing/mod.ts`
- `code/sys/testing/src/m.server/m.Testing/u/u.connect.ts`
- `code/sys/testing/src/m.server/m.Testing/u/u.dir.ts`
- `code/sys/testing/src/m.server/m.Testing/u/u.withTmpDir.ts`
- `code/sys/testing/src/m.server/m.Testing/-test/common.ts`
- `code/sys/testing/src/m.server/m.Testing/-test/-types.test.ts`
- `code/sys/testing/src/m.server/m.Testing/-test/-withTmpDir.test.ts`

`TestingServer` owns public `Lib`, callable operations and their supporting options/results in
`t.ts`. Internal declarations project those public contracts and add only the filesystem binding and
discriminated execution outcome. `Io` derives from `Fs.Lib`; failure values remain `unknown`. The
implementation pool stays scoped, the test barrel inherits its parent pool, and runtime entries
retain the public pool. Flat aliases project from the canonical owner with deprecated replacement
paths and a separate consumer/template migration boundary. No historical `LegacyLib` fixture
remains.

A supplied independent review identified method-to-function variance tightening and false-green
contract assertions. Phil explicitly accepted the safer strict function variance rather than
restoring method bivariance. Public documentation identifies this intentional source-compatibility
tightening; alias-name retention does not preserve the old substitution rules. The actual historical
commit subject in the opening arc is preserved without rewriting it to add a breaking marker.

The proof correction adds public contract/option anchors before internal-leaf exclusions, requires
failure-value narrowing, and rejects incorrectly typed inferred results. Eight isolated controls
failed for the intended reasons: `unknown` changed to `any`; callback results erased to
`Promise<any>`; method-origin connect bivariance restored; `TestingServer` or `WithTmpDir` removed
from each runtime entry pool; and the public type root's `WithTmpDir.Options` namespace removed
while the callable survived. The first three controls produce unused expected-error diagnostics; the
entry/root controls fail at unsuppressed positive anchors. Intact copied tests pass before and after
the mutations (2 tests, 21 steps); temporary copies were then removed. Live runtime kernels were not
mutated. These are local closure proofs, not another independent review verdict.

#### Bounded follow-up verification receipt

Verification ran against `b27b1016976610509469880f52122f34298e6115` plus the eleven-file candidate.
The inspected source snapshot is `7bd81cdf8ecaa7c313b5ed62888eff4b44b51b8b`; no post-commit test
rerun is claimed. Final commands from the existing owner surfaces passed:

- From `code/sys/testing`, focused
  `deno task test:unit --frozen --cached-only --trace-leaks --filter '/TestingServer type contracts|Testing[.]withTmpDir|Testing[.]dir|Server ← test helpers/'`:
  4 tests, 40 steps; the contract suite executes its strict-variance case.
- From `code/sys/testing`, `deno task test:unit --frozen --cached-only --trace-leaks`: 29 tests, 248
  steps, zero failures; two intentional fixture steps ignored. Process/Chrome campaigns remain
  excluded by the unit task.
- From `code/sys/testing`, `deno task --frozen-lockfile check`: succeeds on source and scripts. This
  is task-level freezing, not child cache-only policy; no task or permission preset changed.
- From `code/sys.tools`,
  `deno task test:deploy --frozen --cached-only --filter '/Deploy: (temporary-directory fixture|preview status|staged artifact and standard Dist serving parity)/'`:
  3 tests, 5 steps. `deno task test:deploy:authority`: 4 tests, 40 steps plus the child authority
  proof.
- Exact eleven-file formatting/lint and candidate whitespace checks pass; no formatter write.

The organisation cut independently retained the helper's 28-test/243-step owner proof and focused
Deploy/authority proof. These follow-ups do not reopen settled lifetime design or claim root/build,
hosted-CI, release, or published-consumer acceptance.

### 7. Visualizer disposition

- `code/sys.ui/ui-components/vite.config.ts`

Phil chose to discard the package-local `visualizer: true` addition. Removed only that line,
restoring the config to HEAD bytes, and removed the no-op commit item from this arc. The driver's
feature/defaults and the separate chunking/bundle plan remain unchanged; no source commit or
visualizer proof lane is required for this disposition.

## Planning artifacts: separate bounded intake

The authoring inventory had these seven modified tracked artifacts:

- `-agent/-plan/@sample.r2/public-image-delivery.plan.md`
- `-agent/-plan/@sys.driver-cloudflare/r2-web-exposure.plan.md`
- `-agent/-plan/@sys.driver-pi/start-ui-release-evidence.plan.md`
- `-agent/-plan/@sys.fs/dist-content-identity.plan.md`
- `-agent/-plan/@sys.html/html-capability.plan.md`
- `-agent/-plan/@sys.workspace/native-windows-ci-baseline.plan.md`
- `-agent/-plan/@sys.workspace/release-hardening.plan.md`

It also had these twenty untracked artifacts:

- `-agent/-plan/-skill/review-docs.md`
- `-agent/-plan/@sys.cli/service-rendering.plan.md`
- `-agent/-plan/@sys.cli/system-owned-spinner.plan.md`
- `-agent/-plan/@sys.crdt/cmd-first-crdt-kernel.brief.md`
- `-agent/-plan/@sys.driver-crdt/cmd-first-kernels.plan.md`
- `-agent/-plan/@sys.driver-pi/pi-compile-cache-pr.plan.md`
- `-agent/-plan/@sys.driver-pi/upstream-runtime-compatibility.plan.md`
- `-agent/-plan/@sys.driver-vite/html-subresource-integrity.plan.md`
- `-agent/-plan/@sys.driver-vite/vite-build-repair.plan.md`
- `-agent/-plan/@sys.driver-vite/workspace-chunking-and-ui-components-bundle.plan.md`
- `-agent/-plan/@sys.fs/dist-content-identity.plan/reviews/PIPELINE.blind-review.md`
- `-agent/-plan/@sys.fs/dist-metadata.plan.md`
- `-agent/-plan/@sys.security/audit.plan.md`
- `-agent/-plan/@sys.tools/deploy-state-containment.plan.md`
- `-agent/-plan/@sys.tools/upgrade-resolution-truth-and-release-recovery.plan.md`
- `-agent/-plan/@sys.ui-components/dev-composition-primitives.plan.md`
- `-agent/-plan/@sys.ui.react.files/files-info-panel-config-stable-switch-order.plan.md`
- `-agent/-plan/@sys.ui.react.files/files-info-panel.status-recovery-events.plan.md`
- `-agent/-plan/@sys/descriptive-string-assertion-cleanup.plan.md`
- `-agent/-plan/@sys/proof-fidelity.plan.md`

Include this new plan and the subsequent bounded planning/record cleanup in the artifact intake.
Recheck the inventory before preservation; concurrent authors retain ownership. Read each changed/new
artifact before proposing its exact keep/correct/remove disposition to Phil. Canonical skills stay in
`../sys.canon/skills/`; a local note must not silently become a duplicate or new instruction authority.
No unknown content is swept into a catch-all commit.

Reconcile identity headers, uniquely evidenced landing hashes, live/recovery links and changed claims;
preserve evidence limits and completed history. Future drafts may be preserved without being called
implementation-ready. If a draft's correctness needs unresolved design, say so; do not execute or
redesign its product arc to preserve the document. No copied live arcs in an index/buffer, invented
prerequisites, review gates, readiness claims or blanket reformatting of retained plans. Lifecycle
snapshot/archival remains a separately authorised human action, not automatic cleanup.

The three temporary `Relationship to open-tree closeout` sections have been removed; navigation
stays one-way here. Working-plan maintenance leaves the product plans independent, with no live
assignment to spent closeout work or unbound post-closeout baseline. Preserve genuine
prerequisite/recovery anchors, especially R2's extraction references.

### Reconciliation inventory receipt

Inventory at `7bd81cdf8ecaa7c313b5ed62888eff4b44b51b8b` contains five modified tracked plans and
seventeen untracked planning artifacts, including this plan. These counts are an intake snapshot,
not a second live ledger or an authorised disposition. The earlier inventory remains historical. The
excluded `-agent/-plan.buffer.md` is outside reading, review, reconciliation and tracking changes.
Retained artifacts require their own per-artifact inspection and disposition; updating this plan
does not authorise a catch-all commit or execution of their product arcs.

That historical inventory exposed a separate root `deno.lock` delta: additions for `@std/io`,
`@std/json` and `chai`, plus dependency edges for the former two. Its original process attribution
was not established by the observed diff. At the later `b8bb8389a` assessment the live lockfile is
clean; that reachable workspace-refresh commit contains those additions and edges. No acceptance,
reversal, dependency acquisition, or Git mutation was performed by this maintenance pass. This
supersedes the live-delta blocker, not the historical uncertainty or final-candidate proof burden.

### Per-artifact reconciliation evidence

Inspected at `226e19699d726e624d5f17d40191cd47fe3525ac` under Phil's explicit GO for the docs
item. The five tracked-plan diffs contain existing product design, prerequisite reconciliation,
proof, and formatting work; this pass does not claim authorship of those deltas. The seventeen
untracked artifacts are retained by their actual document purpose, not treated as completed or
implementation-ready because they are present. No deletion is proposed.

Paths in the table are relative to `-agent/-plan/`. “Keep” means retain the inspected artifact and
its independent boundary; it is not a staging recipe or authorization to execute its arc.

| Artifact | Retained boundary and disposition |
| --- | --- |
| `@sys.driver-cloudflare/r2-web-exposure.plan.md` | Keep hosted mixed-delivery preparation and outstanding live gate/proof. Repair identity/arc line shape, stale untracked/snapshot claims, and publisher-history wording; preserve existing product deltas. |
| `@sys.driver-pi/start-ui-release-evidence.plan.md` | Keep the separate published-product gate and proof. Repair identity/arc line shape and align the exposure handoff with the owning mixed-delivery plan; preserve existing product deltas and archived prerequisites. |
| `@sys.html/html-capability.plan.md` | Keep unchanged: human-approved design, three unchecked implementation items, and historical pre-migration typecheck failure. Approval is not execution authority or fresh proof. |
| `@sys.workspace/native-windows-ci-baseline.plan.md` | Keep preflight and future native-host proof separate. Repair identity header only; preserve existing product/review/provider-evidence deltas without claiming a hosted Windows result. |
| `@sys.workspace/release-hardening.plan.md` | Keep the existing Linux-workflow-path correction. The document lacks a canonical opening arc; creating one needs an explicit structural plan-scope decision, not invented subjects in this generic reconciliation. |
| `@sys.cli/system-owned-spinner.plan.md` | Keep bounded terminal-ownership design; repair identity header only. No spinner, consumer, dependency, or runtime work is executed. |
| `@sys.crdt/cmd-first-crdt-kernel.brief.md` | Keep unchanged as historical requirements input, not a second implementation plan. Its governing-plan link remains contextual. |
| `@sys.driver-crdt/cmd-first-kernels.plan.md` | Keep unchanged as prototype/comparison and draft-contract work, not production extraction. Independent source follow-ups at the current HEAD do not authorize adding arc items here. |
| `@sys.driver-pi/pi-compile-cache-pr.plan.md` | Keep unchanged: implementation and commit identity belong to the OSS Pi checkout; submission still needs its named external decisions. No OSS history or current upstream outcome is inferred from this workspace. |
| `@sys.driver-pi/upstream-runtime-compatibility.plan.md` | Keep unchanged: recorded compatibility failure and later official-release adoption remain distinct from upstream contribution. No release freshness or adoption is claimed. |
| `@sys.driver-vite/html-subresource-integrity.plan.md` | Keep unchanged: owner/image predecessors and unchecked sample adoption remain separate. Later writers and transitive resources remain outside its guarantee. |
| `@sys.driver-vite/workspace-chunking-and-ui-components-bundle.plan.md` | Keep unchanged: driver resolution precedes consumer tuning; A/B/C attribution and runtime proof remain required. No performance outcome is inferred. |
| `@sys.fs/dist-metadata.plan.md` | Keep unchanged as unfinished design, retaining its checked completed-identity prerequisite. Neither a new schema nor implementation readiness is supplied here. |
| `@sys.security/audit.plan.md` | Keep unchanged as dated unresolved source-security triage, explicitly not an implementation arc, completed audit, or exploit proof. Do not manufacture a commit ledger for this note. |
| `@sys.tools/deploy-state-containment.plan.md` | Keep unchanged: bounded implementation/verification receipts remain historical; the independent operational-workflow item and quiescent cleanup remain outside this pass. |
| `@sys.tools/upgrade-resolution-truth-and-release-recovery.plan.md` | Keep source corrections and unresolved publication/bootstrap acceptance; repair identity header and stale source-work-in-progress phase wording. No publication or external proof is performed. |
| `@sys.ui-components/dev-composition-primitives.plan.md` | Keep earned Dev Help composition and gated candidate controls helper; repair identity/header/hash presentation without changing arc membership or order. |
| `@sys.ui.react.files/files-info-panel-config-stable-switch-order.plan.md` | Keep host-owned switch-order design and conditional follow-on; move the unchanged arc into its canonical opening block. No state-model design or UI implementation is selected. |
| `@sys.ui.react.files/files-info-panel.status-recovery-events.plan.md` | Keep independent status-event draft; repair identity header only. Existing filename and candidate vocabulary are preserved. |
| `@sys.workspace/workspace-ci-closeout.plan.md` | Keep this governing closeout record, source receipts, excluded-buffer boundary, and separate final root/build/hosted proof. Plan preservation remains a separate human lifecycle action. |
| `@sys/descriptive-string-assertion-cleanup.plan.md` | Keep future clean-worktree maintenance contract; repair identity header only. Its canon anchor, launch prerequisites, and unattended execution are not exercised here. |
| `@sys/proof-fidelity.plan.md` | Keep bounded faithful-consumer follow-up and attributed historical failures; repair identity header only. No new external acceptance, release, or test result is claimed. |

Reachable history confirms the inspected local landing identities without changing historical
subjects, including repeated Pi evidence-bind and R2 presentation subjects. Filename-first and
wrapped live headers are file-shape repairs, not new dependencies, gates, or arc items. The security
triage and CRDT brief remain non-implementation records. Full live artifacts and all five tracked
plan diffs were inspected; the truncated R2 diff output was continued through its captured log.

Two bounded maintenance scope decisions remain before calling artifact reconciliation complete;
neither is a new source-arc item or authority to restructure another product plan:

- Authorize the canonical opening-arc conversion of `release-hardening.plan.md`, naming its
  intended membership/order while retaining the existing progressive, policy-sensitive boundary.
- Decide whether to include the currently unchanged `r2-public-delivery.plan.md` paragraph that
  still awaits extraction's final snapshot. The inspected live file is tracked and its prerequisite
  already has the reachable `df5e83456` preservation snapshot. The smallest correction replaces
  only that stale snapshot wording; it neither checks the service-worker item nor archives a plan.

Neither issue licenses deleting a document, reopening completed work, widening product scope, or
altering dependency metadata. Existing product-plan deltas remain distinguishable from this pass's
header/history/ownership corrections. No source tests, builds, publication, provider calls, or Git
mutations were run for this docs pass; local source proof above is not refreshed by these edits.

### Completed records and reachable preservation snapshots

These five primary plans remain completed records, not active implementation. Their reachable
preservation snapshots are recorded below; do not manufacture duplicate lifecycle commits. Preserve
historical subjects exactly. Deletion remains a separately authorised human cleanup, and retaining
these files does not reopen their completed arcs. Existing proof and evidence limits remain
unchanged; lifecycle subjects are recovery anchors, not independent completion proof.

- [dist-content-identity.plan.md](../@sys.fs/dist-content-identity.plan.md): `1c9d28c8c`,
  `plan(done): dist-content-identity.plan.md`.
- [vite-build-repair.plan.md](../@sys.driver-vite/vite-build-repair.plan.md): `de1941a42`,
  `plan(done): vite-build-repair.plan.md`.
- [r2-delivery-extraction.plan.md](../@sys.driver-cloudflare/r2-delivery-extraction.plan.md):
  `df5e83456`, `plan(done): r2-delivery-extraction.plan.md`.
- [public-image-delivery.plan.md](../@sample.r2/public-image-delivery.plan.md): `249eead71`,
  `plan(done): @sample.r2/public-image-delivery.plan.md`.
- [service-rendering.plan.md](../@sys.cli/service-rendering.plan.md): `c5335f112`,
  `plan(done): @sys.cli/service-rendering.plan.md`.

Keep Dist's companion records, including the neutral pipeline brief, with its preservation snapshot;
the review charters are supporting records, not separate implementation plans. Keep parked findings
recoverable and independently active follow-ups with their owners. Lifecycle commits stay outside
this arc. At later retirement, preserve surviving recovery references using final plan snapshot
identity rather than a source or removal commit. No settled source proof is reopened.

## Verification, assessment and landing cadence

Preserve the human-reported local CI result. The supplied terminal screenshot shows 56 packages,
10,828 tests, 45 reports collected and 11 not applicable, with Deno 2.9.7 and TypeScript 6.0.3.
It does not supply the full command, timestamp or exact source-tree binding and does not establish
builds, graph checks, Vite extra proof lanes, hosted CI or security certification. These are disclosed
evidence limits, not a reason to discard the result or restart every historical proof.

For each cut: inspect every hunk, perform the smallest owner proof, finish touched-file residue,
produce an exact source-only or artifact-only handoff, and obtain the precise human Git instruction.
Do not accumulate another unreviewed multi-package implementation tail. Use existing owner tasks
and permissions; retain frozen/cache-only policy where supported. Build lanes run sequentially.
No signing, trust, dependency-age, sandbox or permission bypass; stop at the actual refusal.

Before the final push, bind local verification to the final candidate and inspect generator/test
side effects. Root `deno task ci` runs check, dry, tests and info; it does not include all GitHub lanes.
The current check/dry wrappers can print a failed aggregate yet exit successfully. Require successful
aggregate outcomes and expected package coverage for check, dry and test, not merely a zero composite
exit. Record justified skips, including private packages' implicit publication dry runs, while
retaining their explicit tasks. Any failed aggregate or incomplete/unexplained coverage blocks
closeout. Final-candidate receipts must establish each stage's result and coverage. A task-wrapper
repair requires an explicit scope decision; no such source cut is added here.

Inspect the current workflow/task owners and cover required missing lanes without substituting a
base-suite pass:

- root local CI and `check:graph`;
- driver-vite's separate declared `test:proofs` lane; the current Linux workflow at `b8bb8389a`
  no longer invokes it, so do not describe it as current hosted coverage;
- the affected sample and ui-components declared builds;
- existing hosted browser/matrix jobs when GitHub runs them; no new browser/platform campaign.

Reuse a receipt only when its command, scope and candidate binding support the claimed invariant.
Refresh invalidated or missing proof, not every settled cut. If a generator changes tracked bytes,
inspect and rebind proof before landing; never hide the changes. Do not invoke provider tasks to make
local build/test evidence appear live.

Report whether the touched work improves stability and preserves security boundaries, with concrete
source/proof support and remaining limits. Distinguish independent pins from self-reported identity,
manifest correspondence from browser enforcement, lexical containment from filesystem/race safety,
and bounded acquisition from descendant containment. This is a touched-work assessment, not a new
repository-wide audit or a guarantee that the system is secure.

A finding either has a named in-scope defect, smallest correction and closing proof, or belongs to an
existing future owner. Architectural expansion, a new source owner or a new commit unit requires an
explicit plan-scope decision before edits. A reproduced required-CI failure blocks green closeout,
but does not authorise weakening tests, silently deferring it or repairing an unrelated programme.
Bring the causal evidence and bounded proposal to Phil. Keep intermediate red snapshots explicit.

Finish when the approved cuts are landed, every intake artifact has its authorised disposition,
`git status --short --untracked-files=all` is empty, the intended branch is pushed, and required GitHub
checks are green for that pushed SHA. Record exact local commands/results, source identity, pushed
branch/SHA and workflow run identities. Confirm the intended branch and remote before an explicitly
authorised push; do not invent branch configuration, push a publication tag or trigger a release.
A missing or red hosted result is pending, never inferred green from local tests.

Planning, review and a ready result authorise no source implementation, Git mutation or remote action.
The completed Dist/Vite records and future product arcs remain separate after this closeout.
