local-dist-host.plan.md
- [x] 6bf22370f [verified-dist-materialization.plan.md](./verified-dist-materialization.plan.md)
- [x] 473b7e4bf feat(fs): read checksum-pinned Dist parts
- [x] d4a29c000 feat(http): emit constrained file byte responses
- [x] fd46368d7 [canonical-media-type-authority.plan.md](../@sys.std/canonical-media-type-authority.plan.md)
- [x] af95bea64 feat(server): compose pinned local Dist hosting
- [x] df5d776fa fix(std): centralize lexical path containment
- [x] ada6bc4d80 refactor(server): align Files service module topology
- [x] d47a43ccd test(cell): prove configured-origin Dist lifecycle

The anchor references this plan as one ordered prerequisite. This file is the sole source of truth
for the prerequisite's internal commit arc.

The opening arc is the sole live ledger for prerequisite and local-commit landing state. The
verified materialization prerequisite is complete and retired; `6bf22370f` is its final completed
snapshot and `a8eb43da2` its retirement commit. The separately governed canonical media-type arc
precedes Server composition. Canonical lexical containment and Files service topology cleanup follow
that composition, and the Cell lifecycle proof remains the final step. Strict pinned verification
remains owned by the earlier filesystem-foundation prerequisite; this arc consumes that authority
and promotes only the owner-correct checksum-pinned part-read kernel needed for serving. Review is
ordinary acceptance work, not a gate or implementation authorization.

## Foundation handoff (STIER planning note)

This note records the prerequisite contract ahead of implementation so the later hosting thread does
not recover authority from stale context or a legacy compatibility API:

```text
strict Dist grammar
  → Rooted no-clobber publication
  → Pkg.Dist.Pinned.verify authenticated evidence
  → verified materialization
  → checksum-bound local hosting
```

Hosting must invoke:

```ts
Pkg.Dist.Pinned.verify({ dir, integrity, limits, until });
```

The `limits` input is required caller-owned policy and must remain explicit; there is no implicit
unlimited verification. Pass the hosting lifecycle's `until` through to the verifier. Open no
listener unless the result is `verified`, and construct the static-files adapter only from
`result.evidence.dist`. Map non-verified result kinds to the selected stable sanitized startup
failure surface without exposing local paths, raw host causes, cancellation reasons, or trust data.

`Pkg.Dist.checkSelfReported` is local self-consistency behavior, not executable-materialization or
hosting authority. Hosting must not call it, reparse `dist.json`, reconstruct evidence, accept a
caller-forged "verified" token, or substitute its own traversal, hashing, path, or resource-limit
checks. This is a dependency handoff only; no Server or HTTP runtime implementation belongs in the
filesystem foundation correction.

## Subject

A generic service for hosting one locally materialized `DistPkg` over loopback.

This is not a product-specific server. Product launchers and Cell services consume the same narrow
server-owned Dist runtime surface.

## Ownership verdict

```text
@sys/fs Pkg.Dist.Pinned.verify   exact manifest pin + bounded local Dist verification
@sys/fs Pkg.Dist.Pinned.readPart bounded checksum-pinned part reads
@sys/http HttpServer              HTTP lifecycle + constrained byte-response shaping
@sys/server Dist.materialize      verified integrity-addressed materialization composition
@sys/server DistServer            semantic verified-or-refuse hosting composition
@sys/cell                         optional composition harness
product launchers                 eventual consumers
```

`@sys/server` is the cohesive owner because the new noun is a lifecycle service over existing
fs/http primitives. Do not add Dist hosting policy to `@sys/http`, store policy to `@sys/fs`, or
generic route/state code to product packages.

The dependency DAG remains one-way:

```text
@sys/fs + @sys/model/files/static + @sys/http
  → @sys/server/dist + @sys/server/dist/service
  → @sys/cell and eventual product launchers
```

No dependency returns from `@sys/server` to tools or a product package. Implementation receives
ordinary per-commit review and proof only; add no ceremonial architecture loop.

## DRY composition rule

`DistServer` is not a second verifier or static-server implementation. It may classify owner results
and compose lifecycle only. Its implementation must contain no raw SHA operation, JSON parser,
manifest hash comparison, filesystem traversal, path normalizer, MIME table, direct `Deno.serve`, or
ad-hoc file-response implementation.

This arc consumes the strict `Pkg.Dist.Pinned.verify` contract landed by the filesystem-foundation
prerequisite and promotes its existing exact-size regular-file kernel through one domain-specific
public `@sys/fs/pkg` operation:

```text
Pkg.Dist.Pinned.readPart({ dir, path, checksum, size, until })
  → Promise<{ kind: 'read'; bytes } | { kind: FailureKind }>
```

This is not a generic `Fs.read` replacement and produces no verification evidence or reusable trust
token. It snapshots an exact own-key input before I/O; requires canonical Rooted-compatible
root-relative `path`, canonical checksum, safe non-negative exact `size`, and valid lifecycle;
latches pre-cancellation; rejects symlinked ancestry/final targets and non-files; compares path and
open-handle metadata before and after the read; reads exactly `size` bytes plus one EOF probe;
hashes through `@sys/crypto`; and returns bytes only after the checksum matches. Its stable failure
kinds are the applicable subset of `Pkg.Dist.Pinned.Verify.FailureKind`: `invalid-input`, `missing`,
`content-mismatch`, `unsafe-path`, `symlink`, `limit-exceeded`, `changed`, `unsupported`,
`io-failure`, and `cancelled`. Extract and reuse the landed private kernel and injectable IO seam;
do not create a second reader.

`@sys/http/server` then adds a filesystem- and crypto-free response primitive:

```text
serveFileBytes({ req, path, cache: 'no-store', read }) → Promise<Response>
```

`path` is an admitted logical filename used only for MIME selection. The lazy `read` callback is
snapshotted and invoked exactly once only after request admission; its exact result is
`{ kind: 'bytes'; bytes: Uint8Array } | { kind: 'missing' | 'changed' | 'cancelled' | 'failure' }`.
This keeps method/Range policy below filesystem work while preventing HTTP from importing Dist
failure grammar. The Server composition maps `Pinned.readPart` failure kinds into those four
classes.

The HTTP contract accepts only `GET` and `HEAD`, rejects every Range request, performs no
conditional `304` shortcut, and emits exactly the successful callback bytes without transformation.
`HEAD` performs the same lazy authenticated read but emits no body. Success has browser-correct
MIME, exact `Content-Length`, `Cache-Control: no-store`, and `X-Content-Type-Options: nosniff`.
Every non-success response is body-generic and path/checksum-safe: unsupported methods carry `405`
plus `Allow: GET, HEAD`, Range carries `416`, `missing` carries `404`, `changed` carries `412`,
`cancelled` carries `499`, and callback failure/throw carries `500`. All responses are `no-store`
and `nosniff`; the primitive adds no CORS header, ETag, filesystem call, path join, or hash
operation.

Export `serveFileBytes` only from `@sys/http/server`, alongside rather than by changing the
streaming/Range semantics of `serveFileWithEtag`. `@sys/server/dist` composes FilesStatic lookup,
`Pkg.Dist.Pinned.readPart`, failure-class mapping, and `serveFileBytes`; it contains no replacement
filesystem or cryptographic kernel.

Target modules:

```text
code/sys/server/src/m.server.dist/         public export: @sys/server/dist
code/sys/server/src/m.server.dist.service/ public export: @sys/server/dist/service
runtime nouns: Dist, DistServer, DistService
```

### Ordered coherence follow-ups

After `feat(server): compose pinned local Dist hosting` lands, establish one pure lexical host-path
containment authority in `@sys/std/path`, with a semantic surface such as
`Path.Is.within(root, candidate)`. The predicate must return `false` for non-string inputs and when
`root`/`candidate` are not both absolute; it must admit the root itself, ordinary descendants, and
contained names such as `..cache`; reject parent traversal, absolute outsiders, sibling-prefix
confusion; and state explicitly that lexical containment is not realpath or symlink authority.
Migrate the duplicate containment kernels to it in:
- `code/sys/server/src/m.server.dist.service/u/u.config.resolve.ts`
- `code/sys/cell/src/m.cell/u.task/u.resolve.ts`
- `code/sys/cell/src/m.cell/u.services/u.plan.ts`
- `code/sys/cell/src/m.cell/u.endpoints.ts`.
Pinned filesystem verification remains the owner of symlink and on-disk identity safety.

The Files service root resolver in `code/sys/server/src/m.server.files/m.Service/u/u.config.resolve.ts`
may be migrated in the follow-up Files-topology commit unless the file is intentionally included in this
slice.

Then move the Files Cell endpoint from `src/m.server.files/m.Service/` to the honest sibling module
`src/m.server.files.service/`. Keep the public `@sys/server/files/service` specifier unchanged,
update package/type wiring and tests, and leave no compatibility alias or duplicate service module.
These are separate follow-up commits, not extra churn inside the Dist-hosting feature commit.

The materialization prerequisite owns the human-led `tmpl.m.mod` scaffold. This arc extends that
landed module types-first; it does not scaffold a second Dist module.

Selected public surfaces:

```text
@sys/server/dist
  Dist.materialize(input) → Promise<MaterializeResult>
  DistServer.start(input) → Promise<t.HttpServer.Started>
  DistServer.Error.is(value) → value is DistServer.StartError

@sys/server/dist/service
  DistService.start(cellArgs) → Promise<t.HttpServer.Started>
  DistService.resources(cellArgs) → Promise<readonly t.Service.Resource.Any[]>
```

The split is deliberate: `@sys/server/dist` remains the lean direct runtime surface and exports
exactly `Dist` and `DistServer`; YAML/schema/config machinery lives only under the Cell-specific
`@sys/server/dist/service` subpath. `Dist.materialize` returns a discriminated domain result because
materialization has several successful and failed terminal truths. `DistServer.start` deliberately
rejects with `DistServer.StartError`: its sole success value is the existing lifecycle handle, and a
wrapper result would create the parallel service-handle grammar this plan forbids. Document this
asymmetry on both public methods.

`DistServer.StartArgs` requires `dir`, `integrity`, and strict-verification `limits`, and accepts
only `hostname`, `port`, `name`, `silent`, `keyboard`, and `until`. Snapshot an exact plain own-key
input, including nested limits and lifecycle authority, before the first await; reject unknown,
inherited, invalid, or subsequently mutated authority. Defaults are `127.0.0.1` and port `0`.
`hostname` admits only `127.0.0.1`, `localhost`, or `::1`; wildcard, bracketed bind literals, and
non-loopback binds fail before verification or listener startup. The returned handle is the existing
HTTP lifecycle surface with `origin`, `finished`, `status()`, idempotent `close`, and async
disposal. Do not invent a parallel service handle or expose a forgeable "verified" input/result
token.

Startup rejects with a frozen sanitized `DistServer.StartError` carrying
`name: 'DistServer.StartError'`, a stable `reason`, and a sanitized message. Reasons are the
canonical `Pkg.Dist.Pinned.Verify.FailureKind` values plus `invalid-hostname`, `address-in-use`, and
`startup-failure`. `DistServer.Error.is` is the only public classifier. Never attach raw causes,
local paths, the pin, manifest data, or cancellation reasons. Verification failure,
pre-cancellation, and bind failure leave no listener.

Use the public `@sys/model/files/static` `FilesStatic.fromDist` adapter with
`Files.Policy.readonly('**')` only after `Pkg.Dist.Pinned.verify` succeeds, and initialize it solely
from `result.evidence.dist`. Wrap adapter construction and map any defensive/unreachable throw to a
sanitized `startup-failure`; never pass through its path-bearing message. Its `files:read` handler
is the only declared-path lookup boundary.

Narrow every handler result explicitly: require `result.kind === 'ref'`,
`contentRef.kind === 'hash'`, canonical hash, and a present safe non-negative integer `size`. Zero
is valid and must never be tested by truthiness. Any other shape fails closed without filesystem
work. Pass only the admitted ref `path`, checksum, size, and combined request/server lifecycle to
`Pkg.Dist.Pinned.readPart`; map that result to the neutral `serveFileBytes` read callback result. Do
not reach into the adapter's private index, accept URL/opaque refs, join a filesystem path, or
reproduce a second Dist path grammar inside `@sys/server`.

## Integrity authority

The caller pins `integrity`: the SHA-256 hash of the exact published `dist.json` bytes.

Do not use `dist.hash.digest` as executable authority. Current `CompositeHash.digest(parts)` sorts
by path but hashes only the ordered part-hash values; it does not cryptographically bind path names
or the rest of the manifest metadata. The exact manifest-byte hash binds the complete path → hash
map and all manifest bytes. `CompositeHash.verify` remains valid because it compares complete parts
maps; do not silently change that established digest protocol in this host slice.

Ready activation creates one operation-scoped abortable, crosses one scheduler boundary to latch a
pre-aborted lifecycle, performs one bounded
`Pkg.Dist.Pinned.verify({ dir, integrity, limits, until: life.signal })` call, and consumes only its
successful `result.evidence.dist`. Recheck the same signal immediately before the synchronous
listener start and pass it into `HttpServer.start`. Dispose the operation bridge exactly once on
startup failure or when the returned server's `finished` promise settles. After a handle is
returned, that shared signal owns normal server cancellation; every part read receives
`[life.signal, req.signal]` so server shutdown and request cancellation both stop filesystem work.
The verification result proves all of:

1. exact local `dist.json` bytes match caller-pinned `integrity`;
2. the manifest satisfies the strict executable-generation profile;
3. every declared asset and the canonical Dist hash policy verify within required limits;
4. a post-verification re-read is byte-identical to the authenticated manifest.

`DistServer` does not repeat any of these checks.

HTTPS, source URL, manifest self-reported digest, package metadata, and a directory name are not
authority.

Detached signatures are not required in this first contract. A future signed update channel may
layer above pinned integrity without changing the host.

## Start behavior

The selected public input is one local target directory plus pinned manifest integrity, required
strict-verification limits, and normal loopback lifecycle controls.

```text
start
  → target/dist.json missing
      → reject with a typed sanitized missing failure before opening a listener
  → target/dist.json present and fully valid
      → start declared-asset service for that verified generation
  → malformed, legacy, integrity mismatch, asset mismatch, path fault, or IO fault
      → reject before opening a listener
```

Invariants:

- Treat the Deno `Request` URL pathname as substrate-canonical input. Deno removes raw dot segments,
  including percent-encoded forms, before constructing the application-visible request, so the
  handler cannot distinguish those aliases from their canonical pathname. Split the remaining
  encoded pathname into segments, decode each segment exactly once, and reject decode failure, NUL,
  backslash, encoded separators, surviving dot segments, empty interior segments, or any
  non-canonical Files path. Query text is not path authority. `/` alone maps to authenticated
  `index.html`; no other directory index or SPA fallback exists. Substrate normalization never
  widens authority because every resulting canonical path still passes through the authenticated
  FilesStatic map and exact pinned read.
- Capture Host authority immediately after synchronous `HttpServer.start(...)` returns, with no
  intervening await. Until that snapshot exists, middleware returns `421`. Derive the normalized
  accepted set from both `started.hostname` and `started.addr.hostname`, always include
  `localhost:<port>` because `started.origin` uses it for loopback binds, and bracket IPv6 authority
  correctly. Missing, malformed, wildcard, rebinding-name, non-loopback, or wrong-port authority
  returns `421` before Files lookup or the lazy read callback.
- Create Hono with exactly `{ static: false, cors: false }` and no `pkg` or `hash`; never route
  through generic static middleware or emit `pkg`/`pkg-digest` headers.
- Missing is a distinct fail-closed startup result, never a successful service state.
- A later materialization requires a fresh start and verification pass.
- Ready serving delegates exact part reads to `Pkg.Dist.Pinned.readPart` and response shaping to
  `serveFileBytes`. `DistServer` supplies only the verified root plus the FilesStatic-resolved
  relative path, checksum, size, and combined request/server lifecycle.
- Map `/` only to authenticated `index.html`; do not add an implicit SPA fallback.
- Configure the HTTP primitive for `GET`/`HEAD` only, canonical single-decoded paths, and no Range.
  Partial-content semantics are not admitted until the HTTP owner supports chunk verification.
- Serve only paths admitted by the authenticated FilesStatic backing; never expose `dist.json`,
  signatures, receipts, ignored files, directory listings, or incidental target files.
- Keep the authenticated manifest map in memory, require `Pinned.readPart` to return only bytes that
  match its part authority, and require the HTTP primitive to emit exactly those returned bytes, so
  post-start mutation cannot produce different executable bytes.
- Set `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, and no CORS grant on every
  application response. An ephemeral port is not a cache-isolation boundary.
- `Pkg.Dist.Pinned.readPart` rejects symlinked ancestry/final targets, non-files, path/handle
  identity changes, size changes, and checksum mismatch before returning bytes. Hardlink identity is
  not a trust claim; the returned-byte checksum remains authoritative.
- Bind `127.0.0.1` by default and use port `0` for product startup.
- Return the standard `t.Service`/HTTP lifecycle handle; do not invent a second lifecycle grammar.
- Missing failure output exposes no local path, profile data, source URL, or trust facts.
- The host never pulls, promotes, opens a browser, or selects product compatibility.

## Cell composition seam

Cell core remains unchanged. `@sys/server/dist/service` exports only `DistService`; the direct
`@sys/server/dist` module remains free of YAML/schema/config dependencies. The endpoint accepts only
Cell's standard `{ cwd, paths: { config }, silent, until }` start arguments, loads one owner YAML
document, and delegates to `DistServer.start` without duplicating verification, path, response, or
lifecycle policy. Cell descriptors use `use: DistService` and
`from: 'jsr:@sys/server/dist/service'`.

The strict config shape is:

```yaml
name: neutral-dist
dir: ./.dist-store/sha256-<manifest-pin>
integrity: sha256-<exact-dist.json-byte-hash>
limits:
  manifestBytes: 1048576
  entries: 1000
  fileBytes: 16777216
  totalBytes: 67108864
hostname: 127.0.0.1
port: 0
```

The document rejects unknown keys, inherited values, non-canonical integrity, invalid/unsafe limits,
non-loopback hostnames, and invalid ports. Resolve relative and absolute `dir` against canonical
Cell `cwd` and reject any result outside it. The follow-up `@sys/std/path` containment authority
must preserve this fail-closed behavior while admitting contained names such as `..cache`; symlinked
escapes remain rejected by pinned verification. `silent` and `until` come from Cell and cannot be
overridden by YAML. The endpoint forwards optional `name`, `hostname`, and `port`, and
`resources(...)` declares one `tcp-listener` only when the configured port is non-zero.

Full-generation verification runs inside service startup and is therefore bounded by Cell's default
10-second start timeout unless the descriptor supplies an explicit `timeout:`. Document that
coupling beside the service example. A timeout/cancellation must prevent listener startup or close a
late returned handle through the existing Cell lifecycle contract.

The Cell proof first materializes the neutral fixture through public `Dist.materialize`, writes the
pinned local-host config for the returned integrity-addressed generation, then starts `DistService`
through the ordinary `@sys/server/dist/service` Cell descriptor/import path. It proves the
configured returned origin serves exact bytes and closes through Cell, without production imports
from `@sys/tools` or any Cell-core change. Ordinary arbitrary-directory serving remains separate and
explicitly unverified.

## Proof

The filesystem-foundation prerequisite owns complete-generation verification, and the
materialization prerequisite owns no-clobber integrity-addressed publication. This arc first proves
the promoted `@sys/fs/pkg` part-read kernel:

- public surface identity and exact input snapshots, including inherited/unknown key rejection and
  canonical path/checksum/size admission;
- zero-byte and maximum admitted reads, exact EOF probe, short/grown files, final and ancestor
  symlinks, inode/metadata swaps before/during/after read, checksum mismatch, unsupported metadata,
  pre- and mid-loop cancellation, first-failure preservation, and close-on-every-path;
- red/green proof uses the existing injectable IO seam, and `Pinned.verify` continues through the
  same private read kernel rather than a copied implementation.

The HTTP commit proves only its filesystem/crypto-free lazy byte-response contract:

- unsupported methods and Range reject before `read` invocation; GET and HEAD invoke it exactly
  once;
- HEAD authenticates through the same callback but emits no body; GET emits exactly the returned
  bytes with correct MIME and length;
- missing/changed/cancelled/failure/throw map to `404/412/499/500` with no body or private data;
- conditional headers never produce `304`; success and failure are `no-store`/`nosniff`, with no
  CORS, ETag, `pkg`, or `pkg-digest` residue;
- a production-source residue test rejects `Deno.open`, `Deno.lstat`, `Hash.`, and equivalent direct
  filesystem/hash kernels under `code/sys/http/src/http.server/**`.

Neutral Server tests, with no product imports or vocabulary, prove:

- complete direct input and nested limits are snapshotted before the first await; inherited/unknown
  authority, non-loopback bind input, and pre-cancellation fail before verification/listener work;
- missing target rejects with a typed sanitized failure before listener startup;
- deliberate `materialize` result versus `DistServer.start` rejection semantics and
  `DistServer.Error.is` narrowing are public and stable;
- materializing after a missing failure requires a fresh successful start;
- valid exact-integrity Dist → HTTP 200 for declared assets only, with browser-valid MIME types;
- FilesStatic result narrowing requires `ref` + `hash` + present safe size, admits size zero, and
  rejects malformed/missing ref authority before part reads;
- Host authority is assigned immediately after start; absent authority, wrong port, rebinding names,
  wildcard/non-loopback values, and malformed Host return `421` before lookup/read, while
  `localhost`, the bound address, and bracketed IPv6 forms are admitted when applicable;
- canonical single-segment decoding rejects malformed escapes, encoded separators/backslashes,
  surviving dot segments, and empty interior segments; a raw-request runtime proof pins Deno's
  pre-handler dot-segment normalization and confirms every resulting canonical path still passes
  through FilesStatic authority; `/` alone maps to `index.html`;
- wrong manifest integrity, missing/modified declared assets, malformed/legacy manifests, path
  faults, and filesystem faults fail closed without leaking local paths or raw causes;
- ignored/undeclared files, manifest metadata, signatures/receipts, directory indexes, and
  incidental target files are never served;
- post-start mutation, symlink replacement, size change, and checksum mismatch emit no asset bytes;
- adapter-construction throw maps to sanitized `startup-failure` and opens no listener;
- caller/request cancellation and normal close leave no listener or lifecycle bridge;
- `@sys/server/dist` exports exactly `Dist` and `DistServer`, while `@sys/server/dist/service`
  exports the identity-tested `DistService` endpoint only;
- `DistService` rejects malformed/unknown config, admits only paths contained by Cell `cwd`,
  forwards Cell-owned `silent`/`until`, and declares only fixed non-zero listener resources;
- the server-owned Cell endpoint delegates without duplicating verification or serving policy;
- a Cell service materializes then hosts the same neutral verified Dist through public owners
  without `@sys/tools` or Cell-core changes;
- a deliberately small descriptor `timeout:` cancels full-generation startup and proves no late
  listener/handle leak under leak tracing.

Verification order:

```text
code/sys/fs          deno task test --trace-leaks ./src/m.Pkg
code/sys/fs          deno task check
code/sys/http        deno task test --trace-leaks ./src/http.server/m.HttpServer
code/sys/http        deno task check
code/sys/std         deno task test --trace-leaks ./src/m.Path
code/sys/std         deno task check
code/sys/server      deno task test --trace-leaks ./src/m.server.dist
code/sys/server      deno task check
code/sys/cell        deno task test
code/sys/cell        deno task check
```

Run each owner module's configured task authority, scoped lint/format/diff and public-export residue
checks, then the affected full owner suites. Finish with direct probes for missing-start refusal,
ready serving, Host rejection, post-start mutation, Cell-configured startup, and disposal behavior.
Clean-tree publishing remains release workflow and must never be bypassed with `--allow-dirty`.

## Non-goals

- Pulling remote bytes.
- Mutable `latest` selection.
- Cache/store registries, active pointers, rollback, or LKG policy.
- Browser opening or product boot data.
- Signature/key management.
- Service-worker registration or browser cache ownership.
- A product-specific API or fixture.
- Hostile local request-flood resistance beyond Deno's server substrate; each admitted response read
  remains exact-size bounded and cancellation-aware.
