Phase 1 — WebSocket Cmd transport substrate
  [x] 1b861c1a5 feat(server): add websocket command server type surface
  [x] 277523e69 feat(server): add websocket command server primitive
  [x] 33633db69 test(server): prove websocket Cmd transport contracts
  [x] f27d6ea03 docs(server): document websocket Cmd transport usage

Phase 2 — HTTP Cmd transport substrate
  [x] 2078f26fd feat(http): add Cmd HTTP JSON transport
  [x] ce6fe5293 test(http): prove Cmd HTTP JSON transport contracts

Phase 3 — Files model grammar
  [x] 2bf4cdacb feat(model): add files command grammar
      Note: type-surface proof landed with the grammar implementation, not as a separate commit.

Phase 4 — Files model backings (readonly-first)
  [x] b1401a446 feat(model): add readonly files/fs backing adapter
  [x] 7ebdea61f test(model): prove readonly files/fs backing safety contracts
  [x] 9db145405 fix(model): throw native files/fs errors
  [x] 8c499aad0 fix(model): harden readonly files authority contracts
  [x] e29b0b99d feat(model): add in-memory files backing
  [x] ccddac1ac test(model): prove files/fs symlink containment policy
  [x] e53a724d8 test(add): symlinks

Phase 5 — Optional @sys/fs bridge
  [x] 55124fd4a fix(model): resolve files/fs listings against canonical root
  [x] d04b6b268 feat(fs): expose files/fs readonly capability bridge
  [x] 23ad9c4df test(fs): prove files/fs bridge does not widen Files authority
  [x] 65f044bd3 test(fs): reject directory symlink escapes in files bridge

Phase 6 — Server facade
  [x] eb9ef58b9 feat(server): add files websocket service facade
  [x] 2535eabea test(server): prove files service over websocket

Phase 7 — Static adapter
  [x] 158156048 refactor(model): share files backing helpers
  [x] 3c1c6ff77 feat(model): add static dist files adapter
  [x] df7b6f01a test(model): prove dist files static capability

Phase 8 — Live memory Files watch
  [x] 9ad52bd9d feat(model): add live files/memory watch backing
  [x] 02ed724e3 test(model): prove live files/memory watch contracts

Phase 9 — Files write/remove command surface
  [x] 79d7ebcab feat(model): add files write/remove command grammar
  [x] 08a07ba1e test(model): prove files write/remove contracts
  [x] 21bf81945 feat(model): add memory files write/remove backing support
  [x] defa551ca test(model): prove memory write/remove live hints
  [x] defa551ca refactor(model): remove memory/files dependency on fs adapter
      Note: the dependency-direction refactor landed with the live-hints proof because removing the
      transitional live driver and sibling fs adapter dependency is part of making write/remove the
      real source of memory live changes.

Phase 10 — Live memory post-write cleanup
  [x] 4736ac186 refactor(model): simplify live files/memory over writable backing
  [x] 64b6737fe test(model): harden live files/memory write-remove projection contracts
  [x] 4515e8826 refactor(model): tighten files/memory live boundary residue

Phase 11 — Live real FS Files watch
  [x] 3abc96307 refactor(model): centralize files capability handler overlay
  [x] 71a4baec3 refactor(model): inline files/static namespace export
  [x] c705ab81e test(model): align files/fs readonly test names
  [x] ed1d08abc feat(model): add live files/fs watch backing
  [x] f898e23f7 test(model): prove live files/fs watch contracts
  [x] f3a17201a test(model): harden live files/fs watch filter proof
  [x] da5485624 feat(fs): expose live files/fs watch bridge
      Note: bridge authority proofs landed with the fs bridge implementation.

Phase 12 — Files live watch WebSocket proof and plan closeout
  [x] a84794909 test(server): prove memory files watch events over websocket
  [x] c5da987b5 test(server): prove real fs files watch events over websocket
  [x] eb3f941b0 docs(agent): close files live write websocket arc
  [x] 436fa267f docs(agent): retire files live write websocket plan

Phase 13 — Files authority derivation hardening
  [x] f97152888 feat(model): add files authority resolver
  [x] 00d0fa05b refactor(model): derive memory files authority
  [x] fdcccf2ba refactor(model): derive fs and static files authority

Phase 14 — Durable files/fs write-remove backing
  [ ] refactor(model): namespace files/memory authority axes
  [ ] refactor(model): namespace files/fs authority axes
  [ ] feat(model): add writable files/fs backing
  [ ] test(model): prove writable files/fs safety contracts
  [ ] feat(fs): expose writable files/fs bridge
  [ ] test(server): prove real fs writes over files websocket

---

# Durable files/fs write-remove plan

## Status

Planned. This is the next Files arc after authority derivation hardening.

The previous live real-filesystem proof is valid and must stay, but it proved the watch substrate only: mutate the real filesystem out-of-band, observe a watch hint, then verify truth through Files `list/stat/read`.

This phase adds the missing durable mutation path: Files Cmd `files:write` and `files:remove` must mutate the bounded real filesystem backing, and the live/event stream proof must assert the resulting hints alongside durable filesystem truth.

## HARD BMIND + TMIND review synopsis

The miss was narrow because `FilesFs.live(...)` was internally truthful as readonly+watch: a real filesystem can change outside the model, so integration tests could produce real watch events without any Files write authority. That is still a good proof and should not be removed.

The product-level hole is that a filesystem-backed Files model also needs a command-owned mutation path. Memory already proved the logical write/remove surface; durable FS has not yet paid the safety cost.

Adversarial checks:

- `live` is an event-projection axis, not an authority axis.
- `readonly` and `writable` are authority axes.
- Existing FS live tests prove external-watch observation, not command-owned mutation.
- New FS writable tests must prove mutation, bounded containment, policy, and event projection.
- A command-owned FS write/remove must emit its own authoritative command-origin change from the handler; the OS watcher is a backing-watch source, not truth for model-owned mutations.
- Do not keep a mutation-journal reconciliation option as the canonical design; clients reconcile source/correlation at the edge and verify truth through reads.
- Durable writes must have an atomic target-replacement contract; do not inherit in-place truncate/write semantics accidentally.
- Atomic temp artifacts must be invisible to Files policy/list/watch projection by construction.
- Recursive remove is not atomic; after descendant preflight, partial failure must be reported honestly.
- Writable bounded views need ingress byte limits too; `maxReadBytes` alone is not a sufficient authority contract.
- The model-side `m.files.fs` adapter must remain structural and model-only; it must not import `@sys/fs`.
- The `@sys/fs` bridge may adapt real `Fs.write/remove` into structural Files capabilities, but it must not widen model authority beyond resolved `Files.Authority`.
- Static remains readonly; no static write/remove capability is introduced.

## Current code reality to respect

- Files Cmd already has `files:write` / `files:remove`; write/remove results may carry `seq`, but `Files.Change` does not yet carry source/correlation metadata.
- Cmd handler context already carries a request id (`ctx.id`); use it or an explicit Files correlation token as the seed for command-origin changes rather than inventing ambient state.
- OS watcher events cannot prove causality; name them as backing-watch/external-hint source, not as guaranteed external user edits unless suppression is explicitly proven.
- `FilesPolicy` and `Files.Authority` currently resolve `maxReadBytes`; a `maxWriteBytes` ingress bound is new work and must be explicit.
- `@sys/fs` `Fs.write` currently ensures the parent directory then writes via Deno file-write APIs; durable Files write must not depend on that as an atomic replacement contract unless the bridge adds/proves atomic behavior.

## Final STIER/TMIND distillation

The Phase 14 headline remains the six-row spine. The remaining review items are contracts under the durable model/test/server rows, not a new phase shape.

- Source semantics: command-owned FS write/remove emits a direct authoritative command-origin change from the handler, like memory. The watcher emits backing-watch hints for substrate observation. Do not retain a mutation-journal reconciliation path as the canonical design; clients reconcile with source/correlation metadata and truth reads.
- Source naming: do not call backing-watch events guaranteed external edits unless self-origin suppression is explicitly proven. `origin: 'command' | 'fs-watch'` is more truthful than over-claiming `external`.
- Temp artifacts: scratch files used for FS atomic replace must be excluded from Files policy/list/watch visibility by construction.
- Atomicity: atomic write is a model-level Files contract proven per backing: memory by node/reference swap, FS by structural atomic replace or temp-file-plus-rename in the target directory.
- Recursive remove honesty: recursive remove is not atomic. After descendant policy preflight, mutation is best-effort and partial failure must be represented rather than implying transactionality.
- Ingress bounds: `maxWriteBytes` belongs beside `maxReadBytes` as resolved authority/capability metadata. Text payload limits are measured on encoded bytes, not string length, and over-limit payloads reject before mutation.
- Phase spine: keep memory namespace first, then FS namespace, each as a pure behavior-preserving rename proven green before durable FS behavior lands.

## Namespace design direction

Use authority namespaces first, then liveness constructors inside those namespaces.

No aliases. Do not add a root alias garden such as `FilesFs.live = FilesFs.Readonly.live` or `FilesMemory.live = FilesMemory.Writable.live`. Migrate call sites/tests to the explicit namespace shape in the same refactor.

Do not make a root `FilesFs.create(...)` or `FilesMemory.create(...)` capability-inference factory the canonical public API. The structural capability value still comes in through options, but the constructor namespace must declare the Files authority contract at the call site. A generalized factory may exist as internal runtime plumbing only.

Target memory shape first, because memory is the logical/pure backing and already owns the complete write/remove behavior:

```ts
FilesMemory.Readonly.create(...)
FilesMemory.Writable.create(...)
FilesMemory.Writable.live(...)
```

Then mirror the same naming discipline in the filesystem backing:

```ts
FilesFs.Readonly.create(...)
FilesFs.Readonly.live(...)
FilesFs.Writable.create(...)
FilesFs.Writable.live(...)
```

Rationale:

- `Readonly.create` means read/list/stat/manifest with no watch and no mutation.
- `Readonly.live` means readonly truth plus watch hints from an externally mutable substrate.
- `Writable.create` means command-owned write/remove authority with no watch projection.
- `Writable.live` means command-owned write/remove authority plus watch/event projection.

Static should conform to the recognizable authority-axis shape only where relevant:

```ts
FilesStatic.Readonly.fromDist(...)
```

No writable or live static variant is planned.

## Phase 14 implementation order

### 1. Namespace memory first

Refactor memory before FS so the pure in-memory implementation establishes the intended vocabulary without durable filesystem complexity.

Acceptance:

- `FilesMemory.Readonly.create(...)` replaces the old readonly construction call sites.
- `FilesMemory.Writable.create(...)` replaces the old writable construction call sites.
- `FilesMemory.Writable.live(...)` replaces the old live construction call sites.
- No root-level aliases remain in the final public surface.
- Existing memory readonly/writable/live behavior remains unchanged.
- Existing memory write/remove live-hint tests continue to prove command-owned mutation and event projection.
- While touching memory tests, group them by contract (`surface`, `truth/projection`, `authority`, `safety`, `lifecycle`) so Phase 14 review stays legible.

### 2. Namespace FS authority axes

Refactor FS into the same authority-axis vocabulary before adding durable write/remove.

Acceptance:

- `FilesFs.Readonly.create(...)` replaces old readonly construction call sites.
- `FilesFs.Readonly.live(...)` replaces old live construction call sites.
- The existing readonly+watch real-FS tests remain and continue to prove out-of-band filesystem watch observation.
- No root-level aliases remain in the final public surface.
- Carry the same test-grouping cleanup into FS tests during this namespace refactor; leave static/core grouping for their own behavior/API changes.

### 3. Add writable FS model backing

Add structural writable capability support to `m.files.fs` without importing `@sys/fs`.

Expected structural capability additions:

- writable file write support for text and bytes payloads
- atomic target replacement support, or enough primitive operations for the model adapter to implement temp-file-plus-rename in the same parent directory
- temp-artifact naming/placement that keeps atomic-write scratch files outside visible Files policy/list/watch projection
- remove support with recursive option and honest partial-failure reporting
- enough stat/path/realpath support to preserve bounded root containment
- enough write-size information to enforce encoded-byte `maxWriteBytes` before mutation
- optional helper methods only when earned by safety, not convenience

Acceptance:

- `FilesFs.Writable.create(...)` supports `files:write` and `files:remove`.
- `FilesFs.Writable.live(...)` supports `files:write`, `files:remove`, and `files:watch`.
- Writable authority resolves a bounded ingress limit (`maxWriteBytes`) from backing facts and policy using the same strictest-wins posture as reads.
- Watch events include explicit source/correlation semantics: command-owned hints are emitted directly from the handler and correlate with the write/remove result; backing-watch hints remain source-distinct and are not made canonical through a mutation journal.
- Recursive remove failure reporting is honest about partial completion after preflight.
- Handler maps remain total over the full Files Cmd grammar.
- Unsupported commands still reject before path resolution where unsupported.
- Supported commands derive capability and policy gates from one resolved runtime `Files.Authority`.

### 4. Prove writable FS safety contracts

Model tests must cover durable mutation and containment, not only handler presence.

Required proof families:

- write creates a new file under root
- write modifies an existing file under root
- write is atomic at the target path: failures do not expose a partially written target; temp artifacts are cleaned or safely ignored
- atomic write temp artifacts are not visible through list/stat/read/watch policy projection
- write refuses payloads above the effective encoded-byte `maxWriteBytes` before mutation
- write refuses root path and directory targets
- write refuses policy-denied paths before mutation
- write refuses path traversal and symlink escape paths
- write handles text and bytes payloads according to Files Cmd grammar
- remove deletes files under root
- remove refuses root removal
- remove refuses non-recursive non-empty directory removal
- recursive remove preflights descendant policy before mutation
- recursive remove reports partial completion/failure honestly if mutation fails after preflight
- remove refuses policy-denied paths before mutation
- remove refuses path traversal and symlink escape paths
- post-mutation `list/stat/read` reflect durable truth
- live writable FS emits command-origin hints directly from write/remove handlers, backing-watch hints remain source-distinct, temp artifacts are not projected, and clients verify truth via `list/stat/read`

### 5. Add @sys/fs writable bridge

Expose writable Files bridge capability from `@sys/fs`.

Expected shape:

```ts
Fs.Capability.Files.toWritable(Fs)
Fs.Capability.Files.toLiveWritable(Fs)
```

The bridge adapts `@sys/fs` runtime operations into the structural model capability. Tests may import model surfaces; bridge runtime code must avoid runtime imports from `@sys/model`.

Acceptance:

- Bridge tests prove the writable bridge does not widen Files authority by itself.
- Bridge tests prove symlink/path containment remains enforced by the model adapter.
- Existing readonly and live readonly bridges remain valid.

### 6. Prove server/WebSocket durable real-FS writes

Add an end-to-end proof that goes through the Files WebSocket Cmd boundary.

Required proof shape:

```text
client files:write over WebSocket
  → assert Cmd write result
  → assert real filesystem truth changed through @sys/fs read/stat/list
  → assert files:watch command-origin hint arrives
  → assert write result and command-origin watch hint share correlation/seq semantics
  → assert backing-watch hints are source-distinct if they appear
  → assert no temp artifact is projected as a Files change
  → assert Files read/stat/list truth through Cmd

client files:remove over WebSocket
  → assert Cmd remove result
  → assert real filesystem truth changed through @sys/fs read/stat/list
  → assert files:watch command-origin hint arrives
  → assert remove result and command-origin watch hint share correlation/seq semantics
  → assert backing-watch hints are source-distinct if they appear
  → assert Files read/stat/list truth through Cmd
```

The existing out-of-band real-FS watch tests stay. They prove a different contract: external filesystem changes are observed as watch hints.

## Non-goals

- Do not add static write/remove.
- Do not import `@sys/fs` from `m.files.fs` runtime code.
- Do not treat watch events as truth; they remain hints.
- Do not add a mutation journal as the canonical reconciliation path for command-owned writes; emit command-origin hints directly and keep backing-watch hints source-distinct.
- Do not over-claim causality for backing-watch events; clients decide with source/correlation metadata and truth reads.
- Do not depend on `stream.done` as a WebSocket watch startup ack.
- Do not introduce root-level compatibility aliases unless explicitly re-approved.
- Do not introduce root `create(...)` as the main public API; keep generalized factories internal if needed.
- Do not commit this plan or implementation work without explicit human instruction.
