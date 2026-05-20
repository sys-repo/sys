# Plan: Files live/write capability arc

## Status

The Files live/write/WebSocket arc is complete. Files write/remove exists as a bounded command
surface, memory has native write/remove backing support, live memory watch observes real Files
write/remove mutations, `FilesFs.live(...)` maps real filesystem watch hints into bounded
`Files.Change` events, `Fs.Capability.Files.toLive(Fs)` bridges `@sys/fs` into the structural live
capability consumed by `@sys/model/files/fs`, and both memory and real filesystem live watch hints are
proven over the canonical WebSocket Cmd stream while list/stat/read remain truth.

The important correction from Phase 9 remains that `m.files.memory` is adapter-native. It shares core
Files helpers from `m.files`, but it no longer depends on sibling `m.files.fs` or `@sys/fs` semantics.
The `@sys/fs` bridge stays package-local to fs: it adapts canonical `Fs.watch` into the structural
capability consumed by `@sys/model/files/fs`, without making the model import `@sys/fs`.

## BMIND final code truth

- `Files.Change` events are hints; `list/stat/read` remain truth.
- `FilesFs.live(...)` is readonly truth plus watch hints. It does not gain write/remove authority.
- `@sys/model/files/fs` consumes a structural filesystem capability and does not import `@sys/fs`.
- `@sys/fs` owns the bridge from canonical `Fs.watch` to that structural capability through
  `Fs.Capability.Files.toLive(Fs)`.
- `@sys/server/files` does not import `@sys/fs`; only server tests compose real fs + model + server to
  prove the full path.
- Adapter-private argument aliases such as `CapabilitiesArgs`, `ReadonlyCapabilitiesArgs`,
  `HandlerArgs`, and watch/query runtime args are intentional local implementation types. They name
  normalized intra-module data, keep public types clean, and avoid exporting adapter internals. This is
  not a DRY failure: shared public contracts remain in `t.Files*`, while local aliases stay close to
  the code paths that own their invariants and error domains. Hoist only if the same semantic contract
  becomes a cross-adapter public boundary.

## Absolute path

```text
/Users/phil/code/org.sys/sys/-agent/files-live-write-websocket.plan.md
```

## Completed arc

```text
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

Phase 12 — WebSocket live stream proofs
  [x] a84794909 test(server): prove memory files watch events over websocket
  [x] c5da987b5 test(server): prove real fs files watch events over websocket
```

## Current answer

The original question was:

```text
Can a real local filesystem change fire a Files.Change event through the canonical Files.Cmd event
stream and arrive at a WebSocket Cmd client?
```

Current answer: yes. Memory write/remove mutates through the canonical Files.Cmd surface and live
watch emits bounded `Files.Change` hints from those mutations. Model-side `FilesFs.live(...)` consumes
a structural watch capability and emits bounded `Files.Change` hints from real filesystem events.
`@sys/fs` exposes `Fs.Capability.Files.toLive(Fs)` as the real filesystem bridge, and server tests
prove both memory and real filesystem watch hints arrive over the WebSocket Cmd stream.

Current proven matrix:

```text
Generic Cmd WebSocket streaming events       yes
Files over WebSocket, memory snapshot        yes
Files over HTTP Cmd, static dist snapshot    yes
Files over real FS, direct readonly bridge   yes
Files memory live watch, direct model Cmd    yes
Files write/remove commands                  yes, for model grammar and memory backing
Files real FS live watch, direct model Cmd   yes
Files real FS live watch, @sys/fs bridge     yes
Files watch/change events over WebSocket     yes
```

## Phase 9 result

`FilesMemory.readonly(...)`, `FilesMemory.writable(...)`, and `FilesMemory.live(...)` now form the
memory adapter symmetry:

```text
readonly → kind: 'files/memory:readonly', fidelity: 'snapshot', write/remove/watch: false
writable → kind: 'files/memory:writable', fidelity: 'dynamic', write/remove: true, watch: false
live     → kind: 'files/memory:live',     fidelity: 'live',    write/remove/watch: true
```

It proves:

- `files:write` is whole-file create/replace, not edit/patch/splice authority;
- text and bytes are first-class write payloads in the model;
- memory write/remove updates list/stat/read truth;
- memory write/remove enforces policy before mutating state;
- recursive remove is bounded and emits delete hints deepest-first for descendants;
- live watch emits `Files.Change` hints from real `files:write` and `files:remove` mutations;
- watch subscriber failures do not poison successful mutations;
- invalid and unauthorized watch commands reject before subscribing;
- readonly/static/fs snapshot backings still reject unsupported write/remove/watch commands;
- `m.files.memory` no longer imports or reaches sibling `m.files.fs` or `@sys/fs` runtime semantics.

The public surface remains bounded:

```text
FilesMemory.readonly(...): FilesMemory.Readonly
FilesMemory.writable(...): FilesMemory.Writable
FilesMemory.live(...):     FilesMemory.Live
```

The transitional owner-side live mutation driver has been removed. Consumption remains the canonical
Cmd handler/stream surface; `Files.Change` remains a hint and list/stat/read remain truth.

## Strategic correction

Phase 9 completed the write/remove prerequisite for a live-memory cleanup pass, live real-FS watch,
and WebSocket watch work.

The cleaner destination is now the active architecture:

```text
FilesCmd.write/remove mutate the bounded Files view
watch observes those mutations as hints
list/stat/read remain truth
transport streams carry the same Files.Change hints
```

The Phase 11 `@sys/fs` live bridge, bridge authority proofs, and Phase 12 WebSocket stream proofs are
complete.

## Cmd stream semantics

Current generic Cmd stream semantics:

```text
client.stream(name, payload)
→ host handler runs
→ ctx.emit(event) zero or more times
→ handler returns terminal result
→ stream.done resolves and async iterator ends
```

For live `files:watch`, the terminal result is not a start acknowledgment. It is a terminal result for a
watch that naturally ends. Normal live-watch usage is:

```text
const stream = client.stream(Files.Cmd.Name.watch, payload);
stream.onEvent(...);      // receive Files.Change hints
stream.dispose();         // client-initiated stop
await stream.done.catch;  // CmdError.Cancelled is expected on dispose
```

Rules:

- A live watch handler stays pending until `ctx.signal` aborts or the watcher naturally closes.
- `Files.Cmd.Watch.Result` is terminal, not a subscription-ready ack.
- WebSocket watch clients/tests need no short terminal-result timeout, or a watch-safe timeout strategy.
- Readiness races must be handled deterministically without synthetic change events.
- `Files.Change` remains a real change hint only.

## Write/remove command shape

`FilesCmd.write` is a whole-file create/replace command. It is intentionally not an edit,
patch, diff, splice, or CRDT operation surface.

```ts
await client.send(Files.Cmd.Name.write, {
  kind: 'text',
  path: 'docs/readme.md',
  content: '# Hello\n',
  encoding: 'utf8',
  mediaType: 'text/markdown',
});

await client.send(Files.Cmd.Name.write, {
  kind: 'bytes',
  path: 'images/logo.png',
  content: bytes, // Uint8Array
  mediaType: 'image/png',
});

await client.send(Files.Cmd.Name.remove, { path: 'docs/old.md' });
```

Rules:

- `kind: 'text'` writes a complete text file value.
- `kind: 'bytes'` writes a complete binary file value as `Uint8Array`.
- Bytes are first-class in the model.
- JSON-only Cmd transports are control-plane transports for binary writes; they must not stuff binary
  content into JSON and may reject `kind: 'bytes'` unless represented by an explicit out-of-band ref.
- HTTP projections should use web-native request bodies (`Blob`, `File`, `ReadableStream<Uint8Array>`,
  or raw byte bodies) for binary content.
- WebSocket projections should use binary frames or an explicit out-of-band content-ref protocol.
- Surgical mutation remains future separate authority, e.g. `files:edit` or `files:patch`.

## Target architecture after write/remove

Memory: complete in Phase 9.

```text
FilesMemory.live(...)
→ FilesCmd.write/remove mutate memory state
→ files:watch emits Files.Change hints
→ transitional owner driver removed
```

Real FS:

```text
Fs.Capability.Files.toLive(Fs)
→ FilesFs.live({ fs: cap, root, policy })
→ real filesystem watcher maps host events into bounded Files.Change hints
```

Server/WebSocket:

```text
FilesServer.WebSocket.create({ files: backing })
→ client.stream('files:watch', ...)
→ receives Files.Change over WebSocket Cmd stream
→ client confirms truth through list/stat/read
```

## Phase 11 bridge design record

### TMIND review

Stress-test the bridge against these failure modes:

- Boundary inversion: `@sys/model/files/fs` must still not import `@sys/fs`.
- Authority widening: the bridge exposes readonly truth plus watch only; it does not expose
  write/remove.
- Truth drift: watch events remain hints; `list/stat/read` remain authoritative.
- Lifecycle leaks: aborting `files:watch` disposes the underlying `Fs.watch` watcher.
- Path leakage: errors and events must not expose the host root or outside paths through the Files
  model surface.
- Symlink/scope escapes: event paths must still pass model-side realpath containment.
- Type drift: `Fs.Capability.Files.toLive(Fs)` structurally matches `FilesFs.Capability.Live`.
- Runtime coupling: `@sys/fs` bridge runtime code should avoid runtime imports from `@sys/model`;
  tests may import model surfaces to prove compatibility.

### STIER design landed

Feature slice: `feat(fs): expose live files/fs watch bridge`

1. Added `FsCapability.Files.Live` as a structural type in `code/sys/fs/src/m.Fs.capability/t.ts`.
2. Added `Files.toLive(fs)` beside `Files.toReadonly(fs)`.
3. Implemented by composing `toReadonly(fs)` and adding a frozen watch bridge over `Fs.watch`.
4. Kept the API minimal: no alias garden, no write/remove bridge, no model runtime import.
5. Proved `FilesFs.live({ fs: Fs.Capability.Files.toLive(Fs), ... })`, real filesystem watch hints,
   readonly truth through list/stat/read, `watch: true` with `write/remove: false`, symlink escape
   rejection, and abort cleanup.

## Acceptance criteria

### Files write/remove

Complete for the model/memory lane:

- `FilesCmd.write/remove` exist as bounded command grammar.
- `files:write` accepts complete text and binary values, not edit/patch operations.
- Capabilities and policy include write/remove authority.
- Default policy denies write/remove.
- Memory write/remove mutations update list/stat/read truth.
- Memory write/remove mutations emit live watch hints.
- Errors remain bounded and do not leak host paths.

Still future/non-arc for transport projections:

- JSON-only transports must not inline binary write payloads into JSON; they should reject bytes or use
  an explicit out-of-band reference/projection.

### Live real FS backing

Complete for the model lane:

- `FilesFs.live(...)` exposes watch/fidelity live capabilities.
- Real filesystem events are mapped into bounded root-relative `Files.Change` values.
- Denied/outside-root/symlink escape events are rejected or dropped without leaking host paths.
- Watcher lifetime follows `ctx.signal`.
- `FilesFs.live(...)` remains readonly truth plus watch hints; write/remove remain unsupported.
- `m.files.fs` consumes a structural capability and does not import `@sys/fs`.

Complete for the fs bridge:

- `Fs.Capability.Files.toLive(Fs)` adapts `@sys/fs` readonly + watch surfaces into
  `FilesFs.Capability.Live`.
- Bridge tests prove watch authority without widening write/remove or path authority.

### WebSocket live stream proofs

Complete:

- Memory live backing produces watch events over WebSocket.
- Real FS live backing produces watch events over WebSocket.
- Stream cancellation disposes underlying watchers.
- Runtime graph for `@sys/server/files` still does not import `@sys/fs`.

## Non-goals

- Do not make `files:watch` a truth source for file content.
- Do not add watch support to static or existing readonly snapshot backings.
- Do not force HTTP JSON Cmd to emulate streaming watch.
- Do not stuff binary file content into JSON Cmd payloads.
- Do not overload `files:write` with edit/patch/splice semantics.
- Do not leak `Deno.FsEvent` or host paths into public Files model events.
- Do not let transitional owner mutation drivers become public Files authority.

## Validation anchors

Model package:

```text
cd /Users/phil/code/org.sys/sys/code/sys.model/model
deno fmt --check src/m.files src/m.files.fs src/m.files.memory src/m.files.static src/types.ts
deno task check
deno task test --trace-leaks ./src/m.files/-test ./src/m.files.fs/-test ./src/m.files.memory/-test ./src/m.files.static/-test
deno task dry
```

Fs package:

```text
cd /Users/phil/code/org.sys/sys/code/sys/fs
deno fmt --check deno.json src/m.Fs.capability src/common/t.ts src/types.ts
deno task check
deno task test --trace-leaks ./src/m.Fs.capability/-test
deno task dry
```

Server package:

```text
cd /Users/phil/code/org.sys/sys/code/sys/server
deno fmt --check deno.json src/files src/common/t.ts src/types.ts
deno task check
deno task test --trace-leaks ./src/files/-test
deno task dry
```
