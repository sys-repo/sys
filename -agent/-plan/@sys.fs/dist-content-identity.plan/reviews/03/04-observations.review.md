# Observation shape and lifecycle safety — round 03, Go: 4

## Verdict

**no material finding** in the reviewed observation boundary.

All five focused test commands passed: 7 suites, 50 steps, zero failures. The public hook-to-Title
server-rendering lane executed successfully. No source, test, configuration, dependency, or Git state
was intentionally changed. This report is the sole authored output. One minor input-type canon
mismatch is recorded separately below; it is not a demonstrated observation failure.

This is not whole-system acceptance, browser execution proof, or landing clearance.

## Authority, attribution, and independence

- Repository: `/Users/phil/code/org.sys/sys`.
- Target: `feat(dist)!: unify build pins and verification on canonical content identity`.
- Governing plan: `-agent/-plan/@sys.fs/dist-content-identity.plan.md`.
- Read this round's README and the Go: 4 charter, workspace AGENTS, canonical AGENTS, and every file
  under `../sys.canon/-canon/`. No applicable first-party scoped AGENTS was found in the searched
  owner trees or `-agent`.
- Read only the plan's opening five lines and the charter's named normative sections: Proposed
  identity contract; Clean-break API, artifact, and release behavior; workstreams A and H; Required
  adversarial proof matrix; Completion boundary. Heading-location search did not open historical
  section bodies. No sibling report, earlier review, adjudication, or implementing transcript was
  read. No prior-review contamination identified.
- Entry and exit HEAD: `8d97fe4088bed6764e804424b767b089ffb13cf3`.
- Read-only history confirmed the exact subjects and reachability of `e6316e80b` and `872b5a34d`.
  The reachable subject search found no matching Dist replacement commit. The five-line opening
  remained unchanged; the replacement remains the first unlanded item. No plan reconciliation edit
  was made.
- Source attribution came from live reads and unstaged diffs against HEAD, not from the plan's
  claims. Scoped staged inspection was empty. The four untracked inputs were explicitly included:
  `m.Dist.Content.ts`, `-m.Dist.Content.test.ts`, `use.Dist/-.test.ts`, and `ModuleList/-ui.Title.test.tsx`.
- The charter's model recommendation is prospective, not evidence of this session's runtime model.

## Inspected inputs and material stability

The following paths define the primary comparison set. Directory prefixes below are exact
repository-relative prefixes; listed filenames identify the inspected files within them.

| Prefix | Files |
|---|---|
| `code/sys/std/src/m.Pkg/` | `m/m.Is.ts`, `m/m.Dist.Content.ts`, `m/m.Dist.Part.ts`, `m/m.Dist.ts`, `mod.ts`, `common.ts`, `t.ts`, `-test/-m.Pkg.Is.test.ts`, `-test/-m.Dist.Content.test.ts` |
| `code/sys/types/src/t/` | `t.Pkg.dist.ts`; descriptive aliases in `t.Pkg.ts`, `t.Time.ts`, `t.Number.ts`, `t.String.ts` |
| `code/sys.ui/ui-react/src/use/use.Dist/` | `use.Dist.ts`, `use.Dist.sample.ts`, `mod.ts`, `t.ts`, `-.test.ts` |
| `code/sys.ui/ui-components/src/ui.react/ui/Http.Origin/` | `use.Verify.ts`, `common.ts`, `t.ts`, `ui.tsx`, `ui.Info.tsx`, `ui.Value.tsx`, `u.log.ts`, changed `ui.Action.Verify.tsx` diff, `-test/-use.Verify.test.tsx` |
| `code/sys.ui/ui-dev/src/ui.react.devharness/ui/ModuleList/` | `ui.tsx`, `ui.Title.tsx`, `ui.CacheButton.tsx`, `use.CacheButton.ts`, `-ui.Title.test.tsx` |
| `code/sys.model/model/src/m.files.static/` | `m.fromDist.ts`, `t.ts`, `u/u.index.ts`, `u/u.path.ts`, `u/u.ref.ts`, `u/u.handlers.ts`, `u.cmd/u.cmd.read.ts`, `u.cmd/u.cmd.list.ts`, `u.cmd/u.cmd.manifest.ts`, `-test/u.fixture.ts`, `-test/-m.fromDist.test.ts`, `-test/-dist-seam.test.ts` |

Additional direct dependencies were followed for concrete reasons:

- `ui-react/src/use/mod.ts`, `use/t.ts`, `src/types.ts`, and owner exports: public hook/type containment.
- Model `src/types.ts`, relevant `m.files/t.ts` sections and `m.files/u/u.path.ts`: readonly contracts,
  ordinary Files results, and canonical path ownership.
- `code/sys/server/src/m.server.dist/u.server.start.verified/u.request.handler.ts::createBacking`:
  a real consumer supplies `evidence.content`, not a whole descriptive manifest.
- Std `m.Str/u/u.bytes.ts`, `m.Num/m.Is.ts`, `m.Is/m.Is.ts`, and `m.Path/m/m.Bounded.ts`: actual
  formatter requirements, numeric predicates, structural guards, and exact-path treatment.
- HTTP `http.client/m.HttpFetch/{m.Fetch.ts,u/u.make.ts,u/u.invoke.ts,u/u.operation.ts}`: JSON
  decoding, cancellation ownership, and completed-operation abort-bridge teardown. This was a direct
  lifecycle dependency, not a general HTTP review.
- Test barrels, `ui-react/src/m.testing.server/u.renderHook.ts`, Std/testing DomMock initialization,
  teardown and loopback-server implementation, plus ui-dev's eagerly imported sample specs: execution
  initialization/effects. These do not launch browser builds or external providers.
- Root `deno.json`, `deps.yaml`, `imports.json`, and all five test owners' `deno.json`: workspace,
  dependency, task and selected permission authority. Lockfile/package state was inspected with Git;
  this was not an audit of every lock entry or cached artifact.

### Entry/exit comparison actually performed

Captured full live source/test text and full target diffs in tool output at entry. At exit:

1. Repeated and compared the complete unstaged diffs for the guard, Pkg contract, Dist types, all
   tracked use.Dist files, all changed Http.Origin files, and all six changed FilesStatic files.
   No changed hunks or blob identities appeared between these observations.
2. Reopened all four untracked files in full and compared their emitted contents; unchanged.
3. Reopened Pkg's `common.ts` and `m/m.Dist.ts`; unchanged. Title and Part remained clean against the
   same HEAD. Repeated scoped path/staged checks agreed with entry.
4. Root dependency/configuration files and the five owning deno.json files remained clean. Repeated
   dependency diffs for HTTP client, Testing, Std Testing/Is/Num/Str, and ui-react testing helpers were
   empty. The plan's opening five lines were reopened and unchanged.

This is content comparison, not merely equal filenames/status/timestamps. It is nevertheless not an
atomic snapshot: it cannot exclude an intervening change-and-reversion, and it does not attest every
transitive dependency, generated cache, ignored file, or unrelated dirty byte. Auxiliary clean
sources were inspected, not all independently reread in full at exit. No material drift was observed
in the compared inputs. Unrelated visualizer configuration and other concurrent work were not edited
or restored.

## Invariant-to-proof map

`Executed` means this session's existing-test run. `Source` means a deduction from the inspected
implementation, not a new runtime reproduction.

| Boundary / independent expectation | Proof and negative controls | Result / limit |
|---|---|---|
| Fetched JSON remains unknown until its complete observable shape is established. | `useDist` calls `fetch.json<unknown>` and narrows with `Pkg.Is.dist`. Guard tests independently vary absent/null/array/object/string size values, negative/fractional/nonfinite sizes, invalid time/builder/runtime, scheme, inventory, ignore and signature metadata. Positive manifests include optional metadata and absent root package. | Executed. Title's `build.size.total/pkg` and digest slicing are covered by the guard. Strings remain descriptive aliases, not invented semantic URL/package validators. |
| Numeric domains must be safe for actual consumers. | `Num.Is.safeInt` plus nonnegative checks protect size fields; `Num.Is.finite` protects time. `Str.bytes` delegates to pretty-bytes. Part parsing requires exact canonical decimal safe integers. | Executed malformed size/time controls and part overflow rejection; source confirms metadata size overflow refusal. Time remains a finite descriptive number, not newly constrained calendar policy. |
| Structural observations are not hostile executable-object admission. | Guard tests positively admit inherited top-level metadata and array objects with the required structural fields, plus explicitly undefined optional members. Encoder checks own enumerable data descriptors and rejects accessors without invoking them. | Executed. No assertion-based whole-manifest narrowing, duplicate encoder, or new proxy/getter firewall was introduced at the Std guard. Arbitrary executable JavaScript objects are not equivalent to fetched JSON. |
| Canonical encoding is exact, bounded, and non-cryptographic. | Literal compact tuple and 103-byte UTF-8 vector; literal escaped-string vector; independent order list covering numeric-looking keys, prototype-sensitive names, combining marks and astral characters. Negative controls change path/hash/size, use empty inventory or bad surrogates, and exceed entry/path budgets. | Executed. `Json.stringify(..., 0)`, code-unit comparator, shared Part parser, and finite ceilings remain at Std. This pass did not execute FS's digest vectors or strict tree admission. |
| JSON, provenance, error and count publish coherently. | One `Observation` state object; remote success clears error/sample, failed acquisition clears JSON, sample settlement retains the acquisition error and sets sample true. Option-change test records intermediate renders so retained sample cannot be relabeled remote. Rejected transport is exercised with fallback both enabled and disabled. | Executed for JSON/error/provenance. Count is source-proved: reset/error preserve it; a JSON publication increments once through a functional update. Existing tests do not directly assert count. |
| Superseded pending transport cannot publish and should be cancelled. | Public-hook replacement test resolves the old request only after new remote success; asserts aborted signal, two requests, unchanged new JSON/error/provenance. Public unmount test also asserts abort. | Executed. Delayed work cannot cross the disposed-fetch check. No live external fetch occurs in these synthetic transport tests. |
| Delayed sample acquisition belongs to its original effect. | Internal loader seam uses explicit entered/pending promises and counts calls/renders. Settle publishes sample; replace/unmount then late resolve does not publish or rerender. | Executed. Completed transport signals correctly remain unaborted while fallback is pending: HTTP operation disposal already detached their bridge. This is not cancellation failure. |
| Default loading remains lazy and private. | Stable module-level default loader dynamically imports sample only after failure with fallback enabled. Dependencies include `sampleFallback` and `loadSample`; cleanup returns the owning fetch's dispose. Public omitted-options calls execute successfully. | Source plus executed public/default and explicit-loader paths. Loader-identity-only replacement and loader rejection were not separately executed. No public option to inject a loader was added. |
| An actual consumer must render safely, not just pass a guard test. | `-ui.Title.test.tsx` imports public `@sys/ui-react/use`, acquires independently authored JSON, then calls `renderToStaticMarkup(<Title ...>)`. Missing/null size suppresses Dist markup and yields the exact guard error; valid size yields Dist markup and no error. | Executed actual Title and its byte formatter. The synthetic declared digest is intentionally not authenticated. This is HappyDOM hook execution plus server rendering, not browser execution or service-worker/cache behavior. |
| Public export evidence must be explicit. | `use.Dist/mod.ts` exports only named `useDist`; outer use barrel exports that module. Type barrels expose `DistHook`/`UseDistFactory`; `Observation` stays local. Pkg public Content namespace retains typed readonly parts input; its internal unknown encoder is not a new root export. | Source. The test's function-identity assertion proves identity only, not export enumeration; this report does not use it as an enumeration test. |
| Http.Origin must label an observation as unpinned and suppress stale results. | A deliberately forged but syntactically valid digest is displayed as observed, with exactly `/dist.json` requested. Tests assert `observe manifests` and `observed (unpinned)`, malformed/404 failures, custom resolver, replacement and unmount. | Executed hook behavior. Source traces actual Info/Value tooltip and `manifest (unpinned)` row; log prefix is observation/unpinned. These labels do not claim checked payloads or browser execution. |
| FilesStatic indexes content without authenticating it or recovering excluded metadata. | Fake digest fixture produces ordinary list/stat/ref/manifest outputs; missing size now refuses. Separate explicit buildTime adds only `.meta.dist.build.time`, leaving entries equal. Traversal, separators, file/dir collisions, invalid refs/URLs and deny policy remain negative controls. | Executed. No payload bytes are fetched by this adapter. Actual Server caller supplies content only and omits descriptive time. |
| Readonly input allowance and output contracts remain truthful. | `FromDistOptions.dist` is `DeepReadonly<DistContent>`; mutable values also fit that input. Files Backing/Entry/ContentRef/Manifest outputs retain readonly members/arrays. Index reconstructs primitive entries rather than mutating caller input. | Source plus executed typed surface, exact output, frozen policy/capabilities/handlers and policy-mutation tests. No claim that every returned object is recursively runtime-frozen; readonly types alone do not prove that. |
| Dist coupling remains contained. | Model exports FilesStatic through its type spine. The seam test permits only three existing adapter files and now also searches for `DistContent`. | Executed read-only production-source scan. Internal StaticIndex/StaticFile types were not promoted into the public model pool. |

### Preserved and replaced assertions

- The guard rewrite preserves unknown/package controls, partial-object refusal, optional package and
  signature/ignore shapes, and complete part parsing. Old legacy/conversion acceptance assertions
  were intentionally removed. Missing/unsupported scheme and missing-size refusal replace those old
  acceptance contracts; positive supported manifests prevent an always-false guard from passing.
- FilesStatic's old no-size success expectations were replaced by `FilesStaticError.InvalidPath`.
  Existing list/stat/read/ref/paging/policy/error assertions remain. Explicit-time separation was
  added without weakening the expected entry outputs.
- Http.Origin retains ordinary success, custom resolver, 404 and malformed response assertions, with
  new forged-digest and lifecycle controls. A successful forged digest is the expected negative
  control against interpreting `ok` as authentication, not a verification defect.
- The new Title test reaches production formatting rather than inspecting a private helper. It
  asserts presence/absence of the Dist display but does not pin exact rendered byte-count text.

## Findings and canon observations

### Material findings

None established. There is no demonstrated JSON shape escape, consumer crash, provenance relabeling,
or late-publication failure in the reviewed current paths. No patch is requested on the strength of
unexecuted browser scenarios or hypothetical hostile getters.

### Minor concrete canon mismatch

**C1 — low: readonly modifier on a newly added helper input.**

- Location: `code/sys.model/model/src/m.files.static/u/u.index.ts::staticIndex`,
  `readonly buildTime?: t.UnixTimestamp` in its input options.
- Evidence/attribution: the diff adds this readonly input member; the adjacent readonly input members
  already existed. `protocol.lang.md` distinguishes permissive inputs from readonly output promises.
  The public `FromDistOptions` change correctly removes its own property-level readonly modifiers.
- Consequence: inconsistent input-contract notation, not a runtime mutation or authority failure.
- Smallest correction: Model owner removes the input property's readonly modifier when addressing
  this local input bag; preserve `DeepReadonly<DistContent>` as the accepted value shape and preserve
  readonly output evidence. No public type promotion or new abstraction is needed.
- Closing proof: owner type-check/test lane and the exact-file format check remain green.

The FilesStatic adapter's two `as t.CompositeHashParts` expressions are a contained runtime-validation
bridge, not independent proof of unknown input. The first call actually invokes the shared rejecting
encoder, and the subsequent loop parses every part again. I did not find a JSON acceptance bypass
there. Do not replace this boundary with an unchecked whole-content assertion or duplicate encoder.

### Optional proof improvements, not material findings

- Add direct count assertions to the existing useDist transition tests if count semantics are meant
  to remain a public compatibility promise. Current source supports the coherent behavior above;
  current tests primarily assert JSON/error/provenance and render suppression.
- Add a MAX_SAFE_INTEGER/+1 metadata-size pair and pin Title's expected formatted sizes if stronger
  regression precision is desired. Existing safe-int code and successful production rendering are
  evidence, but not those exact assertions.

No style sweep, new observation framework, new guard family, or broader matrix is warranted by these
notes. The strongest case for retaining the design is its existing separation: Types declares the
contract; Std owns one pure encoder and structural recognition; HTTP owns transport disposal;
useDist publishes one coherent observation; Title renders it; FilesStatic translates content facts;
independent pin/payload verification stays outside all of them.

## Executed commands and outcomes

Each test ran serially from its owner via the declared `test` task (`deno test -P=test`). No raw test
substitution, broadened permissions, dependency regeneration, formatter write, child build or browser
was used. Runtime: Deno 2.9.7, V8 15.0.245.2-rusty, TypeScript 6.0.3, aarch64-apple-darwin.

```sh
cd code/sys/std && deno task test --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/m.Pkg/-test/-m.Pkg.Is.test.ts ./src/m.Pkg/-test/-m.Dist.Content.test.ts
```

Passed: 2 suites, 15 steps, 0 failures (148ms reported).

```sh
cd code/sys.ui/ui-react && deno task test --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/use/use.Dist/-.test.ts
```

Passed: 1 suite, 13 steps, 0 failures (265ms reported).

```sh
cd code/sys.ui/ui-components && deno task test --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/ui.react/ui/Http.Origin/-test/-use.Verify.test.tsx
```

Passed: 1 suite, 7 steps, 0 failures (223ms reported).

```sh
cd code/sys.ui/ui-dev && deno task test --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/ui.react.devharness/ui/ModuleList/-ui.Title.test.tsx
```

Passed: 1 suite, 1 step, 0 failures (44ms reported).

```sh
cd code/sys.model/model && deno task test --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/m.files.static/-test/-m.fromDist.test.ts ./src/m.files.static/-test/-dist-seam.test.ts
```

Passed: 2 suites, 14 steps, 0 failures (360ms reported).

From repository root:

```sh
deno fmt --check ./code/sys/std/src/m.Pkg/m/m.Is.ts ./code/sys/std/src/m.Pkg/m/m.Dist.Content.ts ./code/sys/std/src/m.Pkg/t.ts ./code/sys/types/src/t/t.Pkg.dist.ts ./code/sys.ui/ui-react/src/use/use.Dist/use.Dist.ts ./code/sys.ui/ui-react/src/use/use.Dist/mod.ts ./code/sys.ui/ui-react/src/use/use.Dist/t.ts ./code/sys.ui/ui-react/src/use/use.Dist/-.test.ts ./code/sys.ui/ui-components/src/ui.react/ui/Http.Origin/use.Verify.ts ./code/sys.ui/ui-components/src/ui.react/ui/Http.Origin/-test/-use.Verify.test.tsx ./code/sys.ui/ui-dev/src/ui.react.devharness/ui/ModuleList/-ui.Title.test.tsx ./code/sys.model/model/src/m.files.static/m.fromDist.ts ./code/sys.model/model/src/m.files.static/t.ts ./code/sys.model/model/src/m.files.static/u/u.index.ts

git diff --check -- code/sys/std/src/m.Pkg code/sys/types/src/t/t.Pkg.dist.ts code/sys.ui/ui-react/src/use/use.Dist code/sys.ui/ui-components/src/ui.react/ui/Http.Origin code/sys.model/model/src/m.files.static
```

Format check: `Checked 14 files`; diff check: no output, success. These are bounded checks, not a
claim that every file in the migration is formatter-stable.

History commands used for arc reconciliation:

```sh
git rev-parse HEAD
git show -s --format='%h %s' e6316e80b 872b5a34d
git merge-base --is-ancestor e6316e80b HEAD
git merge-base --is-ancestor 872b5a34d HEAD
git log --format='%h %s' --fixed-strings --grep='feat(dist)!: unify build pins and verification on canonical content identity'
```

Both ancestor checks succeeded; exact prerequisite subjects matched; target search returned no rows.
Other observation commands were scoped `git status`, `git diff`, `git diff --cached`, path discovery,
and narrow symbol/heading searches. Initial leading-hyphen discovery arguments failed and were
corrected with `./` prefixes. Several guessed helper paths returned ENOENT and were resolved by path
or symbol discovery; no permission denial or security-gate bypass occurred.

### Effects, cleanup, and limits

- Std tests operate on memory-only synthetic data, including bounded large dictionaries.
- useDist and Title lanes replace/restore process-local fetch/location, use HappyDOM with owned
  teardown, and unmount their hooks. Title is server-rendered; its browser cache-button effect does
  not execute during that render.
- Http.Origin uses owned loopback servers on port 0 and synthetic delayed fetches. Finally blocks
  unmount hooks, restore fetch and await server disposal; leak tracing reported no failures.
- FilesStatic behavior tests are memory-only; the seam test reads production source trees. It creates
  no fixture files. No task inspected here launches a build or child process.
- All command processes returned. No shared build/browser slot was requested or held, and none is
  pending for these executed lanes. No shared outputs needed cleanup.
- Frozen/cached-only execution succeeded without a permission/provenance failure. This does not
  attest cache provenance or fully audit third-party initialization. No alternate runtime or broader
  permission retry was attempted.
- No new tests were authored and no red-before-fix experiment was performed: this was a review of
  existing live behavior. Source-only branches and optional additional assertions are identified
  above rather than reported as executed coverage.
- Provider, release, cross-OS, full browser, strict filesystem, and two-real-build composition claims
  remain outside this scoped verdict. No other session's execution is counted here.
