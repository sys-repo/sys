# Observation safety and operator contracts

## Verdict: changes required

Two observation-boundary findings remain: the guard exposes incompletely checked build metadata as
`DistPkg`, and `useDist.is.sample` reports configuration rather than the source of its current data.
The assigned active documentation makes the principal content-pin/document-checksum distinctions
correctly. No documentation rewrite or additional verification framework is justified by this pass.

Existing narrow tests passed: **5 suites, 27 steps, 0 failures**. The failure sequences below are
source-derived, not newly executed regressions. This is scoped review evidence, not whole-plan or
landing clearance.

## Target, authority, and source state

- Repository: `/Users/phil/code/org.sys/sys`.
- Charter: `04-observation-docs.review.plan.md` in this directory; requested configuration
  `gpt-6-astra • high` is not an attestation of the runtime model.
- Governing artifact: `-agent/-plan/@sys.fs/dist-content-identity.plan.md`.
- Target: attributable worktree behavior for
  `feat(dist)!: unify build pins and verification on canonical content identity`.
- Entry and final observed HEAD: `8d97fe4088bed6764e804424b767b089ffb13cf3`.
- Both checked predecessors are reachable with exactly the recorded subjects:
  `e6316e80b fix(driver-signer): preserve own keys in canonical Dist documents` and
  `872b5a34d fix(crypto): preserve every selected key in composite hash builders`.
  Reachable subject search found no target commit; the third item remains unlanded. No arc edit.
- Read the opening five lines and only the charter's named requirement sections of the governing
  plan. Applied repository/canonical instructions and STIER/TMIND. No prior reports, round 01,
  historical finding narratives, adjudications, recovery copies, or implementing conversation read.
- Entry `git status --short` showed extensive pre-existing work. The assigned observation and doc
  deltas are unstaged; `git diff --cached --stat` was empty at entry and exit. The hook test
  `code/sys.ui/ui-react/src/use/use.Dist/-.test.ts` and pure encoder
  `code/sys/std/src/m.Pkg/m/m.Dist.Content.ts` are untracked and were included, not inferred from HEAD.
- Attribution: the new unknown-JSON guard, v2 descriptor recognition, observation labels, negative
  controls, and migrated pin examples implement this target. Findings below identify remaining
  acceptance gaps in those seams; they are **not claims that every faulty line was newly added**.
  The downstream ModuleList renderer was read only to establish a concrete consumer failure.
- Exit comparison: repeated tracked content diffs for the observation files, guard, and all nine
  assigned docs matched their earlier diffs, including worktree blob identifiers. Reopened both
  relevant untracked files and compared their contents. Reopened the content type, R2 construction
  and route capture, Pull flags/help, Server result type/manifest admission, and Cell task config;
  no material change was observed in those comparisons. The governing opening block also matched.
- Root `deno.json`, `deps.yaml`, `imports.json`, `package.json`, and `deno.lock` had no staged or
  unstaged changes. Lock index identity was `9804db48f8ef3665d62432ce0598d27284c4df79` at both
  observations. Read dependency authority/import map/package dependencies and owning task/preset
  definitions before execution. Cell's existing `test:help` task delta was preserved.
- Evidence limit: this is not an immutable or complete transitive-source/cache/environment receipt.
  The generated help chapter was inspected through its owner and executed CLI; a later raw bundle
  diff was truncated and is not used as byte-complete bundle evidence. No claim of published JSR
  parity, provider behavior, or browser execution follows. No material drift was detected in the
  explicit comparisons above.

## Prioritized findings

### F1 — P1: incomplete shape recognition lets remote JSON crash an existing consumer

**Evidence**

- `code/sys/std/src/m.Pkg/m/m.Is.ts::PkgIs.dist` and `wrangle.distBase` check the build object and
  `build.hash`, but never validate required `build.size`, its numeric members, `build.time`,
  `build.builder`, or `build.runtime`.
- `code/sys/types/src/t/t.Pkg.dist.ts::DistPkg` promises all those fields after narrowing.
- `code/sys.ui/ui-react/src/use/use.Dist/use.Dist.ts:43-46` publishes the guard's successful result
  directly as `json?: DistPkg`.
- `code/sys.ui/ui-dev/src/ui.react.devharness/ui/ModuleList/ui.tsx::View` passes that observation to
  `Title`. `ui.Title.tsx:116-120::wrangle.dist` dereferences `dist.build.size.total` without a
  second guard, as the public type permits.

**Executable failure sequence, source-derived; not executed here**

1. Serve a successful JSON response from the hook's requested `./dist.json` URL with this value:

   ```json
   {
     "type": "https://example.test/dist-type",
     "build": { "hash": { "policy": "https://example.test/policy" } },
     "hash": {
       "scheme": "sys.dist/v2",
       "digest": "sha256-0000000000000000000000000000000000000000000000000000000000000000",
       "parts": {
         "index.html": "sha256-0000000000000000000000000000000000000000000000000000000000000000:size=0"
       }
     }
   }
   ```

2. The guard returns true: type/build/hash/policy/scheme/digest syntax and the nonempty encoded
   descriptor pass. No digest recomputation is expected of this observation guard.
3. Render ModuleList with a nonempty title. The hook publishes this value; Title reaches
   `size.total` with `size === undefined`, producing a TypeError during render. `build.size: null`
   supplies a second concrete variant.

**Violated invariant:** unknown observations must satisfy the shape being exposed before a consumer
can use its typed fields. Descriptive/non-authenticated does not mean structurally unchecked.

**Smallest correction and owner:** complete the shape checks at `@sys/std/pkg::Pkg.Is.dist`, using
canonical predicates, without adding cryptographic admission or making descriptive metadata part of
identity. If intentionally partial observations are desired instead, expose an honestly narrower
observation type and adapt consumers; do not keep asserting full `DistPkg`.

**Closing proof:** owner guard tests for omitted/null/array/wrong-scalar build members; a hook test
that rejects this response without publishing typed JSON; a narrow Title/ModuleList regression that
cannot crash on rejected observations. Retain valid controls with and without root `pkg`, and the
self-reported-digest negative control. The current guard suite's partial-object cases stop short of
an otherwise valid descriptor with missing `build.size`, so its passing result does not close this.

### F2 — P2: `is.sample` does not identify the observation's source

**Evidence**

- `code/sys.ui/ui-react/src/use/use.Dist/use.Dist.ts:9-10` constructs
  `is.sample = sampleFallback` on every render.
- Both remote success and the dynamic sample fallback call the same `update(dist)` with no
  source state. The flag also drives the effect dependency and fallback decision.
- `code/sys.ui/ui-react/src/use/use.Dist/t.ts::DistHook` exposes this as `is.sample` beside current
  JSON/error state, not as an explicitly named configuration flag.
- The hook test uses the same `sample` object as the successful remote response and the fallback
  fixture, never asserts `is.sample`, and never rerenders with changed options.

**Executable misuse sequence, source-derived; not executed here**

1. Mount `useDist({ sampleFallback: true })` and return a valid, distinguishable remote manifest.
2. Wait for successful acquisition. `json` is the remote document and `error` is undefined, but
   `is.sample` remains true. A caller using that flag to label the observation mislabels remote
   data as sample data.
3. Separately, settle a failed request into the explicit sample fallback, then rerender with
   `sampleFallback: false`. During that render, the existing sample is still in `jsonRef`, while
   `is.sample` is already false; clearing happens later in the effect. A render-time consumer can
   therefore label retained sample data as non-sample. This is a transient render sequence, not a
   claim that the sample remains after the new effect settles.

**Violated invariant:** permission to use fallback and actual observation source are different facts;
source/error/data must remain coherent across option changes.

**Smallest correction and owner:** `@sys/ui-react/use::useDist` should retain the actual source with
its observation and expose `is.sample` from that state. Keep `sampleFallback` solely as input policy;
clear/invalidate the old observation coherently when starting a replacement effect. Preserve the
remote error when fallback is used. No independent pin or new trust system is needed.

**Closing proof:** use different remote and sample fixtures; test remote success with fallback
allowed, malformed-success and rejected transport with fallback allowed/disallowed, and option
changes with delayed old/new completions. Assert source, JSON, and error together, including renders
across option changes and no late update after disposal.

## Untrusted-value and lifecycle proof map

| Invariant | Inspected/executed evidence | Limit or disposition |
| --- | --- | --- |
| JSON begins unknown | `use.Dist.ts` uses `fetch.json<unknown>`; HttpOrigin narrows fetched data with `Pkg.Is.dist` | Correct boundary direction; F1 prevents claiming complete shape recognition. |
| Null, arrays, unsupported/missing scheme are rejected | Executed `use.Dist/-.test.ts` invalid-value loop and Std guard suite | Existing negative controls retained; no conversion/legacy acceptance is needed. |
| Supported shape is observation, not pin authority | Executed HttpOrigin forged-digest test returns `ok`, retains the self-reported digest, and requests only `/dist.json` | Intentional positive control for observation, not a cryptographic weakness. Do not change it into a self-pinning verifier. |
| Malformed successful JSON is not remote success | Executed hook test gives `Invalid Dist observation.`, no JSON, and safe `(not found)` formatting | Its fixture set misses the F1 shape. |
| Explicit fallback retains failure evidence | Executed invalid-response fallback case retains the error and returns sample | F2: does not distinguish actual source, and uses identical remote/fallback fixture data. |
| Transport is bounded and origin/credential confined | Both hooks configure 16 MiB, 30 seconds, 3 redirects, exact requested origin and no credential origins; `HttpFetch/u.invoke.ts` checks requested/redirect origins and forces `credentials: 'omit'`, manual redirects and no referrer; `u.body.ts` bounds streamed bytes | Source inspection, not an executed browser/CORS or malicious-redirect test in this pass. Native parsing is not a preemptible CPU deadline. |
| Rejection settles without unhandled transport failure | Hook try/catch; HttpOrigin per-row try/catch/finally plus `Promise.allSettled`; Fetch's `u.invoke.ts` sanitizes acquisition/decode failure | Source-derived. Neither selected hook suite injects a rejected transport promise; malformed successful JSON is not that proof. |
| Unmount suppresses late acquisition | Executed useDist delayed-response test unmounts before resolving transport and asserts aborted signal/no JSON | Reaches the post-fetch disposal guard, not the delayed fallback-import completion branch. |
| Fallback completion is disposal-checked | `use.Dist.ts` checks disposal before import and after its await | Source-derived only. Static import of the sample in the test preloads that module; no delayed-import test exists in this suite. |
| Owned transport tails remain observed | Fetch operation observes late response completion and cancels its body; body reader cleanup handles cancellation; hook worker has rejection handling | Does not establish that every native/browser operation has drained when synchronous `dispose()` returns. No stronger disposal claim is made. |
| HttpOrigin resets/cancels on owner changes | `use.Verify.ts` disposes current runs on env/origin/verify changes and unmount; suppresses disposed results; disposes each fetch in finally | No pending-request unmount or option-change assertion in the five executed HttpOrigin steps. Full lifecycle coverage remains an obligation. |
| Display never says independently verified | `ui.Info.tsx` labels `manifest (unpinned)` and self-reported digest/payload-not-verified tooltip; action says `observe manifests` / `observed (unpinned)`; `u.log.ts` says unpinned | Keep these labels. Existing green check is bounded by that explicit context, not evidence of authenticated execution. No real-browser visual assertion was run. |

The existing HttpOrigin missing-document, malformed-document, custom-resolver, and valid-response
controls remain present. The changed success vocabulary is justified by the manifest-only contract;
the forged-digest control makes the narrower meaning testable. Do not retire those controls merely
to reduce test count.

## Active documentation: claim → owner evidence

All paths below are repository-relative. These are local-source comparisons, not published-doc
verification.

| Active document(s) and claim | Current type/source/test evidence | Assessment |
| --- | --- | --- |
| `code/sys.driver/driver-cloudflare/README.md`: independent v2 pin, bounded admission, immutable `content.parts`, later bodies not checksum-verified | `src/m.r2/t.ts::ReadRoute.FromDist`; `m.ReadRoute/m.fromDist.ts` calls `Pinned.admitManifest` then passes only `evidence.content`; `u/u.dist.ts` captures pin/limits, refuses old integrity and restricts routes to own parts or `dist.json`; `-test/-m.ReadRoute.fromDist.test.ts` admission/metadata/refusal assertions inspected | Example matches current fields and callback. Correctly warns that routed `dist.json` is fetched again and does not promote admitted inventory into later body assurance. Leave unchanged. |
| `code/sys/cell/README.md`, `src/m.help/yaml/dsl.pulled-view.yaml`, `dsl.examples.yaml`, `dsl.yaml`, and `-sample/cell.stripe/view/README.md`: independently supplied scheme/digest; configure before materialize; no automatic repin | Pull `u.args.ts` parses scheme/digest and refuses `--integrity`; `u.add.run.ts` validates a canonical independent pin before config creation; `u.fmt.ts` agrees on add versus execution; Pull argument tests inspected | Speech acts, sample slots, and current owner flags agree. Sample YAML is an authority fragment, not represented as complete Pull configuration. No obsolete working byte-pin instruction found in these assigned docs. |
| Active bundled Cell pulled-view chapter | `m.help/u/u.load.ts` loads `-bundle/-bundle.ts` JSON through `CliFmt.Chapters.Resources`; `CellHelp.Dsl.load` tests and `deno task cli dsl pulled-view` executed | Output includes `--scheme sys.dist/v2 --digest <digest>`, independent expectation, no relabel/repin, and owner configure/materialize separation. No generated bytes edited. README was separately inspected, not certified by help tests alone. |
| `code/sys/server/README.md`: content-pin mismatch versus document observation; publication and cleanup are independent; scheme-bound store | `m.server.dist/t.ts::MaterializeArgs`, `Success`, `Failed`, `FailureReason`; `u.materialize/u.manifest.ts` turns admitted content into checksummed resources; `u.failure.ts` separates `pin-mismatch` and asset `checksum-mismatch`; `u.run.ts` targets `sys.dist-v2/${pin.digest}`, fences manifest checksums and preserves publication/cleanup | README does not promise the removed failure `manifestChecksum` diagnostic field or an old-store fallback. A failed result is not described as proof of no publication. Leave the core wording unchanged. |
| Same Server README: equal-content reuse retains generation observations, not losing download metadata | `u.run.ts::settleInitialGeneration`, `promoteVerifiedStage`, `separateWinnerChecksum`, `finalEvidence`; untracked `-test/-content.identity.test.ts` inspected, including separate winner and ambiguous promotion controls | Source/test design supports the stated distinction. Not an independent execution of the Server concurrency suite in this slice. |
| `code/sys/fs/README.md`: Local consistency, independently pinned whole-tree verification, manifest-only admission, and single-file reads differ | `src/m.Pkg/t.ts::Dist.Verify`, `Local`, `Pinned`; `m.Pkg.Dist/u.verify/u.admitManifest.ts`, `u.manifest.ts`, `u.verify.ts`; selected local/admission tests inspected | Pin and successful document checksum are clearly separate. Pure admission does not read payloads; whole-tree verification reads and hashes assets. Retain this decomposition. |
| `code/sys/server/-sample/files.http.static/docs/README.md`: local fixture consistency → exact HTTP-response checksum → structural Files view, not independent inventory/payload authority | `files.http.static/-.test.ts::fetchDistDocument` obtains checksum from local fixture, uses bounded `Fetch.blob`, then passes `dist.hash` and descriptive buildTime; local consistency check precedes serving | Accurate assurance ladder. Sample test was inspected, not run or regenerated. It does not justify a browser execution or later-response integrity claim. |

Server source tests specifically retain an ordinary origin HTTP 412 as `resource-failure`, prove
wrong external content pins stop before asset acquisition, and assert the old failure checksum field
is absent. Those inspected assertions explain the documentation migration; they are not copied test
receipts. The content-identity test also retains pinned `/dist.json` refusal versus checked local
manifest delivery.

Optional prose improvement only: the Server README could name the asset failure as
`resource-pull` / `checksum-mismatch` next to `pin-mismatch`. Existing types and prose do not promise
the wrong field or authority, so absence of that extra example is not a material finding.

## Execution evidence

Commands were run sequentially from the repository root, changing into the owning module as shown.
No source/test/doc edits, formatter, build, dependency regeneration, profile/permission changes, Git
mutation, publication, credentials, or provider access were performed. The only authored file is this
report. No shared build/browser slot was requested or used.

```sh
cd code/sys.ui/ui-react && deno task test --cached-only --frozen --trace-leaks ./src/use/use.Dist/-.test.ts
cd code/sys.ui/ui-components && deno task test --cached-only --frozen --trace-leaks ./src/ui.react/ui/Http.Origin/-test/-use.Verify.test.tsx
cd code/sys/cell && deno task test:help --cached-only --frozen
cd code/sys/cell && deno task cli --help
cd code/sys/cell && deno task cli dsl pulled-view
cd code/sys/std && deno task test --cached-only --frozen --trace-leaks ./src/m.Pkg/-test/-m.Pkg.Is.test.ts
```

Outcomes, respectively:

1. useDist: 1 suite / 4 steps passed; stubbed fetch, HappyDOM hook execution.
2. HttpOrigin: 1 suite / 5 steps passed; isolated ephemeral loopback HTTP servers, disposed by tests.
3. Cell help/DSL: 2 suites / 12 steps passed, including the active bundled content-pin assertions.
4. Cell owner help printed successfully before the next CLI invocation.
5. Active bundled pulled-view chapter printed successfully; no config/materialization operation.
6. Std guards: 1 suite / 6 steps passed; fixture-only guard tests.

All test commands used each owner's declared `test` preset and cached/frozen resolution. CLI tasks
used the declared `cli` preset; their wrapper does not forward extra Deno dependency switches before
the script, so those two invocations are not claimed frozen/cached-only. No dependency-file changes
were observed. Deno emitted only its experimental-config-permissions warning.

`deno --version` reported Deno 2.9.7, aarch64-apple-darwin, V8 15.0.245.2-rusty, TypeScript 6.0.3.
React 19.3.0, ReactDOM 19.3.0, Testing Library 16.3.3 and HappyDOM 20.14.5 are declared by inspected
package/dependency authority; installed cache bytes were not independently audited.

History/state proof commands included:

```sh
git rev-parse HEAD
git status --short
git diff --cached --stat
git log --format='%h %s' --fixed-strings --grep='feat(dist)!: unify build pins and verification on canonical content identity'
git merge-base --is-ancestor e6316e80b HEAD
git merge-base --is-ancestor 872b5a34d HEAD
git show -s --format='%h %s' e6316e80b 872b5a34d
git ls-files --stage -- deno.json deno.lock deps.yaml imports.json package.json
```

Also used path discovery, narrow candidate-line searches followed by reads, and scoped content diffs.
The initial combined diff exceeded the output cap; relevant observation/doc diffs were subsequently
read in smaller groups. No conclusion relies on omitted output. A leading-hyphen `find -agent`
failed and was corrected to `find ./-agent`; two exploratory reads for nonexistent
`m.help/u/u.bundle.ts` and `m.HttpFetch/u/u.request.ts` returned ENOENT, after which actual owner paths
were discovered. No permission or provenance denial occurred.

## Inspected source inventory and remaining obligations

In addition to all ten primary observation files and all nine primary docs explicitly listed in the
charter, opened these supporting files (ranges where noted):

- `code/sys/types/src/t/t.Pkg.dist.ts`.
- `code/sys/std/src/m.Pkg/m/m.Dist.Content.ts`, `u/u.toPkg.ts`,
  `-test/-m.Pkg.Is.test.ts`.
- `code/sys.ui/ui-dev/src/ui.react.devharness/ui/ModuleList/ui.tsx` and `ui.Title.tsx`.
- `code/sys.ui/ui-components/src/ui.react/ui/Http.Origin/common.ts`, `u.log.ts`, `ui.Value.tsx`.
- `code/sys.ui/ui-react/src/-test.ts`, `src/m.testing.server/u.renderHook.ts`,
  `src/m.testing.server/common.ts`; UI-components `src/ui.react/-test.ts`, `src/-test.ts`,
  `src/-test/mod.ts`.
- `code/sys/http/src/http.client/m.HttpFetch/m.Fetch.ts`, `t.ts` (first 150 lines),
  `u/u.make.ts`, `u/u.invoke.ts`, `u/u.operation.ts`, `u/u.body.ts`.
- `code/sys.driver/driver-cloudflare/src/m.r2/t.ts` (ReadRoute contracts),
  `m.ReadRoute/m.fromDist.ts`, `m.ReadRoute/u/u.dist.ts`,
  `-test/-m.ReadRoute.fromDist.test.ts` (first 300 lines).
- `code/sys.tools/src/cli.pull/u.args.ts`, `u.fmt.ts`, `u.add.run.ts`,
  `-test/-u.args.test.ts`.
- `code/sys/cell/src/m.help/mod.ts`, `u/u.load.ts`, `-bundle/-bundle.ts`,
  `-test/-.test.ts`; `src/m.cli/-test/-dsl.test.ts`; `-scripts/task.cli.ts`;
  `src/-test.ts`, `src/-test/mod.ts`. Generated chapter inspected via owner output.
- `code/sys/server/src/m.server.dist/t.ts` (first 305 lines),
  `u.materialize/u.manifest.ts`, `u.materialize/u.failure.ts`, `u.materialize/u.run.ts`
  (initial orchestration, promotion, checksum-fence and separate-winner sections);
  `-test/-content.identity.test.ts`; `-test/-materialize.test.ts` (lines 576–627);
  `code/sys/server/-sample/files.http.static/-.test.ts`.
- `code/sys/fs/src/m.Pkg/t.ts` (Dist contracts through ReadPart),
  `src/m.Pkg.Dist/u.verify/u.admitManifest.ts`, `u.verify.ts` (first 220 lines),
  `u.manifest.ts`; `-test/-pinned.admitManifest.test.ts` (first 100 lines),
  `-test/-local.verify.test.ts` (first 110 lines).
- Root `deno.json`, `deps.yaml`, `imports.json`, `package.json`; owning `deno.json` files for
  `code/sys.ui/ui-react`, `code/sys.ui/ui-components`, `code/sys/cell`, and `code/sys/std`.

Cross-package hook helpers use the public `@sys/ui-react/testing/server` and
`@sys/testing/server/dom` surfaces. The inspected hook harness installs HappyDOM before importing
Testing Library and drains initialization timers. No downstream-private fixture or permission preset
was borrowed. Other owner tests named above were source evidence only; their complete dependency
closures and permissions were not needed or claimed for execution.

Before claiming this slice fully closed, add/execute the F1/F2 regressions and the missing transport
rejection, delayed fallback completion, and HttpOrigin pending-unmount/option-change assertions.
Do not substitute broader passing suites or a browser claim for those branch obligations. Keep the
existing minimal observation API and the clear documentation unless a concrete failing invariant
requires a change; the findings do not justify sample App, HTML/CSS, image-link, exposure, or Vite
configuration cleanup.
