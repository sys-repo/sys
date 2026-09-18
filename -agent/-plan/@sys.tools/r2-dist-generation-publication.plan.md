r2-dist-generation-publication.plan.md
- [ ] test(driver-cloudflare): add an opt-in conditional R2 settlement proof
- [ ] GATE authorize bounded disposable R2 experiments
- [ ] feat(driver-cloudflare): expose conditional R2 object writes
- [ ] feat(tools): publish exact verified R2 Dist generations
- [ ] feat(tools): activate R2 Dist generations with guarded settlement
- [ ] test(tools): prove R2 generation publication failure worlds
- [ ] docs(deploy): reconcile generation-qualified R2 exposure

## Status

- Phase: bounded provider research before production implementation.
- Next implementation item: the opt-in conditional R2 harness and shared driver-owned request
  kernel. Missing documentary atomicity proof does not block preparing or testing that harness.
- Evidence posture: combine documented capabilities, exact client mechanics, and bounded live
  observations. No Cloudflare support reply or universal concurrency theorem is a prerequisite.
- Production dependency: the conditional public API requires the empirical acceptance evidence
  below. Provider behavior is not claimed proven before that evidence exists.
- Authorization: the opening gate controls the bounded credentialed experiment, not harness
  preparation or test completion. Production namespace admission remains separately required.
  Neither a review nor an exposure/release-owner decision substitutes for empirical acceptance.
- Scope: one narrow R2/Deploy protocol. No generic Files publication package is authorized.
- Feeder state: deterministic exact-root staging, verified local Deploy preview, and Orbiter
  retirement have landed and their plans have been retired.
- Migration dependency: production adoption requires a fresh non-overlapping R2 prefix and removal
  of every legacy flat-R2 writer with authority over that prefix.
- Delivery order: this plan supplies storage publication; the exposure plan consumes it for public
  generation proof; Driver Pi consumes both for published release evidence. Neither downstream plan
  is a prerequisite for this plan's implementation or documentation.

## Repository reconciliation — 2026-09-06

Current repository truth after the feeder work:

- exact root Dist staging landed in `7f0b346f9`; verified local preview completed in `0b7f0b541` and
  its plan retired in `3d1563a59`;
- Orbiter retirement completed in `927eb549e` and its plan retired in `b583b3dc6`;
- `Pkg.Dist.Pinned` exact-canonical reads landed in `e61e0122d`;
- staging now returns immutable `Pkg.Dist.Local.Verify.Evidence`, and
  `u.staging/u.verifyStagedDist.ts` owns the frozen `DIST_VERIFY_LIMITS` policy shared with preview;
- an independent `Deploy.push` does not receive prior `StageResult.verification`: push target
  resolution currently carries only provider/source/staging/domain data, so publication must run a
  fresh verification and use that evidence for every pinned local read;
- the R2 Files backing landed in `28faad7b4`; ordinary Files clients already reach the R2 bucket
  through `R2.Files.create(...)`. This is not a missing provider integration;
- the R2 driver still exposes only unconditional `stat/read/write/remove/list`; its S3 transport
  maps `write` to `S3Client.putObject`;
- the public R2 push still performs mutable flat publication through `R2.Files`: it loads staged
  `dist.json`, skips against remote metadata unless forced, writes assets concurrently, writes
  `dist.json` last, then removes stale objects;
- R2 provider configuration still requires `kind`, account, bucket, prefix, and credentials, with
  optional `readOrigin`; no publication protocol field exists;
- push results still model only per-file `written | skipped` and prune statistics; generation,
  receipt, activation, conflict, and unknown-settlement branches do not exist;
- `@sys/web` remains a scaffold, and the separate R2 exposure plan has not landed implementation.
  Neither is a prerequisite for this storage publication protocol;
- push also loads the manifest before provider admission in `u.push/u.endpoint.ts`
  (`targetStagingOutput`) and `u.menu/run.pushWithSpinner.ts`; all three push-path `Pkg.Dist.load`
  calls must disappear in the public switch;
- `EndpointActionArgs.until` does not reach `runPushAction`, and the independent push API, endpoint,
  target, spinner, and provider signatures lack lifecycle input;
- `R2.Bucket.read` returns one `Response`, which can support coherent body/validator observations;
  current bucket validation does not enforce the provider's UTF-8 key-byte or metadata-byte limits;
- `code/sys/std/src/m.Json/u.stringify.ts` preserves insertion order and adds LF for multiline JSON;
  it is not a general canonical serializer;
- ordinary `stageMappings` finalizes with Tools' package identity and recomputes `dist.json`,
  including build time. It can also generate indexes and change HTML. Staging is not an exact import
  of a previously frozen product Dist; the release handoff below must bypass it.

## Objective

Replace the R2 deploy provider's mutable flat snapshot with a truthful publication protocol for one
exact verified Dist generation.

A successful push must establish:

> One exact locally verified Dist supplied pinned upload authority, was reproduced or reused as one
> exact remotely verified immutable generation, and was committed without clobbering another
> commitment. Final control observation proved it current, either through guarded activation or
> convergence on an already-current generation.

A stale publisher must never replace a fresher revision. A settled race converges on the desired
generation or conflicts; throttling and unresolved dispatch remain explicit non-success outcomes. A
reader resolving current must use generation-qualified URLs, never a mutable flat path described as
an atomic generation switch.

The target flow is:

```text
strict local Dist verification and complete preflight
→ coherent retained activation parent
→ checksum-pinned uploads or GET-verified immutable reuse
→ exact remote bytes, representation, and key-set verification
→ create-only deterministic commit receipt or verified reuse
→ original-parent ETag-CAS activation or observed-active convergence
→ generation-qualified URL (exposure proof remains separate)
```

This is the R2 expression of already-earned local invariants. It reuses the semantic model of
private construction, exact verification, no-clobber commitment, fresh final evidence, and truthful
settlement. It does not project filesystem locks, inode identity, chmod sealing, hard links, or
atomic directory promotion onto object storage.

## Why this plan exists

The current path in `code/sys.tools/src/cli.deploy/u.providers/provider.r2/u.push.ts` performs:

```text
parallel mutable asset writes
→ dist.json last
→ stale-object prune
```

The current R2 bucket and Files backing expose unconditional `stat/read/write/remove/list` only. Two
publishers can therefore interleave assets, publish a manifest describing another writer's bytes, or
prune one another. A successful PUT is not currently followed by exact remote byte verification. Cmd
cancellation does not abort the pinned S3 client's fetch or multipart work, and Cmd transports
thrown errors as message strings rather than preserving typed provider conflicts.

Exact-root staging now provides the local authority this protocol needs, but ordinary push is a
separate filesystem-resolved operation and does not carry that earlier evidence. The generation
publisher must therefore invoke the existing strict verifier afresh and use only the newly returned
pinned evidence; the current `Pkg.Dist.load` path is insufficient publication authority.

The correction is deliberately narrow:

- keep `DistPkg` as artifact metadata and exact manifest integrity as generation identity;
- keep `Files.Manifest` as a dynamic Files inventory;
- add provider-specific conditional complete-object writes and coherent GET/validator observations
  to `R2.Bucket`;
- keep generation layout, commit, activation, migration, and reporting in the R2 Deploy provider;
- keep public exposure intent in `@sys/web` and Cloudflare realization in its existing plan;
- do not introduce a lease, transaction framework, generic publication package, or destructive GC.

## Ownership and dependency direction

| Owner                           | Responsibility                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `@sys/fs` / `Pkg.Dist`          | Existing exact local verification and checksum-pinned local reads                                    |
| `@sys/driver-cloudflare/r2`     | Conditional mutation, coherent GET/validator, provider limits, ETag and rejection/throttle mapping   |
| `@sys/tools/deploy/provider.r2` | Layout, representation, verification, records, bounded scheduling, activation, migration, settlement |
| `@sys/web`                      | Owned public exposure and generation-qualified URL intent in the separately governed exposure plan   |
| `@sys/driver-cloudflare/web`    | Cloudflare exposure verification and any later earned gateway realization                            |

Dependency direction:

```text
@sys/tools/deploy/provider.r2 → @sys/fs Pkg.Dist
@sys/tools/deploy/provider.r2 → @sys/driver-cloudflare/r2

@sys/driver-cloudflare/web (planned separately) → @sys/web
@sys/driver-cloudflare/web (planned separately) → @sys/driver-cloudflare/r2
```

`@sys/fs` does not depend on the Cloudflare driver. The web lines describe the separately planned
exposure realization, not a module that this plan must create.

The R2 driver must not import Deploy policy, Dist publication layout, Web exposure intent, or
retention rules. Deploy must not implement request signing or parse raw provider errors.

The plan lives under `@sys.tools` because its outcome is Deploy's publication protocol; the first
Cloudflare commits supply its provider prerequisites. Ordinary `R2.Files` remains useful and is not
replaced. Protocol-owned objects deliberately use the bucket directly, without widening Files/Cmd.
Public HTTPS requests likewise do not run through the Files adapter or inherit its policy checks.

## Rejected ownership

- **Base Files** — existing memory, filesystem, static, and R2 backings do not share one atomic
  revision contract. Adding conditional mutation to the generic grammar would force unrelated
  backings to overclaim or absorb unsupported churn for one caller.
- **`Files.Manifest`** — it is a dynamic bounded inventory, not a frozen Dist, publication receipt,
  activation record, or stable snapshot.
- **`@sys/model/files/publication`** — one R2/Deploy implementation does not earn a public generic
  publication ontology.
- **`R2.Files`** — it remains a dynamic Files backing. It does not own a multi-object Dist protocol.
- **Dist** — it owns artifact truth and verification, not cloud deployment policy.
- **R2 driver** — it owns provider mechanics, not generation layout, activation, rollback, or
  retention policy.
- **Web** — exposure consumes committed generations; it does not publish them.
- **Cmd** — Cmd may transport a future operation, but it is not storage authority and currently
  erases typed thrown conflicts across remote transport.

Reconsider a provider-neutral publication layer only after a second independent implementation
presents the same complete-value condition, conflict, generation, activation, and settlement
semantics.

## Protocol vocabulary

### Generation ID

The generation ID is the canonical SHA-256 integrity returned by `Pkg.Dist.Local.verify` for the
exact observed `dist.json` bytes. It is not `dist.hash.digest`.

- manifest integrity identifies the exact serialized manifest and therefore the generation path;
- `dist.hash.digest` remains the Dist composite asset digest;
- provider ETag/version values remain opaque operation revisions;
- none of these values is a signature or provenance claim.

### Generation

A generation is the complete immutable object set beneath one generation ID. Immutability is a
protocol invariant enforced by create-only writes and hard failure on mismatch. It is not
provider-enforced object lock and does not constrain credentials used outside this protocol.

### Commit receipt

`commit.json` is a deterministic publication marker written create-only after exact remote
verification of all generation content. It proves only that a protocol-compliant publisher reached
that state. It is not a signature, trust root, or independent content verifier.

### Current pointer

`current.json` is the only mutable protocol object. It carries the protocol version, monotonic
sequence, selected generation, manifest integrity, and exact commit-receipt integrity. Every change
uses provider-backed ETag CAS.

### Conflict

A precondition failure is an expected value-level result, never a parsed error string. Deploy
re-reads current state and settles it as idempotent success, competing-generation conflict, or
unknown.

## Layout

Use a fresh R2 namespace prefix dedicated to generation publication:

```text
<prefix>/
  current.json
  generations/
    <manifest-integrity>/
      content/
        dist.json
        <declared Dist part paths>
      commit.json
```

`current.json` also establishes the protocol format. On an empty admitted prefix it is initialized
create-only as sequence `0` with no selected generation. All later activations are ETag-CAS updates,
including the first selection from sequence `0` to sequence `1`.

This single initialized control record avoids a non-atomic two-object format/pointer bootstrap.
After a confirmed missing control GET, test emptiness with
`Bucket.list({ prefix: canonicalPrefix + '/', limit: 1, pageSize: 1 })`. If any object exists,
reread control once to distinguish a concurrent compliant initializer from an unknown/damaged
layout. Admit a valid advanced control record without resetting it; if control remains absent or
invalid, fail closed. An empty listing permits only a create-only attempt, not an unconditional
write or a claim of exclusive ownership.

Healthy operation does not scan every retained generation. Check the named control, legacy root
`dist.json`, and target generation; fail on encountered unknown objects. Do not claim a bounded
probe proves the absence of every unrelated root key. Full namespace audit remains an operational
admission fact, not an unbounded per-push scan.

A complete wipe by credentials outside the protocol is outside the cooperative-writer boundary. The
protocol must not claim to detect or fence an authority that can delete every control and generation
object.

## Configuration and migration

Extend the strict R2 provider schema with one required literal:

```yaml
provider:
  kind: r2
  publication: dist-generation-v1
```

The existing schema uses `additionalProperties: false`; old binaries therefore reject the new field
instead of silently running the flat publisher against a generation configuration. The new schema
rejects R2 provider documents without the literal rather than retaining an implicit flat fallback.

Migration requirements:

1. The configured `prefix` is new and empty before protocol initialization.
2. It is not equal to, beneath, or above a prefix still writable by a legacy flat-R2 publisher.
3. The first protocol mutation conditionally creates exact sequence-0 `current.json` only after an
   empty-prefix check.
4. A concurrent initializer must coherently read and admit existing control after create-only
   rejection or throttling. It may already be beyond sequence 0; never recreate/reset it.
5. Encountered unknown root objects, flat `dist.json`, unsupported control versions, malformed
   control values, and mixed layouts fail closed; bounded checks do not certify unobserved keys.
6. There is no automatic in-place migration, object move, copy, or deletion.
7. Existing flat content remains at its old prefix until an explicit product migration or retirement
   removes that authority.
8. `--force` never bypasses create-only generation writes, remote verification, layout admission, or
   pointer CAS.
9. Before production adoption, the bucket owner must provide evidence that no enabled lifecycle
   expiration rule overlaps any control or generation object, including whole-bucket rules. Absence
   of an expiration header alone is insufficient: Cloudflare documents delayed rule propagation.
10. The operator must retire/restrict legacy credentials that can reach the new namespace. A new
    YAML literal cannot fence an old configuration, direct API caller, or bucket-wide credential. If
    provider credential scope cannot isolate prefixes, use a separately isolated bucket.

A sentinel alone does not protect against an old publisher: the current flat prune would delete
sentinels and generation objects beneath its authority. Prefix non-overlap, strict config
versioning, retained-object lifecycle policy, and operational authority isolation are required
together. This plan neither changes lifecycle rules nor revokes credentials.

## Preflight bounds and representation

Complete this admission before sequence-0 creation or any other remote mutation:

- Require an already canonical, non-empty rootless prefix: no leading/trailing slash, empty or dot
  segment, backslash, NUL/control character, boundary whitespace, or ill-formed Unicode. Reject
  aliases rather than silently trimming, decoding, case-folding, or Unicode-normalizing them.
- Validate every complete content, receipt, and control key at no more than 1,024 UTF-8 bytes after
  layout expansion. JavaScript string length and a valid local Dist path are insufficient.
- Preflight every full representation metadata set within 8,192 bytes, conservatively counting
  encoded names and values. Driver validation repeats provider admission at dispatch; it must not
  depend on the Files adapter or the pinned client's character-count check.
- Retain `DIST_VERIFY_LIMITS` (16 MiB manifest, 8,193 entries, 128 MiB/file, 1 GiB total). The new
  driver complete-body primitive is capped at 128 MiB, below the documented 5 GiB minus 5 MiB
  single-PUT ceiling. Existing unconditional stream writes are unchanged.
- Cap each control/receipt body at 4 KiB, both before writing and before buffered parsing. Bound
  reads even when Content-Length is absent or dishonest.
- Refuse a different target when the admitted sequence is `Number.MAX_SAFE_INTEGER`, before
  uploading its generation. An already-current target remains eligible for unchanged verification.
- Use a finite operation-concurrency limit and aggregate in-flight byte budget covering owned
  payload copies and readback buffers. Do not preload the full 1 GiB tree or treat an eight-request
  count alone as a practical memory budget. Client/hash scratch allocation is not an RSS guarantee.

The Tools-owned `dist-representation-v1` policy is bound into every receipt and the protocol
version. V1 uses `Cache-Control: no-store` for control, receipts, and content; no content encoding;
no custom metadata, content disposition, content language, or expiry metadata. `dist.json` and both
control records use exactly `application/json`. Other media types come from a frozen, literal V1
path-extension table with a fixed binary fallback, established with byte fixtures in the publisher
commit. Do not delegate this durable table to an upgradeable MIME lookup at runtime.

Before implementation of the publisher, freeze that table and its representation fixtures; it is not
yet an earned runtime contract. On every create/reuse, verify Content-Type, Cache-Control,
Content-Encoding absence, and the absence of disallowed representation/custom metadata from the same
authenticated response as the bytes. Correct bytes with wrong metadata are occupied/corrupt, not
reusable. Check encoding before consuming a potentially auto-decoded body. Content hashes remain
independent of custom checksum fields.

Any incompatible table/cache/encoding change requires a new protocol version and fresh namespace,
not overwriting same-generation metadata. Public cache behavior is still separate exposure proof;
`no-store` here is requested origin metadata, not proof that edge rules obey it.

## Deterministic records

Use a Tools-owned exact record encoder, not a general canonical-JSON claim. Construct fresh literal
objects in the field orders below; use `Json.stringify(record, 2)`, UTF-8 without BOM, LF line
endings, and exactly one trailing LF. All fields are required, duplicate/unknown fields are invalid,
and undefined/omission is forbidden. Parse, strictly admit, reconstruct in that order, re-encode,
and require byte equality before hashing or using a record. Literal byte fixtures must prove the
format, including reordered keys, whitespace, numeric spellings, duplicate keys, and null rules.

`Json.stringify` preserves insertion order and supplies the multiline LF; arbitrary input objects
and spreading parsed data into output are not the protocol encoder.

### `commit.json`

The receipt contains only deterministic generation facts, in this exact field order:

1. `protocol`: `dist-generation-v1`;
2. `representation`: `dist-representation-v1`;
3. `generation`: canonical manifest integrity;
4. `manifestIntegrity`: the same canonical manifest integrity;
5. `distDigest`: Dist composite digest;
6. `assetCount`: admitted declared part count;
7. `assetBytes`: sum of admitted part sizes, excluding `dist.json`;
8. `manifestBytes`: exact `dist.json` byte length.

Counts and sizes are non-negative safe integers admitted against the finite verification policy.

It must not contain:

- timestamps;
- publisher/process/request IDs;
- host paths;
- credentials;
- ETags or provider versions;
- public URLs;
- mutable operational statistics.

Two publishers of the same exact generation must compute identical receipt bytes.

### `current.json`

The control record contains these exact fields in order:

1. `protocol`: `dist-generation-v1`;
2. `sequence`: a non-negative safe integer;
3. `generation`: canonical manifest integrity, or `null` at sequence 0;
4. `manifestIntegrity`: identical to `generation`, or `null` at sequence 0;
5. `commitIntegrity`: SHA-256 of exact receipt bytes, or `null` at sequence 0.

All three reference fields are null exactly when sequence is 0; all are non-null for every selected
record. Mixed nulls, omitted fields, and selected sequence-0 records are invalid.

Every selected-generation record must reference an already verified exact receipt. Sequence values
must be admitted as safe monotonic integers. The protocol never deletes or resets `current.json`.
Sequence monotonicity prevents protocol-level ETag ABA when rollback later selects an older
generation; it does not turn ETag into a hash or fence raw bucket credentials.

## Required R2 conditional primitive

After the bounded live research meets its acceptance criteria, add a provider-specific
complete-value operation to `R2.Bucket` and its transport. The public semantic name is
`writeConditional`. The contract below is required by the publication design; empirical acceptance
is not a claim that Cloudflare has documented a universal atomicity guarantee.

Required conditions:

```text
absent        → write only when the key does not exist
etag(value)   → write only when the current provider ETag exactly matches value
```

Required result:

```text
written(etag, optional version)
conflict       → proven conditional rejection
throttled      → explicit HTTP 429, not a CAS conflict
```

Keep a usable non-empty ETag mandatory for `written`; do not adopt optional success validators.
Missing/malformed success ETags are ambiguous errors to reconcile, not proof of non-commit.

Contract:

1. The provider enforces the condition atomically with one complete-object PUT.
2. Conditional rejection and explicit throttling are separate result branches. Map only provider-
   proven status/code pairs; do not assume all 409s are conflicts. Provider outages, invalid
   credentials, and malformed responses remain errors. Network/5xx ambiguity is not a rejection.
3. ETags are opaque and are used only as provider precondition tokens.
4. Successful writes return a usable non-empty ETag; absence is unsupported for this protocol.
5. Conditional data is bounded in-memory `string | Uint8Array`, never a stream.
6. V1 does not use multipart conditional publication. Documented limits, local admission tests, and
   live complete-object trials support the bounded single-PUT path. Deploy rejects an oversized Dist
   before its first remote mutation; small live payloads do not prove the maximum size.
7. Arbitrary conditional delete is not added.
8. The operation does not enter `R2.Files`, Files capabilities, Files Cmd, or Files policy.
9. Do not expose or accept an abort signal unless the actual signed request substrate observes it.
   Current pinned-client requests do not; ignored cancellation inputs are forbidden.
10. Header quoting, response ETag normalization, and exact conflict status/code mapping come from
    provider proof, not generic S3 assumptions.
11. Driver-owned `readObserved` must pair the response body, representation metadata, and admitted
    opaque ETag from one authenticated GET. It may reuse the existing GET transport, but never issue
    a separate HEAD/stat to obtain a validator. Deploy receives a coherent observation, performs
    bounded body verification, and owns closing/cancelling that response body.
12. The shared request implementation performs no implicit retry or CAS rebase. Deploy owns bounded
    pacing/retry and settlement; all attempts preserve the caller's original condition and bytes.

The existing unconditional `Bucket.write` remains for ordinary R2/Files use. Generation publication
must not call it for protocol-owned generation, receipt, or pointer objects.

## Publication state machine

```text
local-unverified
→ local-verified
→ remote-incomplete
→ remote-verified
→ committed
→ active
```

Remote observations:

- generation content without exact `commit.json` → incomplete residue;
- exact `commit.json` plus exact remotely verified content → committed inactive generation;
- exact `current.json` naming that receipt → active generation.

Only `active` is a successful ordinary R2 push. A committed inactive generation remains valuable
settlement evidence on conflict, cancellation, or activation uncertainty.

Selection is not access control: a direct public origin may serve known generation keys before a
receipt or activation exists. Incomplete residue is unselected, not necessarily HTTP-unreachable or
private. Discovery readers require the control/receipt contract; independently pinned readers must
verify their selected artifact. Neither marker makes partially uploaded public objects secret.

## Exact artifact handoff

Support publication of one already-built Dist without staging, rebuilding, copying through the
staging finalizer, regenerating manifests/indexes, or rewriting HTML. The release owner selects and
retains the exact manifest integrity and expected package name/version before publication. Tools
must not infer release authority from newly observed local bytes, a receipt, a pointer, or an ETag.

First prove the existing push-only path through `u.push/u.endpoint.ts` and
`u.push/u.resolveR2PushTargets.ts`. Reuse its target/provider composition where it safely admits the
frozen root. If the current staging-shaped input cannot express that handoff safely, add only a
complete-value exact-Dist input at the existing Deploy boundary, not a second publisher, generic
Files publication layer, or release facade. Define that input in the public types before wiring it.

The exact-Dist input binds the selected root, independently retained manifest integrity, and
expected package as one admitted value. Snapshot it before asynchronous work and carry it unchanged
through public, endpoint, target, and provider boundaries. Do not use two optional expectation
fields that permit a half-specified release. Such an invocation must refuse `stage+push` before
staging starts; missing input must never trigger implicit staging or repair of the selected root.

Fresh strict verification must match both the retained manifest pin and expected package before any
provider call. A different but internally valid Dist is substitution, not a new authorized
candidate. Continue pinned part reads through publication; later mutation remains a failure. Normal
Deploy staging may still produce a new artifact, but observation-only publication must not be
reported as an independently pinned product-release handoff.

Closure binds the selected local manifest/assets, publisher input, verified R2 generation, public
readback, and Pi's materialized generation to the same retained authority. Only location changes.
Public readback and Pi execution belong to the downstream plans; they are not harness prerequisites.

## Local admission and pinned reads

An independent push has no retained `StageResult.verification`, so it must verify afresh at the
publication boundary rather than trust the existence of `dist.json`. For the exact-artifact lane,
that verification checks the already-selected authority; it never selects a replacement candidate.

Strict verification must be the first manifest read on every push entry path. Remove
`targetStagingOutput`'s metadata load in `u.push/u.endpoint.ts`, the display load in
`u.menu/run.pushWithSpinner.ts`, and `loadDist` in `provider.r2/u.push.ts` when wiring generation
publication. Spinners may initially display no byte count. Derive all staged sizes, digests, and
reporting from the one retained evidence and its pinned manifest; presentation must not reopen it
through `Pkg.Dist.load`. Tests must exercise both public and interactive entry paths, not just the
provider, with oversized and symlinked manifests and assert zero provider calls.

1. Snapshot provider configuration, publication policy, limits, lifecycle input, and any complete
   exact-Dist source authority before work.
2. Reuse the existing frozen Deploy-owned `DIST_VERIFY_LIMITS`; do not introduce a second
   publication verifier policy or an unlimited/anonymous default.
3. Call the existing `verifyStagedDist` authority against the selected Dist root and retain its
   immutable evidence. Reusing this verifier does not invoke the staging transformer.
4. Any non-verified result or retained pin/package mismatch fails before provider calls; do not fall
   back to `Pkg.Dist.load`, restaging, or automatic repinning.
5. Use that evidence's integrity and `manifestBytes` to read exact `dist.json` through
   `Pkg.Dist.Pinned.readPart`.
6. Strictly parse every admitted `dist.hash.parts` value into its exact SHA-256 and size.
7. Read every declared part through `Pkg.Dist.Pinned.readPart` immediately before its remote write.
8. Preflight every declared size against the proven conditional single-PUT limit before initializing
   or mutating the remote protocol prefix.
9. Preserve existing path confinement, symlink refusal, exact tree correspondence, mutation
   detection, and aggregate limits.
10. Changed bytes after local verification must fail the affected pinned read. Use the evidence's
    canonical `dir`, not the original possibly aliased staging path. Never upload bytes outside the
    verified manifest.
11. After all local/key/metadata preflight, admit/initialize remote control and retain one coherent
    activation parent before publishing content. Never choose a newer parent after a slow upload;
    that would let delayed work silently supersede an intervening publication.

Freshly observed local integrity alone is observation authority. Comparing it with independently
retained release authority preserves that authority; neither case creates a signature or build
provenance claim.

## Generation publication

For each exact generation content object, in deterministic path order with bounded concurrency:

1. Use its preflighted generation-qualified key and exact pinned local authority.
2. Bounded authenticated GET first. If present, verify exact length, SHA-256, and V1 representation
   metadata, then reuse without a PUT. Only a confirmed not-found permits create-only PUT.
3. Immediately before a needed write, read exact local bytes through `Pkg.Dist.Pinned.readPart`.
4. On `written` or `conflict`, GET and verify the same exact bytes and metadata. On `throttled`,
   reread before considering the bounded original-condition retry policy below.
5. On response ambiguity, exact readback can establish content reuse but not writer attribution.
   Missing content cannot establish non-commit; report possible residue and do not advance to a
   receipt until all content is proven. Wrong bytes/metadata, oversize, or truncation fail occupied/
   corrupt. Never overwrite or remove the object.
6. Check metadata before body decoding, bound allocation/consumption, and close/cancel bodies on
   early refusal; do not drain an arbitrarily oversized body to EOF.
7. Await all started client operations before returning. After the first failure, stop scheduling
   new work but quiesce already-started requests. A settled client error can still leave an unknown
   provider-side outcome.

Remote readback is the v1 proof. Do not substitute ETag, object existence, content length alone,
custom metadata, or a self-authored checksum field. A later provider-checksum optimization requires
its own source-backed proof and must preserve the same exact result.

After every content object verifies:

1. List only this generation with a bound of expected content keys plus the optional receipt plus
   one unexpected key. Require exact content-set correspondence; undeclared objects are corruption.
   Reserve the unexpected-key lookahead and actual page-request budget; an iterator ending only
   because of its object cap must not be mistaken for complete correspondence. Bound and validate
   observed keys before retaining them. This is not a listing of all retained generations or an
   atomic snapshot against raw credentials.
2. Compute the preflighted exact deterministic `commit.json` bytes. GET-first reuse an exact
   receipt; create-only PUT only after confirmed absence, then read back. Apply the same byte,
   metadata, throttle, response-loss, and no-overwrite rules as content.
3. Reverify the complete remote generation, including bounded key-set correspondence and receipt,
   before using an existing commitment as fresh evidence.
4. Return committed generation evidence and the originally retained activation parent without
   mutating `current.json`.

An unchanged repeat of the same frozen, already-current generation means zero PUT dispatches, not
merely zero successful mutations. Every content object, receipt, metadata set, exact key set, and
control reference is still reverified. Restaging can change manifest identity even when asset bytes
match; that is a different generation, not this zero-PUT case. A race may dispatch rejected PUTs;
report those separately from successful mutations.

Writing `dist.json` last is no longer the commit boundary. It is artifact content; `commit.json` is
the explicit post-verification protocol marker.

## Activation

1. Retain exact parent bytes, sequence `n`, and opaque ETag from one authenticated control GET at
   admission, before content publication. A split `read` + `stat` is forbidden: stale bytes paired
   with a newer validator can overwrite an intervening publication.
2. Reject missing/malformed ETag, unknown protocol, noncanonical JSON, unsafe sequence, unexpected
   fields, invalid null rules, or mismatching receipt references. Bound both records before parsing.
3. Verify the target generation, representation, exact key set, and receipt immediately before
   activation. Reread current coherently for settlement, never to adopt a fresher CAS parent.
4. Desired generation and exact receipt already current means observed-active/unchanged success,
   regardless of which publisher selected it. A different valid successor of the retained parent
   means conflict. A same-sequence different record is corruption, not a new parent.
5. Only while the original parent is still observed, construct exact sequence `n + 1` bytes and
   conditionally write with its retained ETag. Keep bytes, metadata, and condition fixed across any
   explicitly throttled retry. Never increment again or rebase within this push.
6. After dispatch, reconcile all outcomes through the settlement table below. Even a `written`
   response needs exact current readback; a later writer can supersede it before that read.
7. On a conditional rejection, a desired current generation converges; another valid successor is
   conflict; unverifiable state is failure/unknown. Never overwrite a fresher revision.
8. Rollback is a separate explicit operation retaining its own fresh parent, reverifying the old
   generation, and incrementing sequence. It never rewinds or resets the control object.

Success is observed-active at the final authenticated read, not a promise that no publisher can
activate after that observation. CAS is the activation fence; no distributed lease is required.

## Throttling and bounded retries

Cloudflare documents at most one write per second to one object name and HTTP 429 above that rate.
This applies to sequence-0 creation followed by activation, same-generation races, and pointer CAS.
Local pacing cannot prevent another process from using the same key.

- Use one named frozen Tools retry policy: at most four dispatches per logical write, with nominal
  delays of 1, 2, and 4 seconds before successive retries. Pace local writes to `current.json` at
  least one second apart. Inject clock/wait effects for deterministic tests; no timer races.
- Final control settlement has at most four GET attempts with the same nominal backoff. Exhausting
  that budget after ambiguous dispatch returns unknown, never a timing-based non-commit claim.
- Only explicit, provider-classified throttling permits retry. Reread first: exact desired state
  converges; a valid competing successor conflicts; the unchanged original parent permits a paced
  retry with the identical bytes and original condition. Missing/corrupt control stops.
- For generation/receipt creates, exact existing content is reused; confirmed absence permits a
  paced retry of the same absent condition. Wrong content/metadata always fails.
- Do not invent Retry-After support: the pinned client's `ServerError` does not retain response
  headers. The finite local policy cannot be reset by repeated 429s.
- Exhaustion after only definitive rejections reports `throttled`, not transport ambiguity. Any
  earlier unresolved dispatch makes old-state readback `unknown`, even if a later attempt got 429.
- No automatic mutation retry follows network/5xx ambiguity or a competing-generation conflict.
  Caller cancellation stops new retries; post-dispatch settlement reads use independent lifecycle.
- Attempt/backoff bounds are not a request-completion deadline. The pinned fetch has no abort seam;
  request and cancellation completion can remain delayed by that substrate.

## Crash, cancellation, and response-loss settlement

| Boundary                                   | Required truth                                        |
| ------------------------------------------ | ----------------------------------------------------- |
| Before first remote mutation               | no remote protocol change                             |
| During generation writes                   | incomplete unselected residue; retry may verify/reuse |
| After content verification, before receipt | remotely verified but uncommitted residue             |
| After receipt, before activation           | committed inactive generation                         |
| During activation request                  | outcome may be ambiguous until pointer reread         |
| After verified pointer readback            | active generation                                     |

Cancellation propagation must cover both entry chains in the activation/schema-switch commit:

- `DeployTool.PushArgs.until` → `push` → `pushEndpoint` → `pushTarget` → R2 provider `PushArgs`;
- `EndpointActionArgs.until` → `runPushAction` → `runPushWithSpinner` → `pushTarget` → provider;
- the provider snapshots lifecycle input for strict verification, pinned reads, scheduling, and
  pre-dispatch checks. The `stage-push` transition must not start push after cancellation.

Observe cancellation before each new local read, remote dispatch, receipt, activation, and retry.
Stop scheduling and await started client work, but do not claim that an issued fetch was aborted.
After control dispatch, bounded settlement reads continue independently of caller cancellation.
Neither Cmd cancellation nor a local rejected promise proves provider non-commit.

| Post-dispatch authoritative observation                   | Truthful settlement                                                     |
| --------------------------------------------------------- | ----------------------------------------------------------------------- |
| Exact attempted record and verified target                | observed-active; attribution only when known                            |
| Desired generation/receipt at a later sequence            | observed-active; not a claim this request won                           |
| Valid competing successor beyond retained parent          | conflict; no rebase                                                     |
| Original parent after network/5xx/response-loss ambiguity | unknown; the request can still settle                                   |
| Original parent after only definitive rejection(s)        | known rejected/not activated by those attempts, or throttled exhaustion |
| Missing, malformed, unsafe, or unreadable control         | unknown/corruption, never known non-commit                              |

A parent selecting another generation is not a competing successor: compare with the retained parent
before classifying it. No activation dispatch means no activation was initiated by this push; it
does not prove another publisher left the pointer unchanged. Even after reporting unknown, a
provider-side request may complete later. Deterministic lost-response and delayed-completion worlds
test this conservative logic, not an undocumented provider timing guarantee.

Multipart abort/cleanup is outside v1. V1's no-abort limitation must remain explicit in CLI/API
cancellation documentation.

## Concurrency worlds

### Same generation

- GET-first object creates race independently;
- at most one original absent-condition write creates each key;
- a loser can be conditionally rejected or throttled, then verifies exact existing bytes/metadata;
- both compute identical receipt bytes;
- one receipt create wins and the other verifies it;
- one pointer update wins or both converge on the same exact current generation;
- both may settle successfully only after exact current verification.

### Different generations

- generation objects occupy disjoint immutable prefixes;
- both generations may commit;
- both publishers retain one coherent pointer revision before publishing their content;
- at most one original-revision CAS activation wins; 429 may defer either attempt;
- the loser rereads and returns a typed competing-generation conflict unless its desired generation
  is already current;
- no loser writes against the fresher revision automatically.

### Stale delayed writer

- it may complete objects only beneath its own generation;
- it may create/verify its own receipt;
- stale pointer CAS is rejected or throttled; paced retries never replace its original condition;
- a slow publisher cannot reread a fresh parent after uploads and silently supersede newer work;
- it cannot mutate the active generation or current pointer through protocol APIs.

## Reader contract

Publication produces generation-qualified content URLs:

```text
<readOrigin>/<prefix>/generations/<generation>/content/<path>
```

### Reader selection

- Discovery readers resolve `current.json` once, strictly admit its protocol, sequence, generation,
  and receipt reference, and validate the exact receipt when requiring control-plane verification.
  They bind every subsequent content request to that selected generation.
- Independently pinned readers such as Pi already hold a generation-qualified manifest URL, exact
  manifest pin, and expected package. They bypass current-pointer discovery. The endpoint, receipt,
  pointer, and ETag never supply execution authority or a replacement pin.
- Retention keeps an older selected generation usable after later activation. CAS protects Deploy
  concurrency; it is not Pi authenticity. A pinned consumer does not logically need a mutable
  pointer, but ordinary `Deploy.push` still requires observed-active settlement for success.

### URL and exposure invariants

1. Use generation-qualified paths throughout the selected content request graph.
2. Root-absolute HTML/CSS/module URLs can escape the generation prefix. Publication cannot repair
   them; the product build and direct-browser proof must establish transitive URL closure.
3. Direct R2 custom-domain serving does not dereference `current.json`, synthesize directory-index
   routing, or implement a stable-current URL. A resolver/gateway requires a separately earned need.
4. `readOrigin` remains optional for private control workflows. Without it, report no public URL.
5. Require an owned HTTPS origin without credentials, query, fragment, or path prefix;
   percent-encode each admitted key segment once. Preserve literal `%`, spaces, `?`, `#`, and
   Unicode as key data; never decode them into paths.
6. Report a configured generation URL as unverified exposure until the separate public proof.
   Authenticated S3 readback and requested `no-store` metadata prove neither public visibility nor
   edge/cache behavior, including negative caching.
7. Artifact acquisition verifies the public manifest and every declared asset against the retained
   authority. Pi's Deno downloader does not inherently require browser CORS to the R2 origin.
8. Direct public-browser execution is additional evidence: complete URL graph, redirects,
   MIME/headers, relevant CORS, worker scope, and cache behavior. A generation path is not a
   separate browser origin, and a public browser does not inherit Pi's launcher pin.

## Reporting and operator truth

Replace flat `written | skipped` and prune-only reporting with explicit R2 publication settlement.
Programmatic and CLI results must distinguish:

- exact generation ID and manifest integrity;
- local verification status and verified bytes;
- generation objects created, reused, and remotely verified;
- incomplete/committed/active state;
- receipt created or reused;
- previous and resulting activation sequence;
- activation changed, unchanged, conflict, throttled, cancelled-before-dispatch, or unknown;
- request and byte totals for PUT attempts, successful writes, rejection/throttle counts, and
  verification reads; zero successful writes is not the same as zero PUT dispatches;
- retained incomplete and committed-inactive residue discovered during bounded work;
- errors and cleanup facts without credential, host-path, or raw provider-body leakage.

Expected concurrency conflict, exhausted throttling, and activation unknown require stable result
branches through provider, endpoint, spinner, and public programmatic APIs. They must not collapse
to `reason: 'failed'`, a generic thrown Error, or an error message. Revise the current success-only
`Deploy.push`/`pushError` contract coherently at the public switch. `ok: true` means the desired
exact generation was verified current at the final observation, not an attribution or
lasting-current claim. Preserve observed and possible residue separately when any request outcome is
unknown.

`--force` may request fresh verification and an activation attempt. It never permits overwrite,
blind CAS retry, layout bypass, or generation deletion.

## Retention and repair

V1 retains generations and reports residue. It performs no automatic generation deletion. Retention
requires the operator-owned no-expiration/no-external-deletion invariant; credentials and lifecycle
rules can defeat it. Known lifecycle overlap blocks adoption/activation/exposure. Later deletion is
external corruption, not successful protocol retention, and must fail verification closed.

Repair rules:

- incomplete generation with matching objects → verify/reuse and create missing exact objects;
- mismatching existing object → hard occupied/corrupt failure;
- exact content without receipt → verify all content, then create receipt;
- committed inactive generation → reverify and attempt CAS activation;
- retained committed generation → eligible for explicit rollback after full verification;
- malformed control object → stop; do not reconstruct current from listings;
- unknown root/layout objects → stop; do not prune.

A later GC plan must independently prove activation fencing, permanent retirement authority,
rollback policy, old-URL retention, grace periods, concurrent activation, delayed writers, and
conditional deletion. Current flat `pruneStaleFiles` is not reusable.

## Security and trust boundary

This protocol protects against cooperative concurrent publishers, process failure, retry, delayed
requests, and ambiguous responses. It does not protect against a principal that can bypass it with
raw bucket credentials.

Required honesty:

- ETag is not a content hash, signature, or revision counter.
- `commit.json` is not provenance or authentication.
- local manifest integrity is not independently pinned merely because it names a remote path.
- create-only protocol behavior is not provider-enforced object lock.
- Files policy controls Files commands only; it does not protect direct public-origin HTTP reads.
- public generation URLs are public-by-design when the bucket/custom domain serves them.
- command authorization, endpoint authentication, custom-domain exposure, TLS, cache policy, abuse
  controls, and credential scopes remain separate boundaries.
- credentials, signed headers, provider response bodies, and raw internal object URLs must not enter
  logs or result values.

Least authority:

- the live proof uses a disposable bucket or explicitly bounded disposable prefix only after human
  authorization;
- the default test suite performs no Cloudflare mutation;
- Deploy publication touches only its admitted protocol prefix;
- no list/delete permission is treated as publication authority beyond bounded verification and
  diagnostics;
- no production deployment or bucket migration is authorized by this plan.

## Non-goals

- no Orbiter change, compatibility, migration, or dependency;
- no base Files, Files Cmd, Files Manifest, or Cmd transport change;
- no `@sys/model/files/publication` package or namespace;
- no distributed lease, TTL lock, renewal protocol, or fencing-token API;
- no multi-object object-store transaction claim;
- no multipart conditional publication in v1;
- no conditional delete or automatic GC;
- no in-place conversion of a flat R2 prefix;
- no stable-current Worker/gateway;
- no private, revocable, signed-URL, or header-sensitive access design;
- no provider-enforced immutability/object-lock claim;
- no ETag-as-hash or provider-version dependency;
- no signing, provenance, reproducible-build, or trust-root design;
- no Cloudflare DNS/custom-domain apply work;
- no rewrite of `Dist.materialize`, Rooted, or local lease/seal mechanics;
- no remote storage operations outside the explicitly authorized bounded experiment or publication.

## Plan relationships

### Orbiter retirement

Orbiter retirement is complete (`927eb549e`) and its plan is retired (`b583b3dc6`). No live Orbiter
provider or topology remains to coordinate with, and historical Orbiter concepts must not re-enter
the R2 generation protocol.

### Verified Dist preview

Exact-root staging and verified preview are complete (`7f0b346f9`, `0b7f0b541`), and the preview
plan is retired (`3d1563a59`). This protocol reuses `DIST_VERIFY_LIMITS`, `verifyStagedDist`,
immutable verification evidence, and `Pkg.Dist.Pinned`; it does not reopen preview ownership.
Because push may run independently of stage, it performs fresh verification instead of assuming
earlier evidence is available.

### R2 Files foundation and independent hardening

`28faad7b4 feat(driver-cloudflare): add R2 Files backing` supplied the ordinary adapter at
`code/sys.driver/driver-cloudflare/src/m.r2/m.Files/m.create.ts`; current Deploy composes it with
`Files.Client.local`. The retired backing plan remains recoverable at `bd7d0e6c7`, with removal in
`dd5bd2450`. Do not reopen that completed plan or confuse it with missing conditional semantics.

[r2-files-enumeration-bounds.plan.md](../@sys.driver.cloudflare/r2-files-enumeration-bounds.plan.md)
owns the independent whole-prefix scan/index hardening. It is not a prerequisite here: the harness
and publisher use bounded bucket operations, not the Files index. Conversely, this plan's bounded
verification does not fix ordinary Files enumeration.

### R2 web exposure and Pi release

[r2-web-exposure.plan.md](../@sys.driver.cloudflare/r2-web-exposure.plan.md) owns public exposure
intent and Cloudflare realization. Its live generation proof depends on this publication plan; model
and verifier implementation can proceed independently. This plan's final documentation must finish
without that public proof, retaining the explicit unverified-exposure label. There is no reverse
prerequisite and no default gateway.

[start-ui-release-evidence.plan.md](../@sys.driver-pi/start-ui-release-evidence.plan.md) owns the
product entry, retained pin/package, browser/platform and migration choices, and release execution
proof. It consumes the same frozen artifact after storage and public-delivery verification. Pi owns
no R2 credentials, uploader, pointer discovery, or proxy. Its release-owner decisions may progress
alongside this work without blocking the conditional harness.

## Bounded R2 research

### Evidence policy

Keep three evidence classes distinct:

- official Cloudflare documentation establishes advertised capabilities, consistency, and limits;
- pinned `@bradenmacdonald/s3-lite-client@0.9.6` source establishes client mechanics;
- authorized live experiments establish observed behavior for that client and tested R2 target.

The former documentary-proof gate was self-imposed and prevented gathering the missing evidence. It
is removed at the human's instruction. The compatibility matrix and client mechanics justify
building the research harness; they do not independently establish concurrent one-winner behavior. A
support answer may strengthen evidence later, but is not required to investigate or to reach an
explicitly empirical engineering decision.

#### Documented capability inventory

Official Cloudflare sources accessed 2026-09-06:

- <https://developers.cloudflare.com/r2/api/s3/api/>: PutObject advertises `If-Match` and
  `If-None-Match` as implemented conditional operations.
- <https://developers.cloudflare.com/r2/api/s3/extensions/>: CopyObject destination conditions "work
  akin to" PutObject conditions; the commit-time check and `412 PreconditionFailed` text explicitly
  describe CopyObject, not simultaneous PutObject winners.
- <https://developers.cloudflare.com/r2/reference/consistency/>: completed write/read, metadata, and
  list operations are strongly consistent. S3 access "does not transit through the cache";
  custom-domain caching can retain old objects and negative 404 responses.
- <https://developers.cloudflare.com/r2/platform/limits/>: keys 1,024 bytes; metadata 8,192 bytes;
  same-key writes 1 per second, with higher concurrent rates returning HTTP 429. The single-upload
  footnote is 5 GiB minus 5 MiB (5,363,466,240 bytes), not an unqualified 5 GiB.
- <https://developers.cloudflare.com/r2/objects/upload-objects/>: S3 upload examples consume the
  response ETag. An example is not a universal ETag/quoting guarantee.
- <https://developers.cloudflare.com/r2/buckets/object-lifecycles/>: expiration rules can select
  prefixes and delete objects; existing-object rule propagation can take 24 hours or longer.

Not established directly by those sources: atomic one-winner simultaneous conditional PutObject
settlement, the exact 409/412/429 interaction, accepted ETag roundtrip, or a deadline after which an
ambiguous request cannot commit. AWS PutObject is corroboration only, not R2 authority. No source
here proves public-domain reachability after S3 success.

Exact client artifact evidence, accessed 2026-09-06:

- <https://jsr.io/@bradenmacdonald/s3-lite-client/0.9.6_meta.json>
- <https://jsr.io/@bradenmacdonald/s3-lite-client/0.9.6/client.ts>
- <https://jsr.io/@bradenmacdonald/s3-lite-client/0.9.6/helpers.ts>
- <https://jsr.io/@bradenmacdonald/s3-lite-client/0.9.6/errors.ts>
- repository `deno.lock` package integrity:
  `5dac4eb9ce4d8574ce2eb21e1cff1e96b409ca3ba333913a8bbf918710dc50d9`;
- JSR metadata's `/client.ts` checksum:
  `sha256-d1b11f7214e226f0fa00748299bb78f3b37d92ea02eaaaf220da98af0d2ce4b7`.

These are recorded artifact identities, not a new independent provenance claim. `makeRequest`
accepts arbitrary headers, hashes/signs a complete body, and returns `Response`; typed `putObject`
metadata does not admit the conditions. `ServerError` retains status/code but not Retry-After
headers. `helpers.ts` checks JavaScript character count, not UTF-8 key bytes. Fetch has no abort or
injected-fetch option. No dependency upgrade is earned by this review.

### Existing connection setup and earlier proof

The live local configuration is `code/sys.tools/.tmp/-config/@sys.tools.deploy/r2-proof.yaml`. It
names the account, bucket `sys-test`, prefix `tmp.sys.tools/r2-proof`, and credential references
`SYS_TEST_R2_ACCESS_KEY_ID` / `SYS_TEST_R2_SECRET_ACCESS_KEY`. The repo-root `.env` exists and is on
Deploy's upward dotenv lookup path. Its secret values, credential validity, and provider permissions
have not been inspected or exercised in this research.

The retired `r2-files-backing.plan.md`, preserved in reachable commit `bd7d0e6c7` at
`-agent/-plan/@sys.driver.cloudflare/r2-files-backing.plan.md`, records earlier manual CLI proof
from `code/sys.tools/.tmp` against `sys-test`, then prefix `manual/r2-proof`. It records successful
uploads and unchanged-publish detection with and without public `readOrigin`. This is a historical
proof summary, not a retained conditional-race transcript. Local source and staged proof fixtures
still exist under `code/sys.tools/.tmp/r2-proof` and `code/sys.tools/.tmp/staging/r2-proof`.

Reuse the connection setup, not the existing deploy command: that command writes unconditionally and
prunes stale files. Use a fresh run-specific namespace under the proposed `r2-conditional-research/`
root, outside both old proof prefixes and any active deploy-owned prefix. Confirm `sys-test` remains
an appropriate disposable target at launch. Treat synthetic test data as potentially public because
the old configuration names an R2 public development origin. Do not re-upload real staged artifacts,
change bucket configuration, or touch old proof objects.

### GATE authorize bounded disposable R2 experiments

Resolver: the human controlling the R2 account. Provenance: the human requested planning around the
existing test account while explicitly withholding live execution. This gate controls the
credentialed harness run only; it does not block harness implementation or deterministic tests.

Pass: one explicit instruction approves the concrete target, fresh run prefix, bounded key set,
request/byte budgets, read/write experiments, and exact-key cleanup policy printed by the harness's
no-network dry run. The launch must use existing permitted credential and sandbox paths; this plan
cannot grant or bypass runtime permissions. Without that instruction, remote execution remains off.
The authorization resolves this gate, not the experiment's technical outcome. One approval covers
all declared trials, bounded retries, verification reads, and exact-key cleanup; do not ask again
for each request or case. It does not authorize production deployment, bucket migration, expanded
budgets, broad cleanup, or unrelated cloud operations.

### Live research acceptance

The preceding test commit adds an inert harness and shared driver-owned request kernel. The later
public driver operation must delegate to that kernel, not rebuild its mechanics. Kernel coverage
does not claim a not-yet-existing facade was live-tested.

Start with sequential absent-create, occupied-create, matching-ETag update, and stale-ETag rejection
baselines. Reuse the actual authenticated GET response ETag without reconstructing it from body
hashes. Then run a declared matrix of ten rounds at each of 2, 4, and 8 contenders for both creation
and CAS, using fresh keys per round and distinct successor bodies different from the CAS parent.
Record request start/end observations; overlapping client requests are not proof that server-side
condition checks overlapped. A failed or all-throttled round is not silently dropped or counted as
proof. Any further trials stay within the approved budget or are reported as unperformed.

The research report must establish:

1. at most one successful absent-condition writer in each simultaneous round, plus a successful
   winner within the finite proof budget. Classify 429 separately; an all-throttled round alone
   proves nothing about atomic conditional evaluation;
2. after pacing, retry throttled losers with the original condition and bytes, proving occupied-
   create or stale-ETag rejection rather than counting throttle as a conditional rejection;
3. matching-ETag one-winner CAS, stale ETag rejection after an intervening write, and sequence-0 to
   sequence-1 behavior with same-key pacing;
4. observed HTTP status/provider-code shapes and non-empty ETag roundtrip through the shared
   observation/write kernel. Record when a code such as 409 was not observed; do not require every
   possible error to occur. Unknown errors stay errors, not invented conflicts. Missing success
   validators or inability to distinguish rejection from throttling leave acceptance unresolved;
5. complete HEAD/GET visibility and exact bytes plus representation metadata after successful
   writes; CAS body/validator must originate in one GET even when HEAD is separately probed;
6. key/metadata encoding roundtrip for spaces, percent, question/hash characters, and Unicode in
   admitted keys, without publishing the signed request;
7. cleanup limited to known harness-owned keys after requests are settled sufficiently to clean
   safely. If a request may still create later, retain/report uncertain residue rather than assert
   cleanup. Never delete by sweeping a caller-supplied prefix.

Simulated lost responses and delayed server completion belong in deterministic tests. They prove
conservative reconciliation logic only, never provider response-loss timing. No negative read or
local deadline proves that an earlier ambiguous request cannot commit. Preserve `unknown`.

The durable report records the exact code/client version, redacted target identity, case and request
counts, payload limits, response classifications, ETag roundtrip, complete byte/metadata readback,
and cleanup or uncertain residue. Separate documented facts, live observations, and remaining
assumptions. Conclude supported-for-the-tested-protocol, contradicted, or inconclusive, with
concrete reasons. A supported result is bounded empirical evidence, not a universal linearizability
theorem or a new provider guarantee.

A supported result supplies the next driver item's acceptance evidence. Contradictory or
inconclusive evidence prevents production exposure of the conditional API; it does not retroactively
make preparing the harness invalid. Diagnose the named missing case rather than restarting generic
review or requiring a support ticket. Keep exploratory notes here in the working conversation;
record only durable findings and their protocol consequences in this plan.

The harness must not print credentials or signed request material. It must fail closed when required
inputs are absent and must not be included in ordinary package/root CI. Do not substitute
unconditional writes, metadata locks, TTL leases, or a last-writer-wins fallback when a required
conditional behavior fails.

## Commit contracts

### `test(driver-cloudflare): add an opt-in conditional R2 settlement proof`

This is the next implementation item; documentary atomicity proof is not a prerequisite.

- add `code/sys.driver/driver-cloudflare/-scripts/test.r2.conditional.ts`;
- add an explicit non-default `test:r2-conditional` task with a dedicated least-authority Deno
  permission profile, never `dev` or `-A`: only named proof environment variables, the exact
  authorized R2 host, and an explicitly selected credential file when used. No blanket
  read/write/run/FFI/sys permission or ambient configuration discovery;
- retain the explicit environment-input lane: `R2_TEST_ACCOUNT_ID`, `R2_TEST_BUCKET`,
  `R2_TEST_PREFIX`, `R2_TEST_ACCESS_KEY_ID`, `R2_TEST_SECRET_ACCESS_KEY`, and optional
  `R2_TEST_SESSION_TOKEN`;
- also support an explicit `--credentials-file` lane for the existing repo-root `.env`, with a read
  grant to that exact file only. Load through canonical filesystem/dotenv helpers, select only
  `SYS_TEST_R2_ACCESS_KEY_ID` and `SYS_TEST_R2_SECRET_ACCESS_KEY`, and reject mixed credential
  sources. Do not search upward, export dotenv into the process, print secret values, or copy them
  into source, plans, reports, or commands. Target account/bucket/prefix remain explicit inputs;
- `--dry-run` must print the synthetic experiment/key plan and conservative request/byte budgets
  without reading credentials or making network calls. Resolve fixed per-case and aggregate bounds
  during harness implementation, including retry, verification, and exact-key cleanup costs;
- execution must enforce those budgets without extending them after throttling. A scheduling
  deadline stops new work, not an already-issued fetch; do not promise a provider completion
  deadline;
- the exact host grant is supplied at the authorized launch, not a wildcard R2 domain. Use a narrow
  explicit launch if task/profile composition cannot express the grant; never broaden permissions;
- place the signed PUT/observation kernel under the driver's production source tree and make the
  harness import it. The later public method must reuse the same validation, headers, ETag handling,
  and classification unchanged; do not maintain a second harness-only implementation;
- use the pinned `makeRequest` mechanism, not typed `putObject` metadata or a speculative dependency
  upgrade. Any change to the proven request kernel requires renewed deterministic and live proof;
- use a caller-supplied unique prefix and deterministic harness-owned key set;
- implement the rate-aware create/CAS rounds, coherent ETag reuse, byte/metadata readback, and
  rejection/throttle evidence specified under live research acceptance;
- clean only known harness-owned keys after successful/failed runs where cleanup itself is safe;
- return/report partial cleanup truth rather than masking the primary proof failure;
- add deterministic tests for headers, exact encoding/limits, coherent GET, conflict/throttle
  parsing, lost responses, and requests that complete after an early old-parent reread, without
  network access. Exercise the shared kernel with fake authority, not real credentials.

The commit does not export a production API, change R2 Files, run against Cloudflare, or add
secrets. The script is inert unless a human later authorizes and configures its task.

Package proof:

```text
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-cloudflare
deno task check
deno task test
```

The no-network, no-credential dry run is local preparation. Actual credentialed experiments require
the bounded remote authorization above; building and testing the inert harness does not.

### `feat(driver-cloudflare): expose conditional R2 object writes`

After the authorized research records a supported result against the live acceptance criteria:

- expose `R2.Bucket.writeConditional`, coherent `readObserved`, and matching transport methods over
  the already-proven shared kernel; the public facade is inert until explicitly called;
- admit UTF-8-bounded rootless keys, bounded complete bytes/text, proven conditions, and bounded
  metadata through the driver validation boundary;
- use one signed single PUT with exact proven headers; no hidden retry;
- map proven conditional rejection to `{ kind: 'conflict' }` and explicit 429 to
  `{ kind: 'throttled' }`, never treating unknown 409/5xx/network failures as either;
- return `{ kind: 'written', etag, version? }` only with a usable ETag;
- preserve provider error details internally while keeping credentials and raw responses private;
- keep ETag quoting/normalization private to the transport;
- reject stream/multipart inputs and unsupported sizes before dispatch;
- do not add a signal unless the actual fetch observes it;
- freeze the composed R2 namespace and bucket handle under existing namespace policy.

Deterministic tests cover:

- absent and matching-ETag headers;
- exact signed-request options at the injected transport seam;
- written/conflict/throttled result branches and delegation through the exact proven kernel;
- stale rejection versus throttling and ambiguous/non-conflict errors;
- missing/malformed ETag and interleaving GET/HEAD regression: never combine separate observations;
- input cloning, UTF-8 key/metadata admission, and representation preservation;
- unsupported stream/oversize behavior, including non-ASCII keys at the byte boundary;
- no Files capability or handler-map change.

Also prove that bounded bucket listing used by publication bounds actual pinned-client page
requests, not just yielded objects. Empty/non-progressing continuation and record/key admission must
not evade a finite caller policy. Add only the narrow driver transport support needed if the current
iterator cannot enforce it; keep ordinary unlimited bucket behavior unchanged when not using that
explicit bounded operation. This is not the independent Files index hardening, and neither requires
the other's completion. Reuse an already-landed bounded transport seam if present.

Package proof:

```text
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-cloudflare
deno task check
deno task test
```

### `feat(tools): publish exact verified R2 Dist generations`

Add a package-internal generation publisher beside `provider.r2/u.push.ts`. Do not switch the public
R2 push path until activation is complete in the next commit.

Implementation:

- reuse the existing frozen `DIST_VERIFY_LIMITS` and `verifyStagedDist` publication authority;
- run fresh strict local verification at independent push time and derive immutable evidence;
- admit the complete exact-Dist source authority and compare the retained pin/package before any
  provider call; prove the selected root is neither restaged nor silently replaced;
- parse exact part hash/size authority;
- read manifest and parts through `Pkg.Dist.Pinned.readPart`;
- preflight all Dist bodies, complete keys, metadata, fixed record sizes, and sequence headroom
  before any remote mutation;
- admit/initialize sequence-0 control with bounded emptiness checks and retain the coherent parent
  in test-owned/runtime composition before content work;
- establish the immutable V1 representation table, exact record encoders, and literal fixtures;
- GET-first reuse or create-only write content with finite operation and byte-budget concurrency;
- perform bounded GET/SHA-256/metadata verification and target-generation exact key-set listing,
  using the driver-proven page/request bounds and explicit exhaustion/overflow evidence;
- GET-first reuse or create-only write and verify deterministic `commit.json`;
- implement the finite rate-aware original-condition retry policy with injected clock/wait effects;
- return committed-generation evidence and full read/write statistics;
- stop scheduling after failure, quiesce started work, and preserve committed/residue truth;
- never call Files write/remove/list for protocol-owned objects;
- never overwrite, prune, or repair mismatching bytes.

Tests use an injected deterministic R2 state machine for local mutation/aliased root, remote byte
and metadata tamper, extra keys, limit overflow, same-generation races, 429 retries/exhaustion,
bounded work/allocation, readback failure, exact record bytes, and incomplete-residue repair.
Include an internally valid substituted candidate, wrong expected package, and mutated expectation
input; all must preserve the originally selected authority and fail before provider calls when
mismatched.

The public CLI/provider behavior remains the existing flat publisher until the next commit wires the
complete activation protocol. No half-protocol is exposed.

Package proof:

```text
cd /Users/phil/code/org.sys/sys/code/sys.tools
deno task check
deno task test
```

### `feat(tools): activate R2 Dist generations with guarded settlement`

Wire the complete protocol atomically at the R2 provider boundary:

- require `publication: dist-generation-v1` in R2 provider config/types/schema/fixtures/guidance;
- require a fresh admitted prefix and initialize exact sequence-0 `current.json` create-only;
- reject legacy/mixed/damaged layouts;
- remove all three push-path `Pkg.Dist.load` calls; verify first and derive display/reporting from
  the retained evidence on independent and interactive paths;
- wire the complete exact-Dist input through public, endpoint, target, and provider paths; refuse
  any staging action for that input before it can transform the selected root. Prove push-only
  publication with an independently retained product pin/package, not only provider-unit fixtures;
- wire both complete `until` propagation chains and preserve post-dispatch settlement independently;
- call the committed-generation publisher retaining its original parent, then verify the full target
  generation/receipt immediately before activation;
- perform one logical ETag-CAS update to sequence `n + 1`; only explicit throttling permits bounded
  same-condition/same-bytes redispatch, never a fresh parent after uploads;
- reconcile rejection, throttling, cancellation, and ambiguity using the authoritative settlement
  table, including old-parent-after-loss remaining unknown;
- preserve typed active/unchanged/conflict/throttled/cancelled/unknown results through every public,
  endpoint, and spinner boundary instead of generic error collapse;
- redefine `--force` without any overwrite/CAS bypass;
- generate only segment-encoded generation-qualified URLs, with exposure unverified until its
  separate proof; stop printing the bare readOrigin as a successful content URL;
- remove the flat asset-write, `dist.json`-last, remote-manifest skip, and stale-prune production
  path;
- update minimal authoritative Deploy help in this same switch: required discriminator, fresh
  namespace/lifecycle admission, `--force`, typed settlement, and new URL semantics;
- preserve ordinary R2 probe/credentials behavior and fail-closed unknown-provider handling.

The commit must not temporarily report success for a committed-but-inactive generation. It must not
retain a hidden legacy mode or compatibility fallback.

Tests cover schema rejection by old/new shapes, empty-prefix initialization, concurrent
initialization, first activation, unchanged repeat, competing activation, rollback sequence, pointer
ABA, sequence exhaustion before upload, malformed/noncanonical control, coherent GET validators,
late parent selection, pointer readback mismatch, cancellation propagation, 429 then stale retry,
late completion after an early old-parent reread, and exact typed reporting. Essential failure proof
belongs here, not only in the later capstone.

Package proof:

```text
cd /Users/phil/code/org.sys/sys/code/sys.tools
deno task check
deno task test
```

### `test(tools): prove R2 generation publication failure worlds`

Add one capstone deterministic suite rooted at the public R2 provider boundary. It must prove:

- first publication;
- unchanged repeat with zero PUT dispatches and complete byte/metadata/key-set reverification;
- same-generation publisher race;
- different-generation publisher race;
- delayed stale writer;
- crash/failure at every content, readback, receipt, pointer dispatch, and pointer readback
  boundary;
- exact product Dist handoff through the public push-only entry without stage, build, manifest,
  package, or HTML changes; all emitted generation identity comes from the retained candidate;
- valid candidate substitution before invocation, wrong package, mutable source-authority inputs,
  and local mutation after verification; no automatic repinning or restaging;
- remote same-size tamper, correct bytes with wrong representation, and undeclared generation keys;
- oversized/truncated/disappearing bodies, UTF-8 key overflow, metadata overflow, and record caps;
- malformed/external control mutation;
- sequence monotonicity and rollback;
- ambiguous activation settlement, old-parent reads before late completion, throttle exhaustion, and
  requests retaining their original validator through every retry;
- legacy/mixed prefix refusal;
- old config rejection;
- no Files/Cmd dependency for conditional conflict truth;
- no generation/control deletion;
- no credential, raw provider response, or local-path leakage;
- generation-qualified URL output and explicit root-absolute URL limitation.

Use deterministic injected effects and bounded schedules, not timers or live Cloudflare. Keep the
separately authorized provider harness out of this suite.

Package and root proof:

```text
cd /Users/phil/code/org.sys/sys/code/sys.tools
deno task check
deno task test
cd /Users/phil/code/org.sys/sys
deno task ci
```

### `docs(deploy): reconcile generation-qualified R2 exposure`

Update authoritative Deploy guidance and plan cross-references after implementation truth exists:

- `code/sys.tools/src/m.help/yaml/dsl.deploy.yaml` uses the exact strict generation publication
  field and fresh-prefix migration guidance;
- R2 examples distinguish bucket, isolated protocol prefix, and optional owned `readOrigin`;
- public URLs show generation-qualified paths;
- docs distinguish current-pointer discovery from independently pinned consumers such as Pi;
- docs explain that direct R2 does not dereference `current.json`;
- docs describe the push-only exact-Dist handoff and why restaging is not unchanged release reuse;
- docs distinguish artifact-download proof from direct public-browser URL/worker/cache proof;
- docs state remote readback cost and retained-generation storage cost;
- docs distinguish ETag, manifest integrity, Dist digest, receipt, and pointer sequence;
- docs remove flat `dist.json`-last atomicity implications and automatic prune expectations;
- preserve the exposure-plan ownership exception and document the implemented storage boundary; keep
  public URLs explicitly unverified until the downstream exposure proof. This documentation commit
  does not wait for that proof or claim it happened;
- the landed verified-preview receipts and shared verifier authority are referenced without
  recreating or reopening the retired preview plan;
- retired Orbiter history remains untouched.

Do not document a Worker/gateway, private access, GC, object lock, signature, or provider capability
that has not landed and been proven.

Final proof:

```text
cd /Users/phil/code/org.sys/sys
deno fmt --check code/sys.driver/driver-cloudflare code/sys.tools code/sys/web
git diff --check
deno task ci
```

## Final proof matrix

| Invariant                      | Deterministic proof                                                                  | Live/source proof                                |
| ------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Local exact generation         | retained pin/package match, no staging, substitution and pinned-read mutation worlds | public same-artifact readback belongs downstream |
| Create-only generation objects | injected one-winner/conflict schedules                                               | authorized absent-write probe                    |
| Remote exact bytes             | bounded readback hash/size tamper worlds                                             | exact GET after winning live writes              |
| Deterministic commit           | byte-for-byte same-generation receipt tests                                          | live create/conflict/readback                    |
| One activation winner          | injected simultaneous ETag-CAS schedule                                              | authorized simultaneous CAS probe                |
| No stale overwrite             | delayed writer schedule                                                              | stale live ETag rejection                        |
| Truthful cancellation          | pre/post-dispatch and response-loss schedules                                        | no abort claim required                          |
| Reader generation binding      | URL and request-graph closure tests                                                  | exposure proof remains separately owned          |
| Migration isolation            | strict schema and mixed-prefix refusal                                               | human-selected fresh prefix before adoption      |
| No unsafe cleanup              | absence of delete paths and residue assertions                                       | no production cleanup performed                  |

## Stop and replan triggers

Stop this arc rather than weakening it if any of these occurs:

- documented caveats or observed conditional histories contradict the required create-only or
  observed-ETag CAS behavior, including incompatible winners or stale overwrite;
- successful conditional PUT does not return/reveal a reusable opaque ETag;
- complete-object visibility cannot be established strongly enough for exact readback settlement;
- required assets exceed a practical proven single-PUT bound and multipart cannot preserve the same
  conditions;
- the new config cannot isolate the generation prefix from legacy flat-writer authority;
- the selected candidate cannot reach publication unchanged through the existing Deploy boundary;
- a named public journey cannot preserve generation-qualified URL closure: stop that downstream
  delivery claim and resolve it in the product/exposure owner, not by weakening storage semantics;
- exact remote readback cost is rejected without another equally strong content-settlement proof;
- implementation requires Files to claim semantics its backings cannot enforce;
- implementing the storage protocol itself would require a gateway, lease, object lock, signing
  system, or GC protocol. A gateway needed only for public access/URL policy remains a separately
  scoped exposure decision, not a new harness prerequisite.

A replan must name the changed invariant and its owner. Do not smuggle fallback semantics into an
existing commit.

## Landing discipline

- The human-requested correction removes the documentary gate and separates remote authorization
  from ordinary research acceptance. Missing documentation must not be reinstated as a reason to
  prevent gathering empirical evidence.
- The next work is the bounded harness, not the generation publisher or public driver API. Retain
  real credential, permission, signing, and remote-operation boundaries without inventing review or
  support prerequisites for local preparation.
- Record research results without claiming provider guarantees or live proof that has not occurred.
  The related exposure ownership correction remains separately attributed plan work.
- Keep each implementation commit independently type-correct and tested.
- The internal generation-publisher commit must not expose a half-complete public push path.
- Do not combine Cloudflare live proof with production deployment or migration.
- Do not stage or commit unrelated worktree changes.
- Git mutation requires a separate explicit human instruction.
- Never bypass signing, provenance, authentication, sandbox, or provider gates.
- If commit signing fails, stop and request a human-owned signing path.
- No checkbox is marked complete until reachable history or explicit gate evidence proves it.
