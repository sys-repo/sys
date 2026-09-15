r2-files-delivery.plan.md
- [x] GATE owner authorizes one bounded R2 upload and authenticated readback
- [ ] docs(deploy): record Files-backed R2 upload and readback

## Purpose and stopping point

Prove one concrete delivery through the already-landed integration:

```text
selected local files in one frozen, verified Dist
→ existing Deploy push → Files.Client.local → Files/Cmd → R2.Files → R2.Bucket
→ authenticated R2 readback matching the retained local bytes
→ concrete object locations handed to owned HTTPS exposure
```

This plan ends at authenticated storage readback. The independently cohesive
[r2-web-exposure.plan.md](../@sys.driver.cloudflare/r2-web-exposure.plan.md) consumes that evidence
and proves those same bytes at the intended public URLs. No public hostname, Pi release, or exposure
implementation is a prerequisite for this storage proof. A small public-by-design non-release Dist
is sufficient; it must not be presented as product-release evidence.

## Revision and current evidence

At the human's direction, this replaces the unfinished `r2-dist-generation-publication.plan.md` arc.
Conditional settlement research, an owned S3 SDK, conditional object writes, immutable-generation
publication, commit receipts, CAS activation, and migration/GC machinery are withdrawn from this
journey, not completed or prerequisites waiting to be resumed. A future need for concurrent
publication requires a separately authorized work item grounded in that actual use case.

The uncommitted vendor, conditional kernel, and experiment harness were removed. Ordinary R2 again
uses the external `@bradenmacdonald/s3-lite-client@0.9.6`. The withdrawal checkpoint passed driver
check, package tests (7 suites / 47 steps), and dry publication. Those are recorded local checks,
not a current live R2 or public-host proof; the removed vendor's tests do not describe current code.
Known client and Files limitations remain limitations, not evidence that the discarded direction
must be rebuilt.

Existing integration and evidence owners:

- `28faad7b4 feat(driver-cloudflare): add R2 Files backing` supplied the adapter at
  `code/sys.driver/driver-cloudflare/src/m.r2/m.Files/m.create.ts`.
- `dc1f58461 feat(deploy): publish through writable Files backing` supplied the Deploy composition;
  `77b07a6bf` added unchanged-publish detection and `60b09ea80` supplied textual R2 reads without a
  public origin. These are landed capabilities, not new implementation items.
- `code/sys.tools/src/cli.deploy/u.providers/provider.r2/u.push.ts` composes the Files client,
  uploads assets, writes `dist.json` last, and prunes stale objects in its configured prefix. It
  loads manifest metadata and reads files normally; it is not a checksum-pinned, conditional,
  transactional, or automatic readback publisher. Skip decisions are not proof of remote bytes.
- The retired Files backing plan at
  `bd7d0e6c7:-agent/-plan/@sys.driver.cloudflare/r2-files-backing.plan.md`, removed by `dd5bd2450`,
  records manual uploads and unchanged-publish checks with and without `readOrigin`. These are
  historical records, not live operations rerun for this revision.
- Existing exact Dist staging, verification, preview, and Pi consumer integrity mechanisms remain
  intact. Reuse `Pkg.Dist` verification; do not duplicate it or project local locks/sealing onto R2.

The owner authorized reuse of the disposable sample target: `sys-test` bucket,
`tmp.sys.tools/r2-proof` prefix. One Files-backed upload wrote three objects and reported 123 stale
sample objects pruned. After two stopped readback attempts exposed temporary-probe defects, the
separately approved final read-only pass verified all three objects byte-for-byte and by SHA-256.
The final listing contained exactly those objects; pinned local verification passed before and
after. Authenticated storage proof is complete. Public delivery remains unverified. The detailed
history and completed evidence below distinguish upload acknowledgement from verified bytes.
Planning itself grants no live operation or Git mutation.

## Concrete proof procedure

### Select and prepare locally

1. Select one small public-by-design Dist and retain its exact manifest bytes/integrity, package
   identity, and declared relative paths, byte sizes, and hashes using existing `Pkg.Dist`
   verification. Expected values come from the selected local artifact, never from the remote
   target.
2. Freeze that candidate for the journey. If ordinary staging is needed, finish it before selection.
   Staging can regenerate the manifest, package identity, indexes, and HTML; do not run `stage+push`
   over an already-selected artifact. Inspect the existing push-only target resolution at
   `code/sys.tools/src/cli.deploy/u.push/u.endpoint.ts` and `u.resolveR2PushTargets.ts` to bind the
   actual selected root through `staging.dir`. Reverify against the retained authority before upload
   and after the run. This operating procedure does not add a per-upload pinned-read guarantee to
   the current push implementation.
3. Use only the owner-approved disposable sample namespace: bucket `sys-test`, prefix
   `tmp.sys.tools/r2-proof`. The owner explicitly permits replacing its old contents, including
   stale-file pruning; a fresh or empty prefix is not required for this sample. Do not target the
   bucket root, sibling prefixes, or another active publisher. Keep other writers out during the run
   and retain successful objects unchanged through the companion HTTPS proof. This operating
   restriction is not provider-enforced immutability or concurrency fencing.
4. Keep the first proof's filenames simple and canonical: ordinary ASCII filename segments, no
   empty/dot segments, repeated separators, boundary whitespace, query/fragment characters, or
   ambiguous encodings. Record the actual admitted key set. This is an explicit proof-input limit,
   not a change to the public Files API or a claim that arbitrary keys work. Do not rename files in
   a frozen product artifact to disguise a limitation; a required unsupported filename needs a
   concrete owner decision or narrowly scoped correction before that artifact is attempted.
5. Record the exact existing upload invocation, authenticated readback composition, selected
   config/source paths, finite file/byte counts, and probe budget before remote execution. These are
   technical preflight obligations, not another request to decide whether the sample is disposable.
   Read owning tasks/permissions and CLI help before CLI use. Keep secret values out of tool output
   and docs; use only the sample's existing credential references for the authorized run. Do not
   read dotenv files or credentials merely for planning. Existing `R2.Bucket.read` returns
   authenticated object bytes without `readOrigin`; a public content reference is not S3 readback.
   Reuse existing APIs and declared task surfaces. A disposable proof test under the sample's `.tmp`
   directory may compose them without changing product source or package tasks. If that cannot
   express the required bounds, report the concrete gap rather than adding a new uploader, SDK,
   permanent integration harness, or product feature under this documentation item.

### Run only after authorization

- Inventory the exact approved prefix before push within the recorded listing budget. Existing
  sample objects may be replaced or pruned by the normal publisher. Stop on another writer,
  ambiguous key projection, exceeded bounds, or objects outside the admitted namespace. Do not run a
  separate wipe: replacement and stale pruning belong to the existing Files-backed push.
- Run the existing push-only Files-backed route once against that target. Preserve its actual
  written/skipped/pruned results and any failure or possible partial residue. A failed request can
  leave stored objects; do not infer rollback or non-commit from the local error.
- Authenticated GET the exact uploaded `dist.json` and every declared asset through the R2 bucket
  read path. Consume and close bodies; compare complete bytes, lengths, and hashes against retained
  local evidence, and record representation metadata needed by the intended reader. ETags, HEAD,
  object existence, CLI success, and remote-manifest skip metadata cannot replace this readback.
- Keep reads finite for the selected small artifact; include expected object count, total bytes,
  oversized-response refusal, and retry/timeout limits in the chosen invocation. Operator bounds are
  not proof that the existing SDK enforces a page, cancellation, or provider-settlement deadline.
- Any missing, mismatched, or incompletely read object leaves the proof incomplete. Stop on the
  specific failure; do not repin from R2, silently broaden filename support, or automatically repair
  the target. Record residue and obtain separate authority for cleanup or another upload.
- Hand off the selected artifact authority, bucket/prefix, exact keys, and observed readback
  results. An optional configured `readOrigin` is a URL hint only; report exposure as unverified
  until the companion plan fetches the actual owned HTTPS URLs.

## GATE owner authorizes one bounded R2 upload and authenticated readback

Resolver: the human controlling the sample R2 account and proof data. This decision controls the
live upload/readback procedure required by
`docs(deploy): record Files-backed R2 upload and readback`.

Resolution evidence: after the upload, pruning, readback, and public-by-design scope was explained,
the owner stated that the integration sample was disposable, authorized replacing its contents, and
then explicitly instructed: "update plan [x]" and "do it", limited to proof/research and docs
without affecting source files. This replaces the earlier withholding of live sample authorization;
it does not establish technical readiness or successful delivery.

Approved boundary:

- Config: `code/sys.tools/.tmp/-config/@sys.tools.deploy/r2-proof.yaml`.
- Target: bucket `sys-test`, prefix `tmp.sys.tools/r2-proof`, including normal stale-file deletion
  inside that prefix only. The historical `manual/r2-proof` prefix is not the current target.
- Sample: `code/sys.tools/.tmp/r2-proof/source`; existing candidate staging root:
  `code/sys.tools/.tmp/staging/r2-proof`. The config also includes a UI `build+copy` mapping; do not
  invoke it as part of a push-only proof or claim this is only a two-file candidate.
- Credential references: `SYS_TEST_R2_ACCESS_KEY_ID` and `SYS_TEST_R2_SECRET_ACCESS_KEY`. Resolution succeeded through the existing upward dotenv loader in the live run; secret values
  were not emitted. No secret values belong in evidence.
- One bounded Files-backed upload/replacement and authenticated all-object readback of suitable
  sample data. No standalone wipe, automatic retry/repair, or cleanup after failure.
- Product source and package tasks remain untouched; durable changes are documentation only.

Before execution, verify and freeze the candidate and record its exact key set, bytes, commands,
credential-loading path, permissions, listing/write/read budgets, and timeout/retry behavior. Those
technical checks remain mandatory even though the owner decision is resolved. Failure stops the
proof; it does not reopen the sample-disposability decision or permit bypassing an integrity check.
A rejected authorization would prohibit the live run; an expanded target or scope requires a new
owner decision. Host configuration, production adoption, and Git mutation remain separately
authorized actions. Never broaden runtime permissions or weaken security checks to get past a
denial.

## `docs(deploy): record Files-backed R2 upload and readback`

Record the completed operator procedure and redacted storage evidence here and in the existing
Deploy guidance where needed: exact code/client identity, candidate manifest integrity and package,
key/count/byte expectations, admitted target, commands, actual results, per-object readback
comparison, and retained or uncertain residue. Separate local verification, upload acknowledgement,
authenticated readback, and unverified public locations. Keep credentials and signed requests out of
evidence.

This is a proof/documentation item over existing code, not permission to declare live success in
advance. If a concrete implementation gap prevents the procedure, resolve its ownership and revise
this small arc explicitly rather than burying a feature inside a documentation commit.

## Observed local preflight

The existing sample configuration and staged `dist.json` were opened. The manifest identifies
`@sys/tools@0.0.463` and declares UI JavaScript/font assets as well as `hello.txt` and `index.html`.
Its recorded build total is 2,147,774 bytes; this is a manifest claim, not verified byte evidence.

From `code/sys.tools`:

```sh
deno task test:deploy
```

Result: 34 suites / 281 steps passed. These are local tests, not live Cloudflare evidence.

A disposable test invoked the current `Pkg.Dist.Local.verify` against the existing staged root:

```ts
await Pkg.Dist.Local.verify({
  dir: '/Users/phil/code/org.sys/sys/code/sys.tools/.tmp/staging/r2-proof',
  limits: {
    manifestBytes: 131072,
    entries: 512,
    fileBytes: 1048576,
    totalBytes: 4194304,
  },
});
```

Executed through the owning package task:

```sh
deno task test:deploy --filter='R2 delivery proof: local candidate' ./.tmp/r2-proof/-test/-local.test.ts
```

Result: `{ "kind": "unexpected-entry" }`; the assertion requiring `verified` failed (0 passed, 1
failed, 34 filtered out). This candidate does not establish exact Dist authority. Path inspection
also found `ui.components/dist.json`, which the root manifest does not declare; the verifier's
sanitized result does not identify which entry triggered the rejection.

That earlier preflight stopped before reading credentials or making any R2 request. No upload, authenticated
readback, remote inventory, or remote cleanup was attempted. The candidate was not altered or
regenerated to bypass the failure. The disposable local probe file was removed after the run; the
command above is a historical invocation, not a currently runnable test path. Its verification
inputs and result are retained here. No product source or package task was changed.

The inspected Deploy CLI exposes `stage`, `push`, and `stage+push`, not an authenticated readback
action. The driver exposes `R2.Bucket.read`, backed by the existing signed S3 transport. Neither
owning package declares a dedicated live readback task; the disposable composition below was
subsequently prepared. Do not mistake the public `readOrigin` for that readback path.

## New minimal candidate and bounded invocation

After the rejected-candidate report, the owner explicitly instructed
`docs(deploy): record Files-backed R2 upload and readback` → `GO`. A separate copy-only sample was
prepared; neither the rejected staging tree nor product source was changed.

- Runtime/code baseline: `a90e67f0e22c51acb9186ff7f1e75880609cc6ba` (`Update deno.lock`),
  with no tracked tools/Cloudflare source delta at inspection.
- Package/runtime: `@sys/tools@0.0.499`, Deno 2.9.6, TypeScript 6.0.3.
- Selected manifest package: `@sys/tools@0.0.499`, build time `1789460326398`; this is the
  deliberately prepared non-release sample, not a verified product release.
- Source: `code/sys.tools/.tmp/r2-proof/source` (existing `hello.txt` and `index.html`).
- Stage config: `code/sys.tools/.tmp/r2-proof/delivery.stage.yaml`, copy-only, no provider or build.
- Selected root: `code/sys.tools/.tmp/staging/r2-files-delivery`.
- Push config: `code/sys.tools/.tmp/r2-proof/delivery.push.yaml`, same account, credential references,
  bucket and prefix as the owner-approved config; staging points only to the selected root,
  `mappings: []`, no `readOrigin`.
- Exact manifest checksum:
  `sha256-73704507e5faf41c0df7b4bb59a475be7eddde019f047c7e363b327fbec670c3`.
- Dist content digest:
  `sha256-eefba4223274b5c130ef7a26d098874a647322d951ee28f493e3fbb3a4280c1c`.
- Verified assets: 2 files / 252 bytes. Manifest: 1,001 bytes. Upload/readback set: 3 objects /
  1,253 bytes, all under `tmp.sys.tools/r2-proof/`.

| Relative object | Bytes | SHA-256 |
| --- | ---: | --- |
| `hello.txt` | 6 | `5891b5b522d5df086d0ff0b110fbd9d21bb4fc7163af34d08286a2e846f6be03` |
| `index.html` | 246 | `d5e9bc96f3095c606e35bdadba0a0685ce9a77ab438b4842eaf8d646a57f846c` |
| `dist.json` | 1001 | `73704507e5faf41c0df7b4bb59a475be7eddde019f047c7e363b327fbec670c3` |

The preparation test called existing `Deploy.stage`, then `Pkg.Dist.Local.verify` with limits
`{ manifestBytes: 16384, entries: 8, fileBytes: 4096, totalBytes: 8192 }`. It passed. A separate
no-network guard selfcheck passed after correcting a TypeScript key-array annotation mismatch in
the disposable probe; type checking was not disabled.

Commands from `code/sys.tools`, using the existing `test:deploy` task and its declared `test`
permission preset (read/write/env/net/run). Neither task nor permissions were changed:

```sh
deno task test:deploy --filter='R2 delivery proof: prepare new candidate' ./.tmp/r2-proof/-test/-delivery.test.ts
deno task test:deploy --filter='R2 delivery proof: guard selfcheck' ./.tmp/r2-proof/-test/-delivery.test.ts
```

Historical live invocation, executed once (do not rerun):

```sh
deno task test:deploy --filter='R2 delivery proof: live upload and readback' ./.tmp/r2-proof/-test/-delivery.test.ts
```

The disposable probe composes existing APIs: pinned local verification and retained original bytes
→ existing endpoint env resolution → bounded raw bucket inventory →
`Deploy.push({ cwd, config, force: true })` → three authenticated `R2.Bucket.read` calls → exact byte,
length and SHA-256 comparisons → postflight inventory and pinned local verification. `force: true`
is the existing explicit replacement mode, used once to write all three selected objects instead
of relying on remote-manifest skip decisions. Stale deletes remain normal Files-backed publisher
behavior, not a separate wipe. No CLI entry point or public-origin fetch is invoked.

Credential loading uses the existing `EndpointsFs.validateYaml` → `YamlConfig.Env` → `Env.load`
upward dotenv resolver from `code/sys.tools/.tmp`; repository-root `.env` was located by path only.
Only the two configured R2 credential references are consumed by this composition. Do not emit
secret values, raw SDK errors, signed requests, or dotenv contents.

Probe bounds, fixed before remote execution:

- Exact approved R2 HTTPS origin/bucket/prefix only; reject redirects and out-of-prefix requests.
- Preflight inventory: at most 128 existing canonical object keys, detecting overflow with a 129th
  result. Reject duplicate keys and file/directory collisions before writes.
- Request ceilings: 300 LIST, 512 HEAD, 3 PUT, 128 DELETE, 3 object GET. Object PUT/DELETE/GET may
  occur only once per admitted key. PUT and GET are limited to the selected three objects; DELETE
  is limited to preflight-inventoried stale objects and excludes the selected set.
- Response consumption ceilings: 262,144 bytes per listing response; exact expected object length
  per readback; 4,096 bytes for other response bodies. Cancel/refuse oversized responses.
- 20-second per-request abort signal, 180-second overall abort signal, and a 240-second outer
  command timeout. No operator retry or automatic repair. These are probe bounds, not a provider
  settlement guarantee or a new product/SDK cancellation contract.
- Readback consumes complete bodies; final inventory admits exactly the selected three keys.
  Keep the selected local and successful remote objects unchanged for the separate HTTPS proof.

## Observed upload and partial readback

The live invocation failed overall (0 passed / 1 failed / 36 filtered out), after the existing
publisher returned `ok: true`, one target, three `written` files, no skipped files, and 123
`removed` stale files, all under `tmp.sys.tools/r2-proof/ui.components/`. Its `bytes: 252` field
counts assets; the manifest adds 1,001 bytes, making 1,253 uploaded object bytes. Upload elapsed:
36 seconds. Request counts at failure: LIST 128, HEAD 126, PUT 3, DELETE 123, object GET 2.
The initial inventory had 126 objects; no postflight inventory was reached.

Authenticated `hello.txt` readback: HTTP 200, 6 bytes, exact byte and SHA-256 match against the
retained local authority above, `text/plain`, no Cache-Control or Content-Encoding, ETag
`b1946ac92492d2347c6235b4d2611184`. The second GET was for `index.html`; the probe failed before
its comparison. `dist.json` was not read back. No repair, re-upload, cleanup, or automatic retry
followed. Three successful write acknowledgements are not three verified remote objects.

The original probe obscured its own structured errors: `Err.std()` produces a plain StdError,
but its catch only recognized native errors with `Is.error()`. This is a confirmed probe-owned
diagnostic defect, not evidence of a Deploy, R2, or SDK byte defect. The lost reason cannot be
recovered retrospectively. Selected response metadata was also logged too late to diagnose it.

## Authorized read-only follow-up

The owner explicitly instructed `GO` after the proposal to fix diagnostics and verify existing
objects read-only. No second upload or deletion is authorized by this follow-up.

Disposable replacement: `code/sys.tools/.tmp/r2-proof/-test/-readback.test.ts`. It has no stage or
push invocation. It retains only probe-owned diagnostic objects by identity; arbitrary native or
structured SDK messages remain redacted, while permission denials remain visible. Response status
and selected representation headers are logged before response guards. Local regression checks
cover the StdError/native distinction, redaction, prohibited methods/targets/repeats, and
header/body-size limits; 1 test passed, 35 filtered out.

Read-only run baseline: HEAD `ce10ecc096923523930ba4a4187fcfbd62768296`; unrelated concurrent
Cloudflare enumeration type/test work exists and is not changed by this proof. Same existing
endpoint configuration, credentials, signed bucket API, retained bytes and manifest integrity.
Existing `test:deploy` task and its `test` preset remain unchanged.

From `code/sys.tools`:

```sh
deno task test:deploy --filter='R2 readback: local diagnostics' ./.tmp/r2-proof/-test/-readback.test.ts
deno task test:deploy --filter='R2 readback: live existing objects' ./.tmp/r2-proof/-test/-readback.test.ts
```

Fixed before execution: at most one GET per selected object (3 / 1,253 expected object bytes),
one exact-prefix LIST response (16,384 response bytes, request at most 4 records to detect an extra
object), no other HTTP method or origin, no redirects or repeated requests. Each object keeps its
exact expected response/body limit and byte/hash comparison. Per-request timeout 20 seconds,
overall abort signal 90 seconds, outer command timeout 120 seconds. Pin verification precedes
credential resolution and follows successful readback/inventory. Stop on failure; do not relax
integrity checks, retry automatically, or infer rollback.

### Read-only diagnosis result and local correction

The authorized diagnostic read-only invocation stopped after two object GETs: `hello.txt` again
matched exactly; `index.html` returned HTTP 200, `text/html`, `Content-Encoding: gzip`, no
Content-Length. The now-visible failure was `unexpected-content-encoding`. No LIST, write, delete,
manifest GET, or final local verification was reached. Result: 0 passed / 1 failed / 35 filtered
out. This identifies the current refusal; it does not retroactively recover the original lost error
or establish an `index.html` byte mismatch.

The temporary probe incorrectly treated HTTP compression as a failed object proof. A real local
HTTP fixture on Deno 2.9.6 confirmed that fetch automatically decodes gzip while retaining the
Content-Encoding header; it can also retain the *encoded* Content-Length (29 encoded bytes for 3
decoded bytes in this fixture). The first fixture assertion incorrectly expected Content-Length
to be removed; that assumption was corrected against observed runtime behavior, not guessed away.

The read-only probe now accepts the locally tested gzip representation without manually decoding
it again. It still bounds the consumed, decoded object stream to the exact retained object size
and requires exact byte, length and SHA-256 equality. A present gzip Content-Length is checked
against a separate 4,096-byte encoded-header ceiling, not confused with the decoded object size.
Absent Content-Length does not establish a wire-byte bound; the stream limit bounds application
bytes, while abort signals bound request time. Unsupported encodings, malformed gzip, decoded
oversize responses and same-length changed bytes still fail. No request headers, credentials,
signatures, SDK/product code, expected hashes, or local artifact bytes were changed.

Local verification command, from `code/sys.tools`:

```sh
deno task test:deploy --filter='R2 readback: local' ./.tmp/r2-proof/-test/-readback.test.ts
```

Result: 2 passed / 0 failed / 35 filtered out, with normal type checking and leak sanitizers.
The runtime fixture exercised actual loopback HTTP gzip decoding, retained encoded length,
exact matching bytes, same-length corruption refusal, decoded overflow refusal, malformed gzip
refusal and unsupported encoding refusal. The separate diagnostic test covers error provenance,
redaction and request/response limits. An earlier compilation attempt caught a temporary fixture
ArrayBuffer annotation issue and concurrent enumeration-work type skew; the fixture annotation
was corrected, the concurrent work was not edited, and the final task typechecked normally.

The one-shot diagnostic run stopped as promised. The owner then explicitly approved one final
read-only pass: three object GETs plus one exact-prefix LIST, 1,253 expected decoded object bytes,
16,384 listing-response bytes, 20-second request / 90-second overall / 120-second command
deadlines, with the encoded-header distinction above. No upload or deletion. Its successful result
is recorded below. The old upload-capable `-delivery.test.ts` is removed to prevent accidental
reuse; its commands above are historical. The read-only probe and selected artifact remain under
`.tmp` for inspection; this completed authorization is not permission to rerun it.

## Completed authenticated storage proof

Owner continuation: `approved`, answering the explicit proposal for one final read-only pass of
3 object GETs + 1 LIST, no uploads or deletes. Executed once from `code/sys.tools`:

```sh
deno task test:deploy --filter='R2 readback: live existing objects' ./.tmp/r2-proof/-test/-readback.test.ts
```

Result: **1 passed / 0 failed / 36 filtered out**, with normal type checking and leak sanitizers.
Completion time: **2026-09-15T08:50:20.715Z** (`1789462220715`); probe elapsed 708 ms. Requests
were exactly `hello.txt`, `index.html`, `dist.json`, then one prefix LIST. No HEAD, write, delete,
redirect, repeated request, or retry occurred in this pass.

Code provenance: HEAD `ce10ecc096923523930ba4a4187fcfbd62768296`, Deno 2.9.6, existing
`@bradenmacdonald/s3-lite-client@0.9.6`. The worktree also contained unrelated in-progress Cloudflare
Files enumeration changes, including a per-list S3 client/request-hook wrapper in
`src/m.r2/u/u.transport.s3.ts`; the bucket read route still delegated to `client.getObject`.
This is observed worktree evidence, not an assertion that the final pass ran on a clean commit or
validated the concurrent enumeration work. This proof changed no product source or package tasks.

Account: `1e6ec0395407e49eef7ee54f667d61de`. Bucket: `sys-test`. All reads used the existing
signed S3-compatible `R2.Bucket.read`, not `readOrigin`. Exact successful object comparisons:

| Full object key | Decoded bytes | HTTP | Media type | Content-Encoding | Byte/length/SHA-256 match |
| --- | ---: | ---: | --- | --- | --- |
| `tmp.sys.tools/r2-proof/hello.txt` | 6 | 200 | `text/plain` | absent | yes |
| `tmp.sys.tools/r2-proof/index.html` | 246 | 200 | `text/html` | `gzip` | yes |
| `tmp.sys.tools/r2-proof/dist.json` | 1001 | 200 | `application/json` | `gzip` | yes |

All three SHA-256 values are exactly the retained pre-upload values in the candidate table above;
1,253 complete decoded bytes were compared directly as well as by hash. All three GET responses
had no Cache-Control. Content-Length was `6` for `hello.txt`, absent for the other two. GET ETags:
`"b1946ac92492d2347c6235b4d2611184"`, `W/"88c89f2aee02d2373d08c1616bac6a79"`, and
`W/"c47fa3688a5f88b16a28d178297149b1"`, respectively. ETags were recorded, never used as the
integrity authority. Gzip was decoded once by Deno fetch; it did not require changing stored bytes.

The final authenticated LIST returned exactly those three keys, with sizes 6, 246 and 1,001 bytes.
Its modification times were `2026-09-15T08:27:33.548Z` (`hello.txt`),
`2026-09-15T08:27:33.655Z` (`index.html`) and `2026-09-15T08:27:34.274Z` (`dist.json`). No stale
sample key remained in that observed listing. The selected local artifact passed pinned
verification before credential resolution and again after readback and listing, against
`sha256-73704507e5faf41c0df7b4bb59a475be7eddde019f047c7e363b327fbec670c3`.

### Handoff to HTTPS exposure

Retain `code/sys.tools/.tmp/staging/r2-files-delivery` and the three remote objects unchanged.
The selected manifest integrity, per-file hashes, exact keys, representation metadata and final
observation above are the authority for the companion
[r2-web-exposure.plan.md](../@sys.driver.cloudflare/r2-web-exposure.plan.md).

The original sample configuration contains a `readOrigin` hint. These concrete candidate public
locations are **not fetched or verified by this storage proof**:

- `https://pub-8bd1da0f59614c7bbc75f21d60db6a9c.r2.dev/tmp.sys.tools/r2-proof/hello.txt`
- `https://pub-8bd1da0f59614c7bbc75f21d60db6a9c.r2.dev/tmp.sys.tools/r2-proof/index.html`
- `https://pub-8bd1da0f59614c7bbc75f21d60db6a9c.r2.dev/tmp.sys.tools/r2-proof/dist.json`

The exposure owner must establish the intended route and fetch the same retained bytes; a URL
hint, authenticated storage success, or a matching ETag is not public-delivery evidence. This
result proves the selected object bytes at the observed time, not atomic publication, physical
wire-byte identity, indefinite retention, competing-writer safety, or a Pi product release.

## Known limits and independent work

- The restored S3 client has known special-key signing and listing-decoding/parser limitations; no
  comprehensive SDK repair or unrestricted filename claim accompanies withdrawal. Normal R2 behavior
  and tested inputs must be observed, not inferred from former vendor tests.
- Files projection can alias distinct raw object keys when path normalization collapses repeated
  separators (`m.r2/m.Files/u/path.ts` and `u/entry.ts`). A small controlled canonical namespace
  avoids deliberately introducing that case; it does not fix it or establish hostile-namespace
  safety.
- [r2-files-enumeration-bounds.plan.md](../@sys.driver.cloudflare/r2-files-enumeration-bounds.plan.md)
  independently owns whole-prefix scan/index budgets. This journey DOES use the existing Files
  index, including write probes and prune/list work. Small result pages do not bound provider work;
  keep the selected namespace small and controlled. Its hardening is not a prerequisite for this
  limited proof and is not completed by it. Key-projection correction remains a separate driver
  concern, not silently added to that plan's enumeration arc.
- Files policy governs Files operations only; direct bucket reads and public HTTP access do not
  inherit it. Preserve credentials, SigV4, HTTPS verification, Files policy, and consumer pins.
- A completed readback proves the selected objects at the observed time, not atomic publication, a
  complete hostile namespace, availability forever, signed provenance, or competing-writer safety.
- Pi's product entry, unchanged release-candidate handoff, retention decision, browser/worker
  policy, cold/warm acquisition, and published evidence remain in its release plan. A non-release
  proof neither waits for nor completes those obligations.

## Next action

Storage proof is complete. Preserve the selected local artifact and remote objects for the
separately owned HTTPS exposure proof. Do not rerun upload or readback under this consumed
one-shot authorization. No Git mutation or public-host configuration was performed.
