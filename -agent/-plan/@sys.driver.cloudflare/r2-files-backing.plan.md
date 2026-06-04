# R2 Files<T> Backing Plan


- [x] 54f23172c feat(model): add Files client write/remove helpers
- [x] d6502b39c deps(driver-cloudflare): add s3-lite-client for R2 signed HTTP
- [x] da0e4b35f feat(driver-cloudflare): add R2 service and bucket handle
- [x] 28faad7b4 feat(driver-cloudflare): add R2 Files backing
- [x] dc1f58461 feat(deploy): publish through writable Files backing
- [x] 77b07a6bf feat(deploy): skip unchanged Files publishes from dist manifest
- [x] manual integration: publish `.tmp` deploy endpoint to R2 through `@sys/tools` CLI
- [x] live proof: unchanged publish skips through remote `dist.json`
- [x] live proof: unchanged publish skips without public `readOrigin`
- [x] 6ed1ef57f feat(deploy): add force push repair mode
- [x] a09ebb888 feat(deploy): prune stale R2 publish files

## Current landing posture: publish/skip/force/snapshot replacement pruning landed

BMIND/DMIND verdict: the R2 deploy path has landed for writable publish, unchanged-publish skip detection, no-public-origin textual `dist.json` reads, explicit force repair, and stale remote file pruning so file-by-file R2 deploy matches deploy's snapshot replacement contract.

Core baseline: `deploy` is not an incremental remote filesystem copy. Deploy replicates a staged snapshot to the configured endpoint namespace. Remote files under that namespace that are absent from the staged `dist.json` are stale deploy drift. Orbiter already behaves like a complete-unit replacement; R2 needs explicit stale-file pruning because it publishes individual Files entries.

Earlier landed boundaries remain: `dc1f58461 feat(deploy): publish through writable Files backing` and `77b07a6bf feat(deploy): skip unchanged Files publishes from dist manifest` established the deterministic deploy integration arc. The current driver/tools follow-up closed the live/private-read gap for textual deploy manifests, added non-destructive force repair, and landed R2 snapshot-replacement pruning in `a09ebb888 feat(deploy): prune stale R2 publish files`.

The deploy provider commit boundaries remain pure deploy implementation/coverage:

- provider implementation lives under `code/sys.tools/src/cli.deploy/u.providers/provider.r2/`
- existing deploy files are narrow schema/probe/type/dispatch/menu/coverage wiring
- no live Cloudflare lane is included
- no public S3/AWS vocabulary is introduced
- no raw R2/S3 write loop is used for publishing or pruning
- staged artifact bytes are read from local FS and written through `Files.Client.writeBytes`
- stale files must be removed through the Files client/remove boundary, not raw R2/S3 APIs
- `dist.json` remains the release marker and is written last in the publish phase

The unchanged-publish short-circuit uses the remote Files-readable `dist.json` as the release marker and skips unchanged publishes without widening deploy YAML or introducing public S3/AWS vocabulary. Manual R2 publication has been proven live against a disposable prefix. A public `readOrigin` is optional: useful for public URL refs/display proof, but not required for deploy's “already published?” check.

## Landed deploy semantics slice: prune stale R2 publish files

DMIND verdict: prune-by-default is correct once the deploy contract is stated as snapshot replacement at the configured endpoint namespace. Do not model this as an optional `publish.stale` schema knob unless a future product requirement explicitly needs incremental remote Files behavior. Incremental remote filesystem manipulation belongs at the Files API layer, not deploy.

Target semantics:

- Normal R2 push publishes changed/new staged files, writes `dist.json` last, then removes remote files under the configured R2 Files prefix that are not present in the staged `dist.json` file set.
- Force R2 push rewrites all staged files, writes `dist.json` last, then performs the same stale-file prune.
- Orbiter remains conceptually aligned as a complete-unit publish; no R2-specific public deploy vocabulary is introduced.

R2 prune algorithm:

1. Load staged `dist.json`.
2. Read remote `dist.json` for skip optimization unless force is enabled.
3. Publish changed/all staged files through `Files.Client.writeBytes`.
4. Write `dist.json` last in the publish phase.
5. List remote files through the R2 Files view scoped to the configured provider prefix.
6. Expected set = staged dist parts plus `dist.json`.
7. Remove remote-only files not in the expected set through the Files client/remove boundary.
8. Return prune stats separately from publish stats.

Safety invariants:

- Prune is default deploy behavior for R2 because deploy is snapshot replacement, not an incremental hard drive.
- Do not add a `publish.stale` option for this slice.
- Prune only inside the configured R2 Files prefix / Files view.
- Do not delete outside the endpoint-owned publish namespace.
- Do not delete current staged files or `dist.json`.
- List failure means no deletes and a truthful push failure.
- Remove failure is reported truthfully.
- Delete operations use Files client/remove, never raw R2/S3 delete loops in deploy.
- No public AWS/S3 vocabulary.

Stats/report shape:

- Keep publish stats as per-file `written` / `skipped` facts.
- Add prune stats separately; do not widen publish file status with `removed` if that risks breaking existing consumers.
- Report removed stale files as a separate neutral/yellow row, not as green uploads.

STIER coverage target:

- R2 provider tests own stale listing/removal mechanics, expected-set computation, list failure, remove failure, force+prune ordering, and no staged-file removal.
- R2 endpoint-action tests may cover prune stats/report wording and orchestration only.
- Generic endpoint-action tests stay provider-neutral.
- Programmatic push returns additive prune stats without breaking existing publish stats.

## Future work, not current blockers

These are explicitly outside the stale-prune slice:

- private/signed arbitrary binary read path for non-public R2 content
- optional deeper verify/repair mode that hashes remote object bytes before deciding what to repair
- optional release retention/generation policy for cached old assets
- richer deploy-owned read-plane routing/cache/metering policy

None of these are required for R2 deploy publish, unchanged-publish detection, force repair, or snapshot replacement pruning.

### Landed robustness slice: force push repair mode

DMIND verdict: force/repair for deploy push is the clean non-destructive robustness step; it is deploy work, not R2 driver work.

Problem it solves:

- Normal push trusts matching remote `dist.json` and skips writes.
- That is correct for normal deploy deltas, but it cannot repair out-of-band object drift when the manifest still matches.

Landed shape:

```sh
deploy --non-interactive --config ./endpoint.yaml --action push --force
```

Semantics:

- `--force` applies only to push and stage+push push phases.
- R2 force push skips the remote-manifest optimization and writes every staged file, then writes `dist.json` last.
- It is non-destructive by itself: no remote-only object deletion is caused by force.
- It does not require private binary reads, signed URLs, or R2 driver changes.
- Writes still go through `Files.Client.writeBytes`.
- Programmatic `Deploy.push(...)` accepts the same force option so CLI and API semantics stay aligned.

STIER coverage:

- args parser accepts `--force`
- non-interactive push carries force into endpoint action
- R2 provider writes all staged files even when remote `dist.json` matches
- normal unchanged push still skips all files
- stage+push carries force only into the push half
- public push result/report remains derived from per-file publish entries
- R2 endpoint-action orchestration tests are isolated in `-u.endpointAction.r2.test.ts`; provider-specific assertions are not mixed into the general endpoint-action spec

Force remains repair behavior; stale prune is the separate snapshot-replacement behavior for the next slice.

## Thesis

Files<T> is the file interface. R2 is a bucket transport below Files. Deploy is a workflow over Files.

`@sys/model/files/static` remains the readonly `dist.json` projection. This plan adds a writable Files backing for R2-backed storage, with read serving treated as a projection over that backing.

## Current working reality

- `54f23172c feat(model): add Files client write/remove helpers` landed the model client mutation surface.
- `d6502b39c deps(driver-cloudflare): add s3-lite-client for R2 signed HTTP` landed the internal signed HTTP substrate dependency.
- `da0e4b35f feat(driver-cloudflare): add R2 service and bucket handle` landed the R2 service/bucket infrastructure surface.
- `28faad7b4 feat(driver-cloudflare): add R2 Files backing` landed the writable R2 Files backing.
- `dc1f58461 feat(deploy): publish through writable Files backing` landed the deploy R2 provider and Files-backed publish path.
- `77b07a6bf feat(deploy): skip unchanged Files publishes from dist manifest` landed the provider-local unchanged-publish optimization: one Files read of remote `dist.json`, digest/part diffing, upload-all fallback on read/parse/validation failure, and `dist.json` final write preservation.
- Live manual `@sys/tools` CLI proof from `code/sys.tools/.tmp` against disposable prefix `manual/r2-proof` has passed.
- Public-origin proof passed with Cloudflare Public Development URL configured.
- No-origin proof passed without `readOrigin`: remote `dist.json` was read through the R2 API/Files path and unchanged files were skipped.
- Other unrelated agent-plan/UI paths may also be present in the worktree. Do not mix those with deploy work; close, stash, or explicitly carry them before editing the deploy path.
- No scoped `AGENTS.md` exists under `code/sys.driver/driver-cloudflare` as of this plan update.

## Model seam

Files already owns `files:write`, `files:remove`, capabilities, policy, manifests, and complete-value write semantics.

The model gap was client ergonomics only. Helpers now exist on the Files client surface:

- `writeText(path, text, options?)`
- `writeBytes(path, bytes, options?)`
- `remove(path, options?)`

The helpers lower to the existing Files `Cmd` grammar. Do not add R2 types, bucket types, S3 terms, or provider authority to `@sys/model/files`. If an R2 quirk leaks upward, fix the R2 backing seam rather than widening Files.

## External R2 access decision

DMIND verdict: external Deno and Deno Deploy callers should use Cloudflare R2's S3-compatible HTTP API. This is the official non-Worker object access plane, not a legacy workaround. The R2 endpoint is `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`; the R2 S3 region is `auto`.

Worker `R2Bucket` bindings are a separate Worker-native access plane. Keep that as a future natural extension, for example a Worker/binding adapter namespace, not something jammed into the Deno HTTP service shape.

Dependency verdict:

- Do not add `npm:@aws-sdk/client-s3` for this driver path unless a concrete incompatibility forces it.
- Do not hand-roll SigV4/HMAC in this package.
- Use `jsr:@bradenmacdonald/s3-lite-client@0.9.6` as the internal fetch-native S3-compatible client for the first R2 HTTP implementation.
- Treat `aws4fetch` as the lower-level fallback only if we later decide to own the S3 REST adapter ourselves.
- Keep the dependency private to the driver adapter; do not export S3 client types or names from the public R2 or Files-facing API.

Concrete internal mapping target:

```ts
new S3Client({
  endPoint: `https://${accountId}.r2.cloudflarestorage.com`,
  region: 'auto',
  accessKey,
  secretKey,
  sessionToken,
  pathStyle: true,
});
```

The public surface remains Cloudflare/R2-shaped: service, bucket, object key, metadata, content type, read origin. S3 terms stay implementation plumbing.

## Landed R2 service and bucket handle

Implementation commit: `da0e4b35f feat(driver-cloudflare): add R2 service and bucket handle`.

Current package shape:

- package root: `code/sys.driver/driver-cloudflare`
- module: `src/m.r2/`
- `R2` runtime surface exports `R2.Service` from `src/m.r2/mod.ts`
- `R2.Lib` type surface exposes `Service.Lib` from `src/m.r2/t.ts`
- declared tasks: `deno task test`, `deno task check`, `deno task dry`
- export present: `"./r2": "./src/m.r2/mod.ts"`

Landed boundary:

- Added provider infrastructure: `R2.Service` and bucket handle shape.
- Added writable Files backing: `R2.Files.create({ bucket, policy, ... })`.
- Kept S3 compatibility as implementation plumbing, not public API vocabulary.
- Shaped the public `R2` type surface around service, bucket, object key, metadata, content type, read origin, and Files backing construction.

Landed implementation posture:

- `R2.Service.create(...)` returns a stable service object with `bucket(name, options?)`.
- `R2.Service.storageUrl(accountId)` derives `https://<accountId>.r2.cloudflarestorage.com`.
- The service owns account endpoint construction and credential plumbing for the internal S3-compatible client.
- The bucket handle owns bucket identity and object-level operations, but does not own Files policy.
- Bucket methods accept rootless object keys, not Files paths; Files path normalization is owned by `R2.Files`.
- Bucket operations provide the provider primitives used by the Files backing: `stat`, `read`, `write`, `remove`, and `list`.
- `R2.Files` translates `Files.String.Path` to R2 rootless object keys, preserves Files policy/capability authority, and keeps app/deploy code pointed at Files client helpers rather than raw bucket methods.
- S3 signing and HTTP behavior are delegated to `jsr:@bradenmacdonald/s3-lite-client@0.9.6` behind the private `src/m.r2/u/` adapter.
- Tests prove API export shape, URL/identity/options shaping, bucket handle delegation through injected transport seams, metadata/error adapter mapping, Files backing policy/tree/read/write/remove/manifest behavior, and no live Cloudflare calls.

Current downstream posture:

- Deploy publishing over writable Files backing has landed.
- Unchanged-publish optimization has landed above Files and remains provider-local.
- Keep deploy code pointed at Files client helpers rather than raw bucket methods.
- Keep signed URL services, Worker `R2Bucket` access, multipart public API, CAS, and deploy workflow expansion out of the already-landed R2 Files backing.

## Implementation plan: R2 Files backing

Landed commit: `28faad7b4 feat(driver-cloudflare): add R2 Files backing`.

The first-land R2 Files backing is a model Files backing adapter over the landed R2 bucket handle. It did not become a new provider layer, deploy workflow, Worker adapter, signed URL service, multipart API, or CAS surface.

Public runtime shape:

```ts
const backing = R2.Files.create({
  bucket,
  prefix: 'deploy/main',
  policy,
  maxReadBytes,
  maxWriteBytes,
  defaultLimit,
});
```

Public types:

- `R2.Files.Lib`
- `R2.Files.Writable`
- `R2.Files.CreateOptions`
- `R2.Files.Error.Kind`

`R2.Files.CreateOptions` composes model Files contracts:

```ts
type CreateOptions =
  & Files.Backing.Options
  & Files.Backing.InlineReadOptions
  & Files.Backing.InlineWriteOptions
  & {
    readonly bucket: R2.Bucket;
    readonly prefix?: string;
  };
```

The backing kind is decided:

```ts
'files/r2:writable'
```

### Dependency, R2 docs, and library alignment

The driver-cloudflare backing must not import model-private helper paths such as `@sys/model/.../m.files/u/*`. Use only public model/std surfaces:

- `Files.Authority.resolve`
- `Files.Cursor`
- `Path.Bounded`
- `Glob`
- `Bytes`
- canonical local `common.ts` imports, including `{ Arr, Err, Is, Num, Obj, Str, Time }` where needed

Small adapter glue belongs locally under `src/m.r2/m.Files/u.*`.

The R2/S3-compatible substrate alignment is:

- Cloudflare R2 external Deno access uses the S3-compatible HTTP endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` with region `auto`.
- `s3-lite-client` wants a full endpoint URL, `region: 'auto'`, and path-style bucket addressing; the landed R2 transport already matches this.
- `s3-lite-client` owns SigV4 signing, request path segment encoding, HEAD metadata, GET response streaming, PUT uploads, DELETE, and ListObjectsV2 XML parsing.
- `s3-lite-client` may use multipart uploads internally for large objects; this is acceptable substrate behavior. The public R2 and Files APIs still expose only complete-value writes and no multipart control surface.
- R2/S3 object keys have a practical 1024-byte budget. Files backing-generated object keys must be validated before calling the bucket transport; use UTF-8 byte length rather than JavaScript string length.
- `s3-lite-client` list `pageSize` must be 1..1000, while Files cursors/page sizes are separate. Do not pass Files page limits as substrate page-size blindly.
- The landed R2 bucket transport should special-case `list({ limit: 0 })` as an empty result before delegating to `s3-lite-client`, because the library treats `maxResults: 0` as falsy/unlimited.
- Metadata headers may round-trip with changed case. Files-internal custom metadata keys must be read case-insensitively.

### Prefix and object-key mapping

`prefix` is storage namespace configuration, not a Files path and not an object itself.

Normalize `prefix` as:

- `undefined`, `''`, `'/'` → root namespace
- trim incidental surrounding whitespace
- trim leading/trailing slashes
- reject traversal, backslashes, NUL, rooted dot segments, or any value that cannot safely compose into a rootless R2 object-key prefix

Mapping:

```text
prefix:     deploy/main
Files path: index.html
R2 key:     deploy/main/index.html
```

The exact object key `deploy/main` is not the backing root; the namespace is `deploy/main/`.

Every generated R2 key must remain rootless, nonblank, and within the R2/S3 object-key byte budget. Reject impossible mappings at the Files backing seam with `FilesR2Error.InvalidPath` rather than allowing substrate errors to leak.

### Tree projection invariant

R2 has object keys, while Files exposes a bounded tree. The backing owns this projection invariant:

> Inside the configured prefix, no object key may represent both a file and a directory ancestor.

Invalid external state example:

```text
a
a/b.txt
```

The backing should prevent this through Files writes and detect it during list/stat where practical. It should report `FilesR2Error.InvalidPath`, `FilesR2Error.NotFile`, or `FilesR2Error.NotDirectory` rather than silently choosing one interpretation.

Directory rules:

- root is synthetic
- directories are synthesized from object-key ancestors
- there is no empty-directory truth
- `stat('a')` exact object only → file
- `stat('a')` descendants only → dir
- `stat('a')` exact object and descendants → invalid collision
- `list('a')` requires `a` to be a synthetic directory
- `write('a')` fails if `a/...` exists
- `write('a/b')` fails if exact object `a` exists

### Read and content-ref semantics

Current read behavior:

1. If object metadata says it was written as Files text, enforce `utf8`, enforce inline read limits, and return `kind: 'inline'`.
2. Otherwise, if `bucket.readOrigin` exists, return `kind: 'ref'` with a URL content ref.
3. Otherwise, API-read inline only for safe textual candidates:
   - textual media types such as `text/*`, JSON/XML/JavaScript variants, and `+json`/`+xml`
   - safe textual paths such as `.json`, `.txt`, `.html`, `.css`, `.js`, `.mjs`, `.xml`, `.svg`
4. Binary/unrecognized byte objects without `readOrigin` still throw `FilesR2Error.Unsupported`.

Internal R2 custom metadata for Files writes:

```text
sys.files.body = text | bytes
sys.files.encoding = utf8
```

Read these internal custom metadata keys case-insensitively, because provider/substrate header round-tripping may change header casing.

Do not infer text from arbitrary media types. The no-origin API-read path is intentionally narrow so deploy can privately read textual `dist.json` manifests without turning R2 Files into an unsafe binary proxy.

URL refs are emitted only when `bucket.readOrigin` is explicit. The URL includes the actual R2 object key, including prefix, with path segments encoded safely:

```text
readOrigin: https://cdn.example.com
key:        deploy/main/index.html
url:        https://cdn.example.com/deploy/main/index.html
```

No signed URL support in this current implementation. Public read refs are caller-owned authority and must be public-by-design. Private/signed arbitrary binary read remains future work and is not needed for deploy unchanged-publish checks.

### Hash and metadata discipline

Do not map R2/S3 `etag` to Files `hash`. ETag is provider metadata, not guaranteed Files content hash. Leave `entry.hash` and `contentRef.hash` absent unless a future honest Files digest is written and verified.

Map R2 metadata to Files entry fields only where the semantics are honest:

- `size` → Files file size
- `modifiedAt: Date` → Unix epoch milliseconds
- `metadata.mediaType` → Files media type

### Remove semantics

Files remove semantics override S3 delete idempotency:

- removing a missing path throws `FilesR2Error.NotFound`
- removing root throws `FilesR2Error.InvalidPath`
- removing a file deletes the exact object key
- removing a directory without `recursive: true` throws `FilesR2Error.DirectoryNotEmpty`
- recursive directory removal collects descendants first, policy-checks every descendant before deleting anything, then deletes sequentially
- if deletion partially succeeds and then fails, throw `FilesR2Error.PartialFailure`

### Capabilities

Resolve capability facts through `Files.Authority.resolve`.

First-land backing facts:

```ts
{
  list: true,
  stat: true,
  read: true,
  write: true,
  remove: true,
  watch: false,
  manifest: true,
  fidelity: 'dynamic',
  encodings: ['utf8'],
}
```

Default policy remains deny-all unless the caller passes one.

### Listing, manifest, and pagination

First implementation should favor deterministic Files correctness over object-storage cleverness:

- scan R2 objects under the backing prefix
- synthesize Files file and directory entries
- apply Files policy, `match`, `exclude`, and `depth`
- sort by Files path
- page with `Files.Cursor`

Do not expose R2/S3 continuation tokens through Files cursors. Large-prefix scans are acceptable for this first backing; deploy manifest discipline can optimize later.

Keep substrate pagination separate from Files pagination. The backing may let the R2 bucket transport use its default substrate page-size; if a substrate page-size is configured later, enforce the `s3-lite-client`/ListObjectsV2 1..1000 range at the R2 bucket boundary.

### Implementation files

Add:

```text
src/m.r2/m.Files/common.ts
src/m.r2/m.Files/mod.ts
src/m.r2/m.Files/m.create.ts
src/m.r2/m.Files/u.authority.ts
src/m.r2/m.Files/u.path.ts
src/m.r2/m.Files/u.page.ts
src/m.r2/m.Files/u.entry.ts
src/m.r2/m.Files/u.metadata.ts
src/m.r2/m.Files/u.error.ts
src/m.r2/m.Files/u.cmd.list.ts
src/m.r2/m.Files/u.cmd.stat.ts
src/m.r2/m.Files/u.cmd.read.ts
src/m.r2/m.Files/u.cmd.write.ts
src/m.r2/m.Files/u.cmd.remove.ts
src/m.r2/m.Files/u.cmd.manifest.ts
```

Modify:

```text
src/common/libs.ts
src/common/t.ts
src/m.r2/t.ts
src/m.r2/mod.ts
src/m.r2/m.Service/u.validate.ts
src/m.r2/u/u.transport.s3.ts
```

The two service/transport edits are narrow hardening discovered during the library review: keep bucket-list `limit: 0` from becoming unlimited at the `s3-lite-client` boundary, and align substrate `pageSize` validation with ListObjectsV2/library constraints.

### Test plan

Add focused tests under `src/m.r2/-test/-m.Files.test.ts` proving:

- `R2.Files` API export shape
- backing kind, policy, and capabilities
- `Files.Client.local(backing)` works
- prefix maps Files paths to R2 object keys
- `writeText`/`writeBytes` send bucket writes with correct size/media/internal metadata
- generated object keys reject values outside the R2/S3 key byte budget
- writing root fails
- file/directory collisions fail
- `stat` maps files and synthetic directories
- `list` synthesizes directories and pages with Files cursors
- text reads return inline only for Files text metadata, with case-insensitive internal metadata lookup
- binary/unmarked reads return URL refs only with `readOrigin`
- manifest emits refs only for read-authorized files
- file remove works
- non-recursive directory remove fails
- recursive directory remove deletes descendants
- removing missing paths fails
- policy denial prevents bucket mutation
- no live Cloudflare calls

## Target API shape

Primary import:

```ts
import { R2 } from '@sys/driver-cloudflare/r2';
import { Files } from '@sys/model/files';
```

Driver setup shape:

```ts
const r2 = R2.Service.create({
  accountId,
  credentials,
});

const bucket = r2.bucket('assets', {
  readOrigin: 'https://bytes.example.com',
});
```

Files client shape:

```ts
const backing = R2.Files.create({ bucket, policy });
const files = Files.Client.local(backing);

await files.writeText('index.html', html, { mediaType: 'text/html' });
await files.writeBytes('assets/app.wasm', wasm, { mediaType: 'application/wasm' });
await files.remove('old/app.js');
```

This keeps R2 visible as infrastructure and Files visible as the product API. App/deploy code should not need `putObject`, `Key`, `Body`, `ListObjectsV2`, `region`, endpoint configuration, or other S3-shaped names.

## Architecture

Write/control path:

```text
Client/sys URL
  → Deno Deploy control API
  → Files.Client write/remove helper
  → files:write/files:remove Cmd
  → R2 Files backing
  → R2 bucket transport
```

Read path:

```text
Client/sys URL
  → Deno Deploy auth/policy/lookup
  → Files<T> read/manifest/contentRef
  → inline textual R2 API read for safe small text files when no readOrigin exists
  → 302/307 to owned read-origin URL for public bulk reads when readOrigin exists
  → R2 object bytes
```

Deploy's unchanged-publish check uses the safe small-text path for `dist.json`; it does not need public origin URLs or binary asset reads. Deno Deploy must not proxy large bytes by default.

## Responsibility split

- Files<T>: list, stat, read, write complete file, remove, manifest, capabilities, policy, and client convenience helpers.
- R2 service/bucket: provider truth over key → bytes + metadata + read URL/ref; no policy authority and no deploy workflow.
- R2 Files backing: translate root-relative Files paths to R2 keys, normalize metadata, enforce Files policy/capabilities, and emit Files results.
- Deno Deploy: auth, policy selection, routing, namespace, manifests, writes, removes, and deploy workflow.
- Cloudflare: R2 storage and read-plane egress only.

## First provider

R2 first: boring object storage, incremental object writes, effectively egress-free reads, no AWS/GCP control-plane dependency.

Keep B2/Bunny as later comparison pressure; avoid IPFS/blockchain/deploy-platform semantics in the core.

## Cloudflare containment guard

Intent: use as little Cloudflare as possible. Keep Cloudflare's role to R2 storage and read-plane serving only.

- No Cloudflare product creep unless a concrete Files/R2 invariant requires it.
- No Worker authority: avoid policy, auth, orchestration, billing, deploy logic, or rich APIs in Workers.
- A Worker is allowed only as a thin read shim when R2 read routing cannot do the job directly.
- Deno Deploy remains the operational center; Cloudflare remains replaceable storage/egress substrate.

## Capability posture

- `write`: complete object write only; no patches, no append, no multipart API surface.
- `remove`: delete according to provider truth; tombstones only if a higher deploy/manifest invariant explicitly earns them.
- `manifest`: first-class; deploy should treat manifest publication as the stable release boundary.
- `watch`: false unless a real live signal exists.
- `contentRef`: URL/hash/ref, with public read refs only for content intentionally safe to fetch through the read plane.
- Directories: synthesized from object keys; no empty-directory truth unless a deliberate sentinel/manifest scheme is added later.

## TMIND checks

- A public read URL can bypass Deno policy if issued casually; public refs must be public-by-design or become signed/time-bound refs.
- S3 compatibility is implementation plumbing only; do not export S3 clients, command names, request shapes, or endpoint/region ceremony.
- R2 bucket methods are lower-level infrastructure affordances; docs and examples should route app/deploy code through Files.Client.
- Concurrent writes and partial deploys need a release strategy; prefer staged object writes with manifest publication last.
- Provider metadata is not automatically a Files hash; only normalize digests when the semantics are honest.

## Remaining decisions after R2 Files backing

- Whether later deploy publication needs conditional writes/CAS at the deploy-manifest layer; do not add CAS to this Files backing commit.
- Redirect/cache policy for deploy-owned read routing; current R2 Files backing emits public URL refs when `bucket.readOrigin` is explicit and otherwise supports narrow inline textual API reads.
- Metering precision: redirect-time size estimate vs thin read-plane logging.
- Whether a future Worker-native `R2Bucket` adapter is useful as a separate access-plane implementation.

## XHIGH pre-implementation review: deploy publishing through writable Files backing

Status: **GO**, with a narrow provider-plugin scope.

Target commit:

```text
feat(deploy): publish through writable Files backing
```

### BMIND reset

The subject is not a new deployment system and not another R2 driver pass. The subject is one existing deploy call-site gaining one new push provider.

Existing shape:

```text
@sys/tools cli.deploy
  stage local artifact tree
  finalize dist.json
  push provider target
```

Required new shape:

```text
@sys/tools cli.deploy
  stage local artifact tree
  finalize dist.json
  push provider.r2 target
  construct R2 bucket + R2 Files backing
  publish staged bytes through Files.Client.writeBytes
```

The provider should sit adjacent to the current providers:

```text
src/cli.deploy/u.providers/provider.noop/
src/cli.deploy/u.providers/provider.orbiter/
src/cli.deploy/u.providers/provider.r2/
```

This is a plugin-style addition, not a staging refactor.

### DMIND shape

The form should invite correct use by making the safe path the obvious path.

Endpoint YAML should be Cloudflare/R2 shaped, not S3/AWS shaped:

```yaml
provider:
  kind: r2
  accountId: ${env:CLOUDFLARE_ACCOUNT_ID}
  bucket: my-bucket
  prefix: deploy/site
  readOrigin: https://cdn.example.com
  credentials:
    accessKeyId: ${env:CLOUDFLARE_R2_ACCESS_KEY_ID}
    secretAccessKey: ${env:CLOUDFLARE_R2_SECRET_ACCESS_KEY}

source:
  dir: .

staging:
  dir: ./dist.deploy

mappings: []
```

Schema discipline:

- strict `additionalProperties: false`
- `provider.kind` literal is `r2`
- require `accountId`
- require `bucket`
- require non-empty `prefix`
- require `credentials.accessKeyId`
- require `credentials.secretAccessKey`
- optional `readOrigin`
- reuse existing `source`, `staging`, and `mappings` schema parts

The implementation should create the R2 backing inside the provider, then publish via the Files client helper surface. Raw bucket methods are allowed only for constructing the backing, not for the deploy write loop.

### TMIND adversarial checks

Reject these failure modes before implementation starts:

- **Staging rewrite drift:** do not rewrite staging, mappings, build, copy, or `dist.json` finalization.
- **Raw object-store creep:** do not publish with raw R2 bucket writes; target writes go through `Files.Client.writeBytes`.
- **S3 vocabulary leak:** no `region`, `endpoint`, `Key`, `Body`, `putObject`, or S3 provider config names in deploy YAML or app-facing types.
- **Destructive sync creep:** first commit uploads staged files only; no stale remote deletion/sync unless a later explicit arc earns it.
- **External lane overreach:** first commit uses unit/schema/provider-dispatch tests. Real R2 proof may be a manual CLI run or later opt-in external lane, not part of this minimal provider commit.
- **Credential leakage:** never log secret values; error messages may name missing fields, not values.
- **Binary artifact breakage:** source bytes come from the staging filesystem with `Fs.read`; do not depend on text-only Files reads for publishing binary dist assets.
- **Content-type regression:** set `mediaType` on writes using an existing public helper such as `FileMap.Data.contentType.fromPath(path)` from `@sys/fs`.
- **Partial deploy overclaim:** this provider publishes files and `dist.json`; it does not yet claim atomic release semantics beyond writing `dist.json` last.
- **Menu/status confusion:** if `readOrigin` exists, it can serve as the display/read target domain; without `readOrigin`, push still works and remote up-to-date proof is available through the provider-local R2 Files manifest read.

### STIER finished-product bar

Before commit, the touched surface should look boring and inevitable:

- `provider.r2` mirrors the size and shape of `provider.orbiter`/`provider.noop` without special framework machinery.
- Endpoint schema has one new union arm and no permissive escape hatches.
- Provider probe, target resolution, and dispatch each gain exactly one R2 branch.
- Push implementation is short, readable, and names the product seam as Files.
- Tests prove invariants with fakes/mocks and make no live Cloudflare calls.
- No transitional TODOs, dead helpers, broad refactors, or unrelated dirty files are included.
- Existing Orbiter and noop behavior remains unchanged.

### Minimal implementation files

Add:

```text
code/sys.tools/src/cli.deploy/u.providers/provider.r2/mod.ts
code/sys.tools/src/cli.deploy/u.providers/provider.r2/t.ts
code/sys.tools/src/cli.deploy/u.providers/provider.r2/u.schema.ts
code/sys.tools/src/cli.deploy/u.providers/provider.r2/u.endpoint.schema.ts
code/sys.tools/src/cli.deploy/u.providers/provider.r2/u.push.ts
```

Modify narrowly:

```text
code/sys.tools/src/cli.deploy/common.ts
code/sys.tools/src/cli.deploy/common.t.ts
code/sys.tools/src/cli.deploy/t.namespace.ts
code/sys.tools/src/cli.deploy/u.endpoints/u.schema.ts
code/sys.tools/src/cli.deploy/u.providers/mod.ts
code/sys.tools/src/cli.deploy/u.providers/t.ts
code/sys.tools/src/cli.deploy/u.providers/u.probe.ts
code/sys.tools/src/cli.deploy/u.push/t.ts
code/sys.tools/src/cli.deploy/u.push/u.push.ts
code/sys.tools/src/cli.deploy/u.push/u.resolvePushTargets.ts
code/sys.tools/src/cli.deploy/u.menu/u/u.resolvePushTargets.ts
code/sys.tools/src/cli.deploy/u.menu/u/u.pushCapability.ts
```

The `common.ts` touch is only to expose public runtime imports needed by the provider, likely `R2`, `Files`, and `FileMap`.

### Minimal publish algorithm

Inside `provider.r2/u.push.ts`:

1. Validate the staged output exists before mutating remote state.
2. Load staged `dist.json` through `Pkg.Dist.load(stagingDir)`.
3. Derive publish paths from `dist.hash.parts`, then append `dist.json` as the final write.
4. Create:

   ```ts
   const service = R2.Service.create({ accountId, credentials });
   const bucket = service.bucket(provider.bucket, { readOrigin: provider.readOrigin });
   const backing = R2.Files.create({ bucket, prefix: provider.prefix, policy });
   const files = Files.Client.local(backing);
   ```

5. For each staged file path:
   - read bytes from local staging with `Fs.read`
   - infer media type from path using a public helper
   - call `files.writeBytes(path, bytes, { mediaType })`
6. Write `dist.json` last.
7. Return the existing push result shape with provider `r2` and the resolved target metadata.

Policy should be explicit and minimal: allow write/stat/list/read/remove only as required by the R2 backing to perform publication. Do not use deny-all defaults accidentally.

### Unit test checklist

Add focused tests near the existing deploy tests, without live network:

- endpoint schema accepts `provider.kind: r2`
- endpoint schema rejects missing/blank required R2 fields
- endpoint schema rejects unknown R2 provider properties
- env-ref resolved YAML can validate as an R2 endpoint
- provider probe recognizes R2 without requiring an external binary
- push target resolution emits an R2 target
- push dispatch calls the R2 provider branch
- missing staging output fails before any remote mutation
- R2 provider writes staged binary bytes through `Files.Client.writeBytes`
- `dist.json` is written last
- media type is passed to writes
- existing Orbiter/noop tests still pass unchanged

### External proof posture

No new external lane is required for this first provider commit.

If a later explicit proof lane is desired, mirror the `driver-deno` external pattern as an opt-in task and drive it from a single JSON env key such as:

```env
SYS_DEPLOY_R2_EXTERNAL_PARAMS='{"accountId":"...","bucket":"...","prefix":"deploy/external","readOrigin":"https://...","accessKeyId":"...","secretAccessKey":"..."}'
```

That lane should create a unique child prefix under the configured prefix and clean only inside that child prefix. It should not become part of default `deno task test:deploy`.

### GO / NO-GO

GO if the implementation remains this narrow:

- one adjacent `provider.r2`
- strict endpoint schema arm
- existing deploy push seam only
- target writes through `Files.Client.writeBytes`
- deterministic tests only

NO-GO if the implementation starts adding:

- broad deploy staging rewrites
- public S3/AWS config vocabulary
- raw R2/S3 write loops in deploy code
- destructive remote sync/removal
- signed URL services
- Worker `R2Bucket` access-plane logic
- mandatory live Cloudflare integration tests

## Post-implementation DMIND review: deploy provider, proof, and no-origin manifest reads

Status: **CURRENT IMPLEMENTATION COMPLETE FOR DEPLOY.**

Landed baseline: `dc1f58461 feat(deploy): publish through writable Files backing` and `77b07a6bf feat(deploy): skip unchanged Files publishes from dist manifest`.

Current follow-up state: live R2 proof passed with public `readOrigin`, then passed again without `readOrigin` by API-reading the remote textual `dist.json` through the R2 Files backing. Deploy no longer needs a public origin URL for unchanged-publish detection.

The implemented design matches the approved shape:

- `provider.r2` is an adjacent deploy provider plugin, not a deploy subsystem rewrite.
- Endpoint YAML stays R2-shaped: `kind`, `accountId`, `bucket`, non-empty `prefix`, optional `readOrigin`, and credentials.
- S3-compatible details stay below the Cloudflare driver seam.
- Target writes go through `Files.Client.writeBytes`; raw bucket calls are used only to construct the R2 Files backing.
- Staging, mappings, build/copy/finalization, and dist hashing remain local FS-based and unchanged.
- Staged bytes are read with `Fs.read`, so binary artifacts are not text-path dependent.
- The publish sequence uploads staged files from `dist.hash.parts` and writes `dist.json` last.
- Landed provider commit is upload-only; no stale remote deletion/sync is introduced.
- Landed optimization commit short-circuits unchanged remote manifests by reading remote `dist.json` through the Files command surface and comparing staged/remote dist hashes.
- Matching remote digests return success with no staged asset reads and no writes.
- Differing remote digests publish only changed/new staged assets, then `dist.json` last; unreadable, invalid, or unsupported remote manifests fall back to upload-all.
- Tests are deterministic: schema, provider probe, push target resolution, dispatch, provider publish behavior, and existing Orbiter/noop continuity.

The test split is now intentional:

- `cli.deploy/-test/-u.push.test.ts` covers provider-agnostic push/config-ref behavior.
- `cli.deploy/-test/-u.push.orbiter.test.ts` covers Orbiter-specific target/dispatch behavior.
- `cli.deploy/-test/-u.push.r2.test.ts` covers R2-specific target/dispatch behavior.
- `cli.deploy/u.providers/provider.r2/-test/*` covers R2 provider schema and write-through-Files publish behavior.
- Shared deploy fixtures use `cli.deploy/-test/u.fixture.ts`, matching the canonical `u.<concern>.ts` helper grammar and broader workspace fixture convention.

### Gates passed for landing

From `code/sys.tools`:

```sh
deno task test:deploy
deno task check
deno task dry
```

### Gates passed for unchanged-publish optimization

From `code/sys.tools`:

```sh
deno task test --trace-leaks ./src/cli.deploy/u.providers/provider.r2/-test/-u.push.test.ts
deno task check
deno task dry
```

### Landed XHIGH design: unchanged publish short-circuit

Landed commit:

```text
77b07a6bf feat(deploy): skip unchanged Files publishes from dist manifest
```

Hard DMIND/BMIND purity review:

- This is an opportunistic deploy optimization, not a new consistency model.
- Keep the optimization in the deploy R2 provider, above `Files.Client.writeBytes`.
- Keep all remote observation through the Files API. Do not add raw R2/S3 object reads, bucket stats, bucket writes, or S3 vocabulary in deploy.
- Keep the existing write seam: staged payloads are still written with `Files.Client.writeBytes`; do not switch `dist.json` to `writeText` in this step unless the earlier writeBytes constraint is explicitly retired.
- Keep remote deletion/sync out of scope. Remote objects absent from the staged manifest are ignored.
- Keep `PushResult` shape unchanged unless a later UX commit earns publish stats; this commit should not widen public API just to report skipped paths.

Resolved upstream/API wrinkle:

- The deploy provider writes `dist.json` with `writeBytes`.
- Bytes-written `dist.json` objects are not Files-text metadata objects.
- Earlier behavior could read those objects only via URL content refs when `readOrigin` existed.
- Current R2 Files behavior also API-reads safe textual byte objects without `readOrigin`, so deploy can privately read remote `dist.json` and perform unchanged-publish checks.
- `Files.Client.readText('dist.json')` is still not the deploy provider's full read strategy; provider code reads through the Files command surface so it can handle both inline results and content refs.

Landed implementation:

1. Load staged `dist.json` with `Pkg.Dist.load(stagingDir)` as today.
2. Create the R2-backed Files client as today.
3. Try to read the remote manifest through the Files command surface:
   - `files.cmd.send(Files.Cmd.Name.read, { path: 'dist.json' })`
   - if `kind: 'inline'`, parse `content`
   - if `kind: 'ref'`, resolve text with `Files.ContentRef.text(...)`
4. Validate parsed remote JSON with `Pkg.Is.dist(...)`; invalid, missing, unreadable, truncated, fetch-failed, or unsupported remote manifests all become `undefined`.
5. If no valid remote manifest is available, fall back to the landed upload-all behavior.
6. If `remote.hash.digest === staged.hash.digest`, return success without staged file reads or writes.
7. If the digest differs, diff `remote.hash.parts` against staged `dist.hash.parts`:
   - publish only staged asset paths whose hash-part value differs or is missing remotely
   - never publish remote-only paths
   - append `dist.json` as the final write
8. Preserve path validation through the existing `publishPaths`/`toFilesPath` style helpers.
9. Preserve `dist.json` as release marker and final write.

Repair tradeoff:

- Matching remote `dist.hash.digest` means the deploy provider trusts remote `dist.json` as the release marker.
- This intentionally will not repair out-of-band asset drift when the manifest still matches staged content.
- Force push repair mode now handles explicit non-destructive rewrites when remote object drift is suspected.

STIER deterministic test coverage:

- No valid remote manifest/read failure: uploads all staged paths and writes `dist.json` last.
- Matching inline remote manifest: returns success with no staged file reads and no writes.
- Matching content-ref remote manifest: returns success with no writes; use an injected/ref-resolver seam or fake Files handle so tests do not depend on live HTTP.
- Different remote digest with some equal `hash.parts`: writes only changed/new staged assets, then `dist.json` last.
- Invalid remote manifest JSON or non-`Pkg.Is.dist` shape: falls back to upload-all behavior.
- Remote-only hash parts are ignored; no remove/sync behavior appears.
- Existing R2 provider schema, dispatch, push capability, and Orbiter tests still pass unchanged.

BMIND non-goals preserved:

- Force repair mode is explicit opt-in and non-destructive; no automatic remote byte verification.
- No stale object cleanup.
- Publish stats/result-shape expansion is now handled by the later deploy UX/API slice: rich per-file publish entries are returned and report counts are derived from them.
- No switch from `writeBytes` to `writeText` for `dist.json`.
- No live Cloudflare integration lane.

### Manual integration proof result

Manual CLI proof was run from:

```text
code/sys.tools/.tmp
```

Proof configuration:

```text
bucket: sys-test
prefix: manual/r2-proof
public readOrigin used for first proof: https://pub-8bd1da0f59614c7bbc75f21d60db6a9c.r2.dev
```

Proven states:

- First publish uploads staged files and writes `dist.json` last.
- Public-origin remote manifest read works and skips unchanged files.
- No-origin remote manifest read works and skips unchanged files through the R2 API/Files path.
- Push report truthfully reports unchanged publishes:

  ```text
  files      3   total publish files
  uploaded   0   changed files
  skipped    3   unchanged files
  ```

- Remote read failure/invalid manifest behavior remains upload-all fallback.
- No stale remote deletion/sync behavior was introduced.

The live proof exposed the invalid-size R2 metadata bug and the no-origin bytes-written `dist.json` read gap. Those were resolved by hardening R2 Files entry sizing and adding narrow textual API reads without `readOrigin`.
