# HTTP static containment — implementation and proof receipt

Target: `fix(http): reject sibling-prefix static path escapes`.

Chronological receipt: the original two-file review and three-file correction are historical
checkpoints. The human subsequently returned a composition/canon-finish review and approved its
bounded corrections plus a separately owned local check task. The
[prelanding finish](#prelanding-review--adjudication-and-verified-finish) records those dispositions
and fresh final-byte checks; earlier no-new-review statements describe their original checkpoints.

Initial implementation HEAD: `8ba45c06f9b31ded1800f79b1318ba1e407819d1`. Both initial source files
were clean before that authorized implementation. The governing opening arc remains the landing
ledger; this receipt records worktree evidence, not a landed commit or Git-mutation authorization.

## Initial two-file candidate — historical

- `code/sys/http/src/http.server/m.HttpServer/u/u.serveStatic.ts`
- `code/sys/http/src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts`

No S10, Vite, dependency, permission or public type/configuration changes belonged to this cut. The
expanded HTTP cut below supersedes this handoff; workflow records remain separately owned.

## Correction and retained behavior

The handler resolves both the configured root and joined decoded request path to absolute paths,
then uses the existing Std `Path.Is.within` predicate before its first stat or not-found callback.
Equal-root directory requests remain allowed; a prefix-sharing sibling is not a descendant. Relative
roots remain resolved against request-time cwd. Empty roots now resolve consistently to cwd.

The internal `serveStaticWith` stat seam proves lookup ordering without global monkey-patching. The
public `HttpServer.static` wrapper supplies the real `Fs.stat`; no public option or barrel export
was added. Real-file regressions also exercise that wrapper and `HttpServer.create` composition. The
zero-stat assertion covers the static handler, not preceding middleware's in-root lookups.

Controls retain directory indexes/308 redirects, ordinary 404, custom SPA fallback, decoded
filenames, MIME types, ETag/304 invalidation and Range/206 behavior. Absolute, dotted, relative,
omitted, dot and empty roots are exercised. The cwd fixture has a non-dot prefix so the old
dot-prefix check cannot accidentally satisfy that control. Each test owns its temporary directory
with `await using`; direct streaming responses are drained before assertions. Existing transport
assertions remain.

This is lexical containment only. Symlink following, races, malformed URL decoding, pinned serving
and the separate DenoEntry directory-selection correction are not redesigned or certified here. No
deployed exposure or cross-platform execution is established.

## Red → green evidence

Before the containment change, the existing-sibling encoded request returned **200 instead of 403**.
With only the stat seam added, the ordering regression observed **one stat instead of zero**. The
empty-root serving control also failed with **403 instead of 200**. The last red file run had nine
passing steps and three failing steps. The production guard then passed all twelve steps.

An attempted nested-step `--filter 'escaped targets'` run selected zero tests and is not proof. The
full focused file was run instead. Final fixture/drainage refinements were followed by another
focused run and full unit run; the results below cover those final source bytes.

From `code/sys/http`:

```sh
deno task test:unit --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts
deno task test:unit --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot --quiet
deno check --frozen --cached-only --quiet ./src/ ./-scripts/
deno fmt --check ./src/http.server/m.HttpServer/u/u.serveStatic.ts ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts
deno lint ./src/http.server/m.HttpServer/u/u.serveStatic.ts ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts
```

- Focused: **1 suite / 12 steps**, zero failures.
- Full `test:unit`: **59 suites / 460 steps**, zero failures; focused counts overlap this run.
- Source/scripts typecheck and exact two-file formatting/lint passed.
- Scoped source `git diff --check` passed.

The explicit native typecheck covers the owning task's source/scripts targets while retaining
frozen, cache-only flags without forwarding them after that task's existing `--` delimiter. The
separate `test:file-bytes:entry` process task, workspace suite, S10 consumer suites and real
build/preview lanes were not run. Static discovery of external-test files is not their execution.

## Initial review and limits

Implementer whole-file/diff inspection checked refusal ordering, the real-wrapper connection,
positive controls, cleanup and unchanged downstream transport delegation. No independent review had
occurred at that initial handoff. Results were from the integrated worktree on this host, not an
isolated commit or release/deployment certification. No assertions, permission guards or lock checks
were weakened. The index and root dependency files remained unchanged; no Git mutation occurred.

## Returned independent review — accepted corrections, not yet executed

This section preserves the original adjudication checkpoint. The later implementation and proof
below supersede its prospective source-state descriptions without rewriting the returned evidence.

The human supplied the completed review of the original two-file candidate at unchanged HEAD
`8ba45c06f9b31ded1800f79b1318ba1e407819d1`. Verdict: **hold; not yet S-tier**. The reviewer reported
full candidate/dependency inspection, opening-arc reconciliation, stable source and an empty index.
Blindness disclosure: excluded filenames/status metadata were visible, but no excluded report,
verdict or receipt content was opened. The brief recommended `gpt-6-astra • high`; the supplied
report does not attest the actual model/runtime configuration.

**Reviewer-reported execution:** focused HTTP 1 suite / 12 steps and full HTTP unit 59 suites / 460
steps passed, as did source/scripts typecheck and exact two-file formatting/lint. An independently
created temporary test had seven passing steps and three failing steps, one per finding below, with
no leak diagnostic. Its source was removed through the registered tool before owner-wide testing. A
loopback raw-request control also reached the handler and refused the sibling request without
returning sibling bytes. These are reviewer observations, not newly executed implementer tests.

The implementation thread reopened the predicate, portable conversion, middleware, create wiring,
types, candidate tests and shared server fixture. Source supports the following dispositions; no
returned reproduction or owner suite was rerun during this plan-only pass.

### Accepted findings and smallest owners

- **HTTP-R1 — native filename compatibility:** accept, blocking the compatibility claim. A POSIX
  file literally named `..\report.txt` stays inside the root but `/..%5Creport.txt` returns 403.
  `Path.Is.within` computes a native relative path, then `relativePosix` rewrites its backslash into
  a separator. `m.Path/t.ts` promises platform-dependent semantics; portable conversion is the wrong
  operation here. The helper defect is inherited; adopting it introduces this HTTP regression. Fix
  `within`, not `relativePosix` or the HTTP caller's definition of containment. The previous guard
  control was executable, but the historical server itself was not run.
- **HTTP-R2 — same-origin directory redirect:** accept, blocking composed redirect correctness. With
  `root/evil.invalid/index.html`, a request path `//evil.invalid` returns a Location resolving to a
  different origin. `forceDirSlash` strips leading slashes for lookup but preserves them in its
  redirect reference. Construct the slash redirect from the parsed request URL without
  reinterpreting the pathname as an authority; retain origin, port, query and ordinary redirects.
  This is inherited middleware behavior. No external redirect was followed or deployed target used.
- **HTTP-R3 — decoded admission before directory lookup:** accept, blocking composed refusal.
  `/..%2Fdist-secret` is refused until an in-root directory literally named `..%2Fdist-secret`
  exists; that collision makes preceding middleware return 308 while direct static still returns
  403. Admit the mapped, once-decoded path before the middleware's lookup or redirect using the same
  absolute/native containment contract. Preserve the explicit `strip` argument and existing route
  mapping. This is an inherited encoded/decoded mismatch, not evidence of outside lookup,
  sibling-byte disclosure or SPA fallback. Also retain the legitimate double-encoded request to the
  literal percent-named directory; do not solve this by banning percent names or decoding twice.
- **HTTP-R4 — header comment:** accept as selected-file finish. The `If-None-Match` comment in the
  existing static test incorrectly labels the header forbidden. Correct/remove the rationale; direct
  dispatch remains a valid test. No transport/API change follows from this documentation fix.
- **HTTP-R5 — shared test fixture setup/cleanup:** accept the source observation, defer its repair
  separately under
  [AF-06](../adjacent-findings.md#af-06--http-test-server-setup-ownership--separate-follow-up).
  `usingServer` starts the listener before `mkFetch` and before `try`, and suppresses cleanup
  failures. A thrown client constructor has no protected listener teardown. No fault injection or
  leak in the executed candidate tests was reported. Do not silently add this helper to HTTP's
  source cut; an exercised failure or necessary proof dependency requires explicit promotion.

The original design remains appropriate: absolute coordinates, one existing containment predicate,
refusal before effects and unchanged file transport. These findings tighten implementation and proof
at those owners; they do not justify a resolver framework, blanket filename rejection, symlink/race
protection, recursive URL decoding or a new pinned server. A green aggregate did not exercise the
three counterexamples; inheritance does not excuse their effect on the current promise.

### Approved whole-file corrective scope

First, `fix(std): preserve native separators in path containment`:

- `code/sys/std/src/m.Path/u/within.ts`
- `code/sys/std/src/m.Path/-test/-.test.ts`

Then, `fix(http): reject sibling-prefix static path escapes`:

- `code/sys/http/src/http.server/m.HttpServer/u/u.serveStatic.ts`
- `code/sys/http/src/http.server/m.HttpServer/u/u.middleware.ts`
- `code/sys/http/src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts`

These are prospective exact cuts, not staged files or completed repairs. The original two HTTP files
are dirty; the Std paths and HTTP middleware remain unchanged at this reconciliation. The actual
HTTP type contract is in `m.HttpServer/t.ts`; the prepared brief's `t.serveStatic.ts` reference was
stale. No public type change is planned. Preserve the original brief as review history, not a new
dispatch instruction. No automatic second review or new arc gate is required.

### Discriminating proof and bounded verification

1. Recreate each reported failing case as a permanent regression before its owner repair. Assert
   expected status, bytes, resolved redirect origin/query and absence of forbidden effects; then run
   the smallest correction against both refusal and success controls. Keep the existing stat seam
   connected to the real wrapper. Use a narrow internal observation seam only where ordering cannot
   otherwise be demonstrated; do not add public test knobs or global monkey-patching.
2. Std: allow literal POSIX backslashes and `..literal.txt` while refusing actual parents and
   prefix-sharing siblings. Preserve equality, absolute-input checks and native Windows semantics,
   including cross-drive refusal. Use independent literal expectations, not another invocation of
   the predicate as the oracle. Retain `relativePosix` conversion tests unchanged. Report native
   platform execution versus unexecuted platform-conditional cases separately.
3. HTTP: test direct middleware and `create` composition, collision directory absent/present,
   percent/space/native filenames and legitimate double encoding. Resolve each returned Location
   against the request URL and assert the same origin and preserved query without following it.
   Retain all root/index/404/fallback/MIME/ETag/Range controls and a valid `..literal.txt` response.
   Review `HttpStatic.start`, which composes the same middleware, under the full HTTP unit run. Do
   not change existing route-prefix semantics or introduce a new malformed-URL policy.
4. Own new fixture directories before writes and drain response bodies before assertions. Prefer
   direct `app.fetch` for these deterministic cases; any needed listener is loopback-only and must
   be awaited through settlement. Do not rely on AF-06 being fixed or hide a newly exercised
   failure.
5. Run narrow then affected checks below, inspect complete selected files and their final diffs, and
   deliver separate Std/HTTP whole-file handoffs. No staging/commit without exact human Git
   authorization. Reconcile landing only after observation, then return to S10 and the existing
   documentation → Vite → accounting → pipeline → Pi-preview sequence.

Planned commands, **not executed by this reconciliation**, from each named owner after reading its
current configuration. Retain the existing frozen/cache-only/no-prompt flags and permission presets.

From `code/sys/std`:

```sh
deno task test --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/m.Path/ ./src/-test/-namespace.freeze.test.ts
deno task test --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot
deno check --frozen --cached-only ./src/
deno fmt --check ./src/m.Path/u/within.ts ./src/m.Path/-test/-.test.ts
deno lint ./src/m.Path/u/within.ts ./src/m.Path/-test/-.test.ts
```

Because the predicate is shared, run existing affected-caller controls without adding those callers
to the source cut. Inspected uses include Dist projection root-disjointness, child-root selection,
Snapshot selection and Server service-directory resolution. Preserve canonical inventory path
validation independently of native filesystem names.

From `code/sys/fs`:

```sh
deno task test:unit --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/m.Pkg.Dist/ ./src/m.Snapshot/
```

From `code/sys/server`:

```sh
deno task test:unit --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/m.server.dist.service/ ./src/m.server.files.service/
```

From `code/sys/http`:

```sh
deno task test:unit --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts
deno task test:unit --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot
deno check --frozen --cached-only ./src/ ./-scripts/
deno fmt --check ./src/http.server/m.HttpServer/u/u.serveStatic.ts ./src/http.server/m.HttpServer/u/u.middleware.ts ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts
deno lint ./src/http.server/m.HttpServer/u/u.serveStatic.ts ./src/http.server/m.HttpServer/u/u.middleware.ts ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts
```

Run exact-path `git diff --check` for both cuts. Existing full-suite greens remain a baseline, not
acceptance of changed bytes. Separate process/build/Windows/deployment lanes are not implied by
these commands. A permission, lock or cache refusal stops that lane; no dependency acquisition,
version/import-map change, permission widening, profile change or weakened assertion is approved.
The reviewer's `deno info --json --frozen --cached-only @std/http/file-server` attempt was rejected
by CLI parsing and not retried; this is an unexecuted dependency-location probe, not proof about the
transport implementation or a new prerequisite. Keep that limit without inventing toolchain work.

## Post-correction implementation and final-byte proof

Continuation baseline and final HEAD: `e9baa28574ebd5492df5884280dda25333cf86d0`. The landed Std
predicate is unchanged. The original handler/test delta was retained; only the approved middleware
file was added to the source cut:

- `code/sys/http/src/http.server/m.HttpServer/u/u.serveStatic.ts`
- `code/sys/http/src/http.server/m.HttpServer/u/u.middleware.ts`
- `code/sys/http/src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts`

### Corrections and permanent controls

- **R1:** real POSIX `..\report.txt`, ordinary and leading backslash filenames are independently
  read through `Fs.readText`, then served with exact bytes through direct and composed dispatch.
  This pins the landed Std correction without portable rewriting. Percent/space names,
  `%2Freport.txt` through double encoding, and `..literal.txt` retain independent byte controls.
- **R2:** directory redirects are built by updating the parsed request URL's pathname. Ordinary
  redirects retain their relative Location; a double/triple-leading-slash path uses the complete URL
  so it cannot become an authority reference. Direct middleware and `create` controls assert origin,
  port, exact pathname and encoded query, without following any redirect. Missing directories remain
  404 with no Location.
- **R3:** preserve the raw `strip` mapping, decode its remainder once, resolve root/candidate into
  absolute native coordinates and admit with `Path.Is.within` before directory lookup or redirect.
  The guard also precedes trailing-slash fallthrough. The public wrapper supplies real `Fs.Is.dir`
  to the internal `forceDirSlashWith` seam; controlled refusal has zero lookup and next calls, while
  a descendant performs one lookup. No public option, barrel export or global patch was added. Real
  collision-absent/present requests remain 403, while the legitimate double-encoded directory
  redirects and serves its index. Absolute/dotted/relative/dot/empty roots, decoded directories,
  explicit stripping and existing non-stripping route behavior remain covered.
- **R4:** removed the incorrect forbidden-header rationale. The existing direct ETag/304 assertions
  remain intact. Handler type guards now use the existing local `Is` helpers.
- **R5 / AF-06:** remains separately deferred. New cases use direct dispatch and owned temporary
  directories; no additional listener or fixture fault-injection requirement was introduced.

### Discriminating red → green

After correcting test-authoring type/signature and `Fs.readText` result-shape mistakes, the last
behavioral red run had **14 passing steps / 4 failing steps**. It reproduced an off-origin redirect,
308 instead of 403 with the collision present, one directory lookup instead of zero, and 200 instead
of 308 for an encoded-space directory. The native byte case was already green with landed Std; its
historical predicate red remains in the Std receipt, not a newly repeated HTTP failure.

The smallest middleware repair made all 18 steps pass. Surgical layout finish kept atomic option
bags and vertical case tables; no formatter write or assertion weakening was used.

### Final-byte checks

Host: Darwin arm64; Deno 2.9.7, TypeScript 6.0.3, V8 15.0.245.2-rusty. From `code/sys/http`:

```sh
deno task test:unit --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts
deno task test:unit --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot
deno check --frozen --cached-only ./src/ ./-scripts/
deno fmt --check ./src/http.server/m.HttpServer/u/u.serveStatic.ts ./src/http.server/m.HttpServer/u/u.middleware.ts ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts
deno lint ./src/http.server/m.HttpServer/u/u.serveStatic.ts ./src/http.server/m.HttpServer/u/u.middleware.ts ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts
```

Focused: **1 suite / 18 steps**. Full HTTP unit: **59 suites / 466 steps**. Both had zero failures
and no ignored steps on this host; native POSIX cases ran. Source/scripts typecheck, exact
three-file format/lint and scoped `git diff --check` passed. Whole selected files and the final
source diff were inspected, including public-wrapper wiring and unchanged ETag/Range delegation.
Source delta: **405 insertions / 46 deletions across three files** against HEAD, including the
initial candidate.

The index, Std paths and root/HTTP dependency configuration remained unchanged. The governing arc
still records HTTP as unlanded. Workflow updates remain outside the three-file source handoff. No
new independent S-tier verdict, isolated-commit proof, native Windows/browser execution,
entry-process task, build/preview, deployment or complete-chain certification is claimed. The unit
run includes ordinary HttpStatic/start coverage; it does not fault-inject AF-06 setup/cleanup.
Lexical admission remains separate from symlink/no-follow and race-free filesystem authority.

## Prelanding review — adjudication and verified finish

Review and finish HEAD: `e9baa28574ebd5492df5884280dda25333cf86d0`. The human ran the fresh
three-file review and returned **hold; not yet S-tier**, with no reproduced candidate-introduced
containment regression. The brief recommended `gpt-6.1-sol • high`; the returned report does not
attest the actual reviewer model/effort. The reviewer disclosed excluded filenames/history metadata,
not excluded artifact contents, and reported stable candidate bytes and removal of its sole test.

Reviewer-reported checks: permanent **1/18**, independent reproduction **1/5**, full HTTP unit
**59/466**, source/scripts check and exact-file format/lint. The independent cases covered request
normalization, admission before composed effects, malformed decoding, real loopback HttpStatic
serving/redirects and fixed-metadata JSON invalidation. These remain reviewer observations, not
implementer replication or cross-platform evidence.

### Dispositions and bounded corrections

The implementer inspected all three complete files, the transport, Fs path/type surfaces, live canon
and relevant history before accepting the finite findings. The human authorized F1–F3; source
ownership remains the same three-file cut.

- **F1 — accept, inherited false-green proof:** the existing `true`/`false` rewrite changes size and
  does not control mtime. Replaced that case, rather than adding another broad test, with literal
  JSON payloads whose actual stat sizes are checked equal. The existing stat seam supplies one fixed
  metadata object, including epoch mtime, through the real handler and ETag transport. An initial
  request returns exact original bytes, the unchanged file returns 304 with its tag, and rewriting
  then requesting the old tag returns 200, exact changed bytes and a different tag. Responses drain
  before assertions; direct dispatch adds no listener or AF-06 dependency. Removed the misleading
  commentary. The promise is content-sensitive ETags for small JSON, not all files.
- **F2 — accept, inherited and expanded owner-lane residue:** joining, resolution, directory index
  mapping and containment now use `Fs.Path` in both production files. Removed their `Path` imports.
  Fs delegates these operations to the same Std primitives; no new filesystem semantics or helper
  framework was introduced. Public wiring and downstream transport remain unchanged.
- **F3 — accept, introduced type residue:** the stat seam now names `t.Fs.GetStat` and returns
  `t.HttpServer.Hono.MiddlewareHandler`. Retained the intentionally local input-union inference; no
  public input type, option or export was added.
- **A1 — accept defect, separately deferred:** `m.HttpServer/t.ts::ServeStatic.Options` advertises
  unsupported `path`, `precompressed`, `rewriteRequestPath` and `onFound`. Source/history support
  inheritance; the reviewer executed the ignored rewrite/callback sequence. Reconcile the public
  contract at that owner under separate authorization, not by adding routing/compression to this
  cut.
- **A2 / AF-06 — accept defect, retain separate deferral:** `usingServer` acquires the listener
  before protected client construction. The existing Range test uses custom construction but does
  not exercise its throwing branch. This finish neither depends on that failure branch nor proves it
  safe. No fixture repair, leak injection or broader cleanup was performed.

No transport mutant or new production red was executed: the production content-sensitive ETag
already satisfies the corrected invariant. The replacement test was green on its first behavioral
run. Under the inspected metadata-only branch, fixed mtime and equal size yield the same tag and
would produce stale 304 at the discriminating request; that counterfactual is source reasoning, not
an executed mutation result. Type/import corrections are behavior-preserving finish.

### Separately owned local task

The human approved only `code/sys/http/deno.json` as ancillary scope. Added:

```json
"check:frozen": "deno check --frozen --cached-only ./src/ ./-scripts/"
```

The existing `check` definition is unchanged verbatim. The strict task covers HTTP source and its
scripts without forwarding flags beyond the old task's `--`. The inspected scripts directory has
only `task.clean.ts`; no original target was dropped. Removed one inherited extra EOF blank line
reported by the exact-file formatter check. No permission, export, dependency, workspace-runner or
canon change was made. This is not a workspace-wide strict-check convention or a new Dist arc item.
The task file remains outside the three-file containment source handoff.

### Fresh final-byte verification

Host: Darwin arm64; Deno 2.9.7, TypeScript 6.0.3, V8 15.0.245.2-rusty. From `code/sys/http`:

```sh
deno task test:unit --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts
deno task check:frozen
deno fmt --check ./deno.json ./src/http.server/m.HttpServer/u/u.serveStatic.ts ./src/http.server/m.HttpServer/u/u.middleware.ts ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts
deno lint ./src/http.server/m.HttpServer/u/u.serveStatic.ts ./src/http.server/m.HttpServer/u/u.middleware.ts ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts
deno task test:unit --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot
```

Focused **1 suite / 18 steps** and full unit **59 suites / 466 steps** passed with zero failures and
no ignored steps. The strict declared task passed. Format checked four files and lint checked three
files successfully; scoped source/config whitespace checks passed. The first format preview reported
the inherited EOF blank line and two changed layouts; only surgical edits were used.

All selected source bytes and the final diff were inspected. The three-file source delta against
HEAD is **449 insertions / 85 deletions**; the ancillary config adds one task and removes one blank
line. These checks close the accepted named findings, not a fresh independent S-tier verdict. No
staging, commit, automatic extra review, dependency acquisition, permission relaxation or evidence
rebinding occurred. Native Windows/browser/provider/deployment, isolated-commit execution, the
separate file-bytes entry task and complete-chain proofs remain unexecuted by this finish.
