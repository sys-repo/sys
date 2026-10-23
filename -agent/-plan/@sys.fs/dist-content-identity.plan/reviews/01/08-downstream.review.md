# Review 08: downstream refusal and observation

## Verdict

**Request changes.** Three actionable gaps remain: an observation hook still accepts unsupported
Dist documents, Cell's public README still teaches manifest-byte pins, and the required integrated
own-key signing proof is missing. None of these findings establishes a bypass of pinned FS or Server
verification.

The reviewed producer guards, DenoEntry migration, Http.Origin wording, FilesStatic boundary, and
HTTP checksum distinction are sound in the inspected paths. Eleven narrow task invocations passed:
**16 tests / 79 steps, zero failures**. These are this review's executions, not inherited receipts.

This is a bounded assessment, not a clean whole-slice completion attestation. The remaining coverage
and freshness limits are explicit below, including incomplete transitive import-closure auditing.

## Authority and baseline

- Repository: `/Users/phil/code/org.sys/sys`.
- Governing artifact: `-agent/-plan/@sys.fs/dist-content-identity.plan.md`.
- Target: `feat(dist)!: unify build pins and verification on canonical content identity`.
- Assigned charter: `08-downstream.review.plan.md`; no sibling reports or handoffs read.
- Canon traversal completed; STIER, TMIND, and BMIND applied. Path discovery found no applicable
  additional scoped AGENTS in the reviewed source areas. Dependency-cache AGENTS were not activated.
- Entry and exit HEAD: `8d97fe4088bed6764e804424b767b089ffb13cf3`, matching Dist review R1.
- Read-only history confirms reachable exact-subject predecessors `e6316e80b` (Signer own keys) and
  `872b5a34d` (CompositeHash selected keys). Exact-subject search found no reachable target commit.
  The opening arc therefore remains two landed predecessors followed by the unlanded replacement.
- Staged diff was empty at entry and exit. Reviewed changes are unstaged, plus the three untracked
  producer-refusal test files listed below. The current hook and Cell README omissions are unchanged
  HEAD content that the explicitly required clean-break migration has not addressed.
- Plan contract, A–H, adversarial matrix, and completion boundary supplied requirements only. Its
  checkpoint and research claims were not treated as execution evidence or review conclusions.
- No source, task, dependency, profile, evidence, Git, or provider mutation was performed. Only this
  assigned report was authored. Test filesystem effects were temporary fixtures; loopback servers
  used ephemeral ports. No real build, bundle regeneration, payment, or publication ran.

## Findings

### 1. P2 — `useDist` still admits old and arbitrary JSON as the sole supported Dist type

**Evidence:** `code/sys.ui/ui-react/src/use/use.Dist/use.Dist.ts:39–47` (`loadJson`) calls
`fetch.json<t.DistPkg>` and publishes every successful JSON response through `update(res.data)`.
`toString` at lines 73–79 then uses package/build fields and `hash.digest` without recognition.
`code/sys/http/src/http.client/m.HttpFetch/u/u.make.ts::json` only decodes JSON; its generic is not
runtime validation. Compare the actual supported guard in
`code/sys/std/src/m.Pkg/m/m.Is.ts::PkgIs.dist`, already used by Http.Origin and Model-slug.
Only `use.Dist.sample.ts` was migrated in this hook directory.

**Executable sequence (source-derived, not run as a new hook regression):** serve the old pre-v2
manifest shape at the page-relative `dist.json`, retaining `pkg`, `build`, `hash.digest`, and
`hash.parts` but omitting `hash.scheme`. Mount `useDist()` with its default `sampleFallback: false`.
After the fetch settles, `json` exposes that unsupported document with no schema error and
`toString()` formats the old digest. Returning `{}` instead also reaches `json`, then causes
`toString()` to fail rather than report an invalid observation.

**Violated invariant:** Workstream H explicitly includes `use.Dist`; observation is not an accepted
old-format lane. A public `DistPkg` return must not silently contain unsupported input. This is
schema/clean-break failure, not a claim that this hook authenticates or executes payloads.

**Smallest correction / owner:** UI-react should fetch `unknown`, recognize the one supported shape
through its existing local `Pkg` surface before publishing it, and set a bounded schema error on
refusal. Keep manifest-only acquisition and existing explicit sample behavior; do not add pin
verification, a compatibility converter, or a second parser. Document `json` and formatting as
unpinned observations.

**Closing proof:** hook tests for supported v2 observation; missing/unknown scheme and old document
refusal; malformed JSON value without a formatting crash; no asset acquisition; existing bounded
fetch disposal and explicit sample behavior. A forged but structurally supported self-reported
digest may remain observable, provided it is not presented as verified content.

### 2. P2 — Cell's public prompt examples still request the removed byte-pin contract

**Evidence:** `code/sys/cell/README.md:106–107,121` teaches `<integrity>`, “checksum-pinned configured
views,” and publisher-provided `sha256-<exact-manifest-byte-hash>`. These are active usage examples,
not a negative fixture or archived evidence. They contradict the migrated
`src/m.help/yaml/dsl.pulled-view.yaml`, `dsl.examples.yaml`, `dsl.yaml`, and the Stripe view README.

**Misuse sequence:** a user follows the package README and obtains the SHA-256 of the published
`dist.json` document. That supplies neither the supported scheme nor the canonical payload digest
required by the current pulled-view flow. Relabeling that checksum as a v2 digest would select the
wrong preimage; asking for the old `integrity` slot cannot configure the supported input.

**Violated invariant:** active first-party documentation must teach the sole independent content-pin
contract without encouraging byte-pin conversion or automatic repinning.

**Smallest correction / owner:** Cell documentation should change these three active rows/slots to
`sys.dist/v2` plus the independently supplied content digest, with the same no-relabel/no-download-
derivation limit already present in its DSL. Do not alter retained historical records.

**Closing proof:** inspect the public README alongside the three DSL chapters and the Stripe view
README; a narrow active-doc residue assertion/search should find the old terminology only in
explicit refusal explanations. The passing bundled-help test does not cover the public README.

### 3. P2 — Required real own-key payload → signing → strict verification proof is absent

**Evidence:** `code/sys.driver/driver-signer/src/m.dist/-test/-.test.ts:214–309` tests parsed own-key
fixtures, signature verification, writeback/no-writeback, and descriptive-member tampering.
Its `canonicalOwnKeyFixture` has dummy part hashes, not real inventoried payloads.
The real compute/writeback test at lines 311–362 writes only `a.txt`, recomputes after signing, and
checks signature verification; it does not strictly verify the signed tree against the retained
pin. Conversely,
`code/sys/fs/src/m.Pkg.Dist/-test/-content.production.test.ts:58–86` creates real `__proto__` payloads
and runs pinned verification, but does not invoke the signer. Repository candidate search for
`DistSigner` found no additional integration test outside the Signer owner.

**Uncovered executable sequence:** create a real root `__proto__` file; compute and retain its v2
pin; sign with default descriptor writeback and the sidecar outside the strict payload tree; load
the resulting document; strictly verify that tree against the original pin. Then mutate a
prototype-sensitive descriptive member: the old document signature must fail while pinned payload
verification continues to succeed. None of the inspected tests executes this complete sequence.

**Violated obligation:** Workstream H and the adversarial matrix explicitly require this composition.
Separate component greens do not establish preservation through signer reconstruction/writeback.
This is a missing proof, not an observed current signer defect.

**Smallest correction / owner:** add one integration case under Signer's existing tests using public
`@sys/fs/pkg` and Crypto surfaces. Keep the standalone tests: default/no-writeback behavior, inherited
setter avoidance, and independently ordered signed bytes test different invariants. Do not make FS
import its downstream signer just to house this proof.

**Closing proof:** execute the complete sequence above, assert own membership and unchanged original
pin/digest after writeback, successful strict verification, successful original signature, and the
signature/content distinction after descriptive mutation. Put the sidecar outside the payload tree
so an undeclared sidecar is not hidden by producer ignore behavior.

## Consumer / refusal / observation coverage

Paths below are repository-relative. Entries identify the actual evidence inspected, not ownership
inferred from dirty status. `Executed` refers only to the task table below.

| Surface and inspected evidence | Obligation and observed disposition | Proof / limit |
| --- | --- | --- |
| `code/sys.tools/src/cli.crdt/cmd.doc.snapshot/u.calcAndSaveDist.ts`, `cmd.snapshot.ts`, `-test/-u.calcAndSaveDist.test.ts` | `computed.kind` is checked before returning path/data; the redundant second manifest write is gone. Command summary follows the awaited helper. Keep this single-writer arrangement. | Executed empty/no-file, retained-document, valid saved inventory controls. No nonempty-invalid caller test. |
| `deploy/@tdb.data/src/fs/m.DataPipeline/u.dist.ts`, `u.refresh.ts`, `-test/-u.dist.test.ts` | Mount/root refuse before returning output paths; mount list pushes only successful awaited results; root success follows both refreshes. Keep failure propagation rather than fabricate partial success. | Executed both producers' empty, retained-document, and Local.verify positive controls. Multi-mount partial-write reporting not independently tested. |
| `deploy/@tdb.edu.slug/src/m.slug.compiler/m.bundle/u.dist.ts`, `u.profile.ts` (finalization block), `u.run.ts`, `-test/-u.dist.test.ts`; compiler `-test/u.fixture.ts` | Count increments only after computed success; profile awaits finalization before returning its summary. Dedupe/missing/non-directory behavior retained. | Executed empty/retained refusal and unique-directory count. Positive test proves existence/count, not strict saved output; strengthen it. |
| `code/sys.driver/driver-deno/src/m.cloud/m.DenoEntry/u.checkSelfReported.ts`, `u.path.ts`, `m.serve.ts`, `-test/u.fixture.ts`, `-test/-m.serve.test.ts` | Sole Local verifier with finite limits; only cwd anchor real-pathed, selected subtree left observable for symlink refusal. Root manifest package label no longer drives selected package; source package remains local metadata. Keep trusted local-entry delegation separate. | Executed 11 steps including changed payload and cwd-alias/selected-Dist-symlink distinction. Startup consistency is unpinned, not continuing per-response verification. |
| `code/sys.ui/ui-components/src/ui.react/ui/Http.Origin/{common.ts,t.ts,use.Verify.ts,ui.Info.tsx,u.log.ts,ui.Action.Verify.tsx,-test/-use.Verify.test.tsx}` | Schema-only fetch stays explicitly unpinned; tooltip says self-reported digest and payload not verified. Do not turn this display into a verifier. | Executed forged declared digest accepted as observation, exactly one `/dist.json` request, custom URL, missing/non-Dist failures. Action default inspected in diff; full visual rendering not executed. |
| `code/sys.ui/ui-react/src/use/use.Dist/{t.ts,use.Dist.ts,use.Dist.sample.ts}` | Dummy sample is display data, not a real pin; no need to build/hash six fake assets. Actual fetch path still lacks recognition. | Finding 1; no dedicated hook tests discovered or authored. |
| `code/sys.model/model-slug/src/m.client/u.io.Dist.ts`, `-test/u.fixture.ts`, `-test/-bundle.dist.optional-assets.test.ts`, `-test/-m.io.timeline.Bundle.hrefResolver.test.ts`, `-test/-m.io.timeline.Bundle.test.ts` | Shared guard recognizes v2; client-scoped cache uses manifest base/directory, not a content digest as provenance. Own part membership gates optional manifests. Fake payload hashes remain structural fixtures, not byte proof. Keep this observation/cache arrangement. | Executed 19 steps retaining optional assets, missing playback, key-space, per-base cache, href/shard behavior, HTTP/schema/docid failures. |
| `code/sys/cell/src/m.cell/-test/{-u.dist.fixture.ts,-u.services.dist-host.test.ts,u.fixture.ts,u.sample.deploy.proof.ts}` | Producer pin flows to materialization/service YAML. Cleanup uses Rooted leases. Deploy evidence consumes content separately from document checksum and checks frozen inventory/exact files. | Dist lifecycle executed, 9 steps. Deploy sample proof inspected, not executed. |
| `code/sys/cell/src/m.help/{mod.ts,u/u.paths.ts,u/u.load.ts,-test/-.test.ts,yaml/dsl.yaml,yaml/dsl.examples.yaml,yaml/dsl.pulled-view.yaml}`, `src/m.cli/-test/-dsl.test.ts`, `-sample/cell.stripe/view/README.md`, `README.md:75–159` | Source DSL and embedded pulled-view help teach independent content pins; real sample intentionally has no invented pin. Public README remains stale. | Help task executed, 12 steps; loader imports bundled JSON, so this is generated help behavior, not merely reading YAML. Finding 2. Full raw bundle parity audit not completed. |
| `code/sys/http/src/http.cmd/-test/-static-dist-files.test.ts` | Exact response-byte checksum remains `Hash.sha256(Json.stringify(dist, 2))`; separate content inventory and build observation feed FilesStatic. Manifest-only requests are asserted. Keep this transport test independent of Dist pin acquisition. | Executed. Prior content-ref, URL encoding, policy denial, no asset GET, and unsupported watch assertions retained. |
| `code/sys/server/-sample/files.http.cmd/{-start.ts,common.ts}`, `code/sys/server/-sample/files.http.static/{-.test.ts,common.ts,dist/dist.json,docs/README.md}` | Command sample already had a failure guard; replacement narrows the new union and keeps temp cleanup. Static sample checks local consistency separately from exact-document transport. | Static sample executed, including retained fixture consistency. Command sample's changed lines and `prepareRuntime` inspected; interactive runtime not executed. Manifest/docs inspected through Git diff. |
| `code/sys.model/model/src/m.files.static/{t.ts,m.fromDist.ts,u/u.index.ts,-test/u.fixture.ts,-test/-m.fromDist.test.ts,-test/-dist-seam.test.ts}` | Structural adapter, not authenticator. Supported content inventory separated from optional descriptive buildTime; no implicit raw manifest promotion. Keep this separation and policy/cursor behavior. | 13 steps executed. Seam test changed assertions inspected via diff, not rerun. |
| `code/sys.driver/driver-signer/src/m.dist/-test/-.test.ts`, `code/sys/fs/src/m.Pkg.Dist/-test/-content.production.test.ts` | Dist signatures retain canonical-document meaning; FS owns actual tree proof. | Finding 3. Both test files inspected, neither suite executed here. |
| `code/sys.driver/driver-monaco/src/m.Vite/m.MonacoVite/{m.plugin.ts,u.emit.ts,u.hash.ts}`, `src/m.Vite/mod.ts`, `-scripts/task.browser-smoke.ts`; `code/sys.driver/driver-stripe/{deno.json,-scripts/task.vite.ts}` | Monaco emission compares complete path-to-hash maps and notice bytes using generic Dir.Hash; no reason to change that contract. Smoke code narrows `build.ok` before reading parts. Stripe delegates builds to Vite rather than owning another Dist encoder. | Source only. No Monaco/Stripe builds/browser/provider runs. Vite implementation itself belongs to the separate owner slice. |

Additional shared source inspected: `code/sys/types/src/t/t.Pkg.dist.ts`,
`code/sys/std/src/m.Pkg/m/m.Is.ts`, `code/sys/fs/src/m.Pkg.Dist/u/u.compute.ts`,
`code/sys/http/src/http.client/m.HttpFetch/u/u.make.ts:75–134`, and
`code/sys/testing/src/m.server/m.Testing/u.dir.ts`. The last confirms Testing.dir defaults to unique
OS-temp directories, not shared package build output.

### Prior assertion disposition and test economy

- Snapshot's double write was implementation duplication, not a useful assertion. New helper proof
  verifies that the single producer save yields the returned content. Keep both refusal and success.
- Model-slug fixture-only deltas replace old digest scaffolding without deleting behavior assertions.
  Cache, optional-assets, href, and schema-error tests remain distinct consumer contracts.
- DenoEntry retains every previous serve/entry/error assertion and adds the cwd-anchor contrast.
  The old generic self-report verifier is replaced, not retained alongside Local verification.
- Http.Origin retains resolver/status/error controls and adds the deliberately false declared digest.
  That is an important non-authority proof, not a defective cryptographic fixture.
- FilesStatic's prior successful size-less part acceptance is intentionally obsolete: v2 requires
  canonical lengths. `handles dist refs and URL edge cases without widening authority` now asserts
  `FilesStaticError.InvalidPath`; explicit-buildTime/no-buildTime equality protects the new seam.
- HTTP keeps all byte-checksum and no-payload-fetch assertions. Changing those checksums to a content
  digest would weaken the test, not modernize it.
- Cell's old fixture `integrity` input becomes the producer pin. The deploy proof's inequality between
  document checksum and content digest is now a fixture distinction, not two accepted Dist pins.
- Signer standalone own-key/no-writeback/canonical-byte controls were retained. They must not be
  deleted in exchange for the missing integration case.

Optional consolidation: the three Model-slug files repeat the same structural `makeDist` and
bounded-load wrapper. A module-local fixture helper in their existing `-test/u.fixture.ts` could
remove duplicate setup while keeping all cache, optional-fetch, URL, and failure assertions. Do not
share it with downstream deploy packages or replace these distinct assertions with one capstone.
The data pipeline's table over mount/root already shares setup economically. Keep the small
producer tests package-local; a cross-package fixture framework would cost more than it removes.

The primary production additions here are responsibilities, not new frameworks: discriminated
success propagation; one Local-verifier adapter with explicit limits; one observation action label;
and separate FilesStatic buildTime input. Each has a concrete consumer and can remain local.

## Dependency and authority audit

No inspected test imports a sibling package's private fixture to obtain that package's permissions.
The following are the meaningful nonlocal seams; relative local fixtures remain at their owner.
Owning `deno.json` was read for every executed task. Presets are selected by those tasks, not inferred
from imported package configuration.

| Test family / import trace | Actual owner and surface | Purpose, direction, runtime authority |
| --- | --- | --- |
| Snapshot `../../../-test.ts` → Tools `src/-test/mod.ts`; CRDT `common.ts` → Tools `common/libs.ts`; local `withTmpDir` | Public `@sys/testing/server`, `@sys/fs`, `@sys/driver-automerge/fs`; local private fixture stays in Tools | Consumer → FS producer/Local verifier; CRDT only supplies ID naming here. OS-temp reads/writes and env-backed helpers. Tools test preset additionally grants net/run, neither needed by this targeted fixture. |
| Data `src/-test.ts` → `-test/mod.ts`; pipeline common → FS common/libs; direct `Pkg` re-export | Public `@sys/testing/server`, `@sys/fs`, `@sys/fs/pkg` | Deploy consumer → FS producer. Temp filesystem; selected preset is read/write/env without net/run. |
| Edu compiler `-test.ts` → compiler common/mod + libs; bundle common | Public `@sys/testing/server`, `@sys/fs`; barrel also reaches public model-slug/bundle, FS capability, Automerge/fs, process/ffmpeg | Tests exercise local helper → public FS compute, not a downstream fixture. Executed under read/write/env, without net/run; no ffmpeg process launched. Full unused transitive initialization closure not separately audited. |
| DenoEntry `src/-test/mod.ts` → test common → runtime common; fixture | Public `@sys/testing/server` and FS/Pkg exposed by local runtime common | Driver → FS consistency; unique temp module and payload files plus dynamic local module import. Preset read/write/env/net/run; tested handler directly, no deploy/provider action. Final runtime barrel closure not exhaustively traversed. |
| Http.Origin `ui.react/-test.ts` → root `-test/mod.ts`; component common; direct Hash import | Public testing/server, testing/server/dom, ui-react/testing/server, crypto/hash, http/client; local UI helpers | UI consumer → HTTP/Std/Crypto. DOM mock and ephemeral loopback server, read/write/env/net preset, no build/run permission. Hashing prepares a structural fixture, not independent authority. |
| Model-slug local `u.fixture.ts`, common/libs | Public crypto/hash, std/pkg, http/client and std/shard | Pure descriptor fixture plus stubbed fetch; no real external requests. read/write/env preset, no net/run. Tests do not import FS producer or deploy fixture. |
| Cell Dist fixture imports `@sys/fs`, `@sys/server/t`, `@sys/testing/server`; service test imports `@sys/server/dist` and resolves public dist/service | Public FS producer, Server contracts/materializer/service | Cell composition → declared service owner. Unique temp stores, loopback transfer/hosting and lease cleanup. Cell preset also grants run/ffi/sys; targeted code does not need them for a real build. |
| Cell help via `u/u.load.ts` and public `@sys/cli/fmt` | Cell-owned embedded bundle and public chapter parser; no external fixture | Reads embedded resources and exercises local CLI API. Broad Cell test preset remains unchanged; no bundle generation. |
| HTTP static integration imports Files/FilesStatic and their named type namespaces | Public `@sys/model/files`, `/files/static`, `/t`; public crypto/hash | HTTP → public consumer protocol for composition test. In-memory inventory plus loopback server, read/write/env/net preset. No model-owned filesystem fixtures or build authority borrowed. |
| Server static sample common and added FsPkg import | Public FS/pkg, HTTP/client/static, Model/files/static, Crypto/hash, Std/json/pkg | Sample → public producers/adapters; read retained sample files, loopback transport. Server preset read/write/env/net/run; test does not rebuild sample or spawn a process. |
| Signer common.ts → crypto/hash, crypto/sign/ed25519, fs/pkg; common/libs | Public FS and Crypto | Appropriate downstream owner for real compute/sign integration. Required authority is temp read/write and generated test keys; no ambient signing identity/provider required. Not executed here. |

Support barrels opened for these traces include Tools `src/{-test.ts,-test/mod.ts,common/mod.ts,
common/libs.ts,cli.crdt/common.ts,cli.crdt/-test/-fixtures.ts}`; Data
`src/{-test.ts,-test/mod.ts,fs/common.ts,fs/common/mod.ts,fs/common/libs.ts,
fs/m.DataPipeline/common.ts}`; Edu `src/m.slug.compiler/{-test.ts,common.ts,common/mod.ts,
common/libs.ts,m.bundle/common.ts}`; Deno driver `src/{-test.ts,-test/mod.ts,-test/common.ts}`;
UI-components `src/{-test.ts,-test/mod.ts,-test/common.ts,ui.react/-test.ts}`;
Model-slug `src/common/libs.ts`; Cell `src/{-test.ts,common/libs.ts}`; Signer
`src/{m.dist/common.ts,common/libs.ts}`. Brace groups enumerate exact inspected paths.

This establishes the named public seams and observed task authority, not a complete proof of every
transitively imported module's initialization permissions. That deeper closure audit remains an
explicit coverage limit; successful execution is not a least-privilege proof.

## Commands and independent runtime evidence

Each command ran from the exact module directory shown. All used existing task presets and
`--cached-only --frozen`; no dependency regeneration or permission widening occurred.

| Module directory (relative to repository root) | Actual command | Result |
| --- | --- | --- |
| `code/sys.tools` | `deno task test:crdt:snapshot --cached-only --frozen` | 1 test / 2 steps |
| `deploy/@tdb.data` | `deno task test:dist --cached-only --frozen` | 2 / 4 |
| `deploy/@tdb.edu.slug` | `deno task test --cached-only --frozen --trace-leaks ./src/m.slug.compiler/m.bundle/-test/-u.dist.test.ts` | 1 / 2 |
| `code/sys.driver/driver-deno` | `deno task test --cached-only --frozen --trace-leaks ./src/m.cloud/m.DenoEntry/-test/-m.serve.test.ts` | 1 / 11 |
| `code/sys.ui/ui-components` | `deno task test --cached-only --frozen --trace-leaks ./src/ui.react/ui/Http.Origin/-test/-use.Verify.test.tsx` | 1 / 5 |
| `code/sys/cell` | `deno task test:help --cached-only --frozen` | 2 / 12 |
| `code/sys/cell` | `deno task test:dist --cached-only --frozen` | 1 / 9 |
| `code/sys.model/model` | `deno task test --cached-only --frozen --trace-leaks ./src/m.files.static/-test/-m.fromDist.test.ts` | 1 / 13 |
| `code/sys.model/model-slug` | `deno task test --cached-only --frozen --trace-leaks ./src/m.client/-test/-bundle.dist.optional-assets.test.ts ./src/m.client/-test/-m.io.timeline.Bundle.hrefResolver.test.ts ./src/m.client/-test/-m.io.timeline.Bundle.test.ts` | 4 / 19 |
| `code/sys/http` | `deno task test:unit --cached-only --frozen --trace-leaks ./src/http.cmd/-test/-static-dist-files.test.ts` | 1 / 1 |
| `code/sys/server` | `deno task test:unit --cached-only --frozen --trace-leaks ./-sample/files.http.static/-.test.ts` | 1 / 1 |

All results have zero failures. Deno warned that named config permissions are experimental. HTTP
emitted its legacy response-abort warning; no flag was changed to suppress or bypass it.

Read-only evidence commands included `git rev-parse HEAD`, `git status --short`,
`git diff --cached --stat`, scoped `git diff`, `git show HEAD:code/sys.ui/ui-react/src/use/use.Dist/use.Dist.ts`,
exact-subject `git log`, and reachability checks:

```sh
git show -s --format='%H %s' e6316e80b 872b5a34d
git merge-base --is-ancestor e6316e80b HEAD
git merge-base --is-ancestor 872b5a34d HEAD
git log --format='%H %s' --fixed-strings --grep='feat(dist)!: unify build pins and verification on canonical content identity'
```

Path discovery and candidate-only `rg` searches covered the charter's directories, active scoped
Markdown/YAML, `DistSigner` references under `code`/`deploy`, and Monaco/Stripe Dist/build seams.
Candidate content was then inspected with read or read-only Git. A broad diff containing generated
Cell base64 content was truncated; narrower authored-file diffs were subsequently inspected. No
conclusion depends on its omitted generated bytes.

## Drift check and evidence limits

- Repeated HEAD and staged checks matched entry. Repeated full authored diffs for producers/tasks,
  DenoEntry, UI observations, Model-slug, FilesStatic, Signer, Cell authored proof/help, and HTTP/Server
  samples matched the initially inspected hunks, not merely their status names.
- Reopened all three untracked producer tests at exit and compared their full contents: unchanged.
  They are `code/sys.tools/src/cli.crdt/cmd.doc.snapshot/-test/-u.calcAndSaveDist.test.ts`,
  `deploy/@tdb.data/src/fs/m.DataPipeline/-test/-u.dist.test.ts`, and
  `deploy/@tdb.edu.slug/src/m.slug.compiler/m.bundle/-test/-u.dist.test.ts`.
- No target drift was observed in those comparisons. Unrelated Cloudflare image/footer/Vite config
  and UI visualizer changes were not attributed to this slice or edited.
- This is not an immutable snapshot. Full raw generated Cell bundle byte-parity and every transitive
  dependency's entry/exit bytes were not independently captured. Bundled help behavior was executed,
  but status equality is not used to claim byte stability for the uncaptured surfaces.
- Coverage remains incomplete for exhaustive transitive test-import initialization authority,
  full generated-bundle parity, nonempty-invalid refusal at each secondary producer, and fresh
  execution of the signer composition (which is not yet implemented). The observed guards apply to
  all failed compute results, but existing caller tests exercise empty refusal only.
- Edu's positive caller proof should verify the resulting supported saved inventory, not only the
  file's existence. This is a proof-strengthening obligation, not evidence of a current bad write.
- No new source-level counterexample test was authored under review-only authority. Finding 1 is a
  deterministic control-flow prediction; Finding 2 is observed active documentation; Finding 3 is
  an observed missing required proof.
- No complete owner suites/checks, Cell deploy-authority execution, interactive command sample,
  real Monaco/Stripe/Vite build, browser runtime, external provider, or live JSR audit ran. None is
  represented by the 16 passing tests. Any shared build/browser follow-up requires a coordinator's
  serialized slot with its exact command/effects, not an independent parallel reviewer launch.

The remaining work is bounded owner correction and proof, not an argument for a compatibility lane,
new authority abstraction, automatic repinning, or replacement of sound observation consumers with
full verifiers.
