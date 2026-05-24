# Files transport fidelity hardening plan

## Purpose

Capture the completed Files arc and extend it with a Phase 15 plan for the remaining transport-fidelity seams found in the API/types + implementation review.

This is the right follow-on plan for cross-package Files/WebSocket fidelity work. The server-local sample follow-up file is now mostly a completed sample-polish ledger; new cross-cutting documentation and transport TODOs belong here.

## TMIND assessment

The durable Files model/backing work is complete for the Phase 14 goal: bounded static, memory, real-FS, and WebSocket-backed text write/remove flows are present and proven.

The remaining gaps are not another backing-authority seam like the earlier writable `@sys/fs` bridge. They are transport/representation seams:

- JSON Cmd transports do not faithfully round-trip `Uint8Array` payloads used by `files:write` byte bodies.
- HTTP Cmd is unary; `files:watch` is streaming and therefore not a faithful HTTP JSON unary operation.
- `files:watch` has typed cursor input (`since`) and terminal cursors, but current memory/fs live watch implementations do not resume from `since`.
- Binary write is first-class, but dynamic binary read/ref semantics are not yet first-class across memory/fs transports.
- Remote Files errors currently collapse to `CmdError.Remote` string messages, losing machine-readable domain kinds such as `FilesFsError.WriteTooLarge`.

## BMIND re-check evidence

Re-checked the implementation before writing this plan:

- `code/sys.model/model/src/m.files/t.ts`
  - `Write.BytesPayload.content` is `Uint8Array` and explicitly notes it is not a JSON transport shape.
  - `Watch.Payload.since?: Seq` exists.
- `code/sys/event/src/m.cmd/transport/u.from.WebSocket.ts`
  - WebSocket Cmd transport sends envelopes with `Json.stringify` and parses with `Json.safeParse`.
- `code/sys/http/src/http.cmd/t.ts`
  - HTTP Cmd client is `t.Cmd.Client.Unary`.
  - HTTP handler docs state emitted events are intentionally ignored.
- `code/sys.model/model/src/m.files.memory/m.live/u.watch.ts`
  - Watch registers live subscribers and returns terminal cursor, but does not consume `payload.since`.
- `code/sys.model/model/src/m.files.fs/m.live/u.watch.ts`
  - Watch starts host FS watchers and returns terminal cursor, but does not consume `payload.since`.

## BMIND sync — current implementation reality

Fresh pass against current reality:

- `Files.Fs` is the public filesystem-backed runtime shape for consumers importing `@sys/model/files/fs`.
- `WebSocketServer.start(...)` and `FilesServer.WebSocket.start(...)` exist as hosted startup conveniences.
- `WebSocketServer.create(...)` remains the silent caller-owned primitive for embedding, tests, and Cell adapters.
- Direct startup reporting is upstream, renderer-neutral, and sourced from `t.Service.Status`.
- Service URL presentation/ordering is centralized in `@sys/cli` as `Cli.Fmt.Url`.
- Hosted keyboard controls are upstream: `Cli.Keyboard.bind(...)` owns terminal keypress mechanics, and `WebSocketServer.start({ keyboard: true })` / `FilesServer.WebSocket.start({ keyboard: true })` own service quit wiring without sample-local `HttpServer.keyboard(...)` glue.
- Generic WebSocket server internals now live under `code/sys/server/src/m.server.websocket`.
- The Files WebSocket sample serves a real filesystem docs corpus and its own README.
- `Files.Client.local(backing)`, `Files.Client.transport(endpoint)`, and `Files.Client.websocket(url)` return the same Files client handle grammar.
- `Files.Client.websocket(url)` owns raw WebSocket readiness, canonical `Files.Cmd.ns` binding, and client/socket lifecycle.
- Files-specific call-sites should no longer repeat `Cmd.make<FilesCmd...>` plus `Cmd.Transport.fromWebSocket(...)`; generic Cmd/WebSocket tests may still do so because they test the transport primitive.
- Normal consumer/sample reads use `files.readText(path)`; raw Cmd remains available explicitly under `files.cmd`.

BMIND conclusion: the remaining plan should stay focused on fidelity and documentation truth, not re-litigate the completed ergonomics. The most important new follow-on is a docs/help pass so `@sys/server --help`, DSL chapters, and speech acts describe the current API shape rather than the earlier create-only/manual-client era.

## BMIND sync — landed ergonomic sample/client arc

Reality scan after the Files WebSocket sample polish and client commit:

- Files-specific consumers now have canonical client call-sites for local, generic transport, and WebSocket binding: `Files.Client.local(...)`, `Files.Client.transport(...)`, and `Files.Client.websocket(url)`.
- The implementation lives under `code/sys.model/model/src/m.files/m.Client/`:
  - `mod.ts` assembles the public `Client` surface.
  - `m.local.ts` owns `Files.Client.local(...)`.
  - `m.transport.ts` owns `Files.Client.transport(...)`.
  - `m.websocket.ts` owns `Files.Client.websocket(...)`.
  - `u.open.ts`, `u.error.ts`, and `u.socket.ts` isolate open/readiness/error/socket lifecycle concerns.
- The old single-file `m.Client.ts` is gone; no stale imports remain.
- Files server tests and the WebSocket sample use the first-class Files client.
- Draft shell proves the checked-in sample through both local and WebSocket Files clients using `readText(...)`.
- Remaining manual `Cmd.make(...)` plus `Cmd.Transport.fromWebSocket(...)` call-sites are generic WebSocket/Cmd substrate tests or server internals, which is correct.
- `code/sys/server/src/m.cli/-test/-dsl.test.ts` still expects help text mentioning `Cmd.Transport.fromWebSocket`; that is intentionally left to Phase 15.9 rather than smuggled into the client feature commit.
- Touched surfaces were scanned for `ReturnType<typeof ...>`, `Parameters<typeof ...>`, `Awaited<ReturnType<...>>`, `typeof Files.Client.websocket`, and junk `expectTypeOf({} as ...)` assertions; no relevant residue remains.

Landed commits for the client/sample-doc/type-cleanup units:

- [x] `6f37235cd` feat(model): add Files websocket client
- [x] `68da168ce` feat(model): add Files client handle facade with readText
- [x] `914d9fafc` feat(event): add Cmd<T> local transport adapter
- [x] `e247ec973` feat(model): add local Files client binding
- [x] `d26e8bc06` test(server): migrate Files websocket clients to handle.cmd grammar
- [x] `e7ac20129` test(draft.shell): read shell sample through Files client

## Completed sequence

### Phase 1 — WebSocket Cmd transport substrate

- [x] `1b861c1a5` feat(server): add websocket command server type surface
- [x] `277523e69` feat(server): add websocket command server primitive
- [x] `33633db69` test(server): prove websocket Cmd transport contracts
- [x] `f27d6ea03` docs(server): document websocket Cmd transport usage

### Phase 2 — HTTP Cmd transport substrate

- [x] `2078f26fd` feat(http): add Cmd HTTP JSON transport
- [x] `ce6fe5293` test(http): prove Cmd HTTP JSON transport contracts

### Phase 3 — Files model grammar

- [x] `2bf4cdacb` feat(model): add files command grammar
  - Note: type-surface proof landed with the grammar implementation, not as a separate commit.

### Phase 4 — Files model backings (readonly-first)

- [x] `b1401a446` feat(model): add readonly files/fs backing adapter
- [x] `7ebdea61f` test(model): prove readonly files/fs backing safety contracts
- [x] `9db145405` fix(model): throw native files/fs errors
- [x] `8c499aad0` fix(model): harden readonly files authority contracts
- [x] `e29b0b99d` feat(model): add in-memory files backing
- [x] `ccddac1ac` test(model): prove files/fs symlink containment policy
- [x] `e53a724d8` test(add): symlinks

### Phase 5 — Optional `@sys/fs` bridge

- [x] `55124fd4a` fix(model): resolve files/fs listings against canonical root
- [x] `d04b6b268` feat(fs): expose files/fs readonly capability bridge
- [x] `23ad9c4df` test(fs): prove files/fs bridge does not widen Files authority
- [x] `65f044bd3` test(fs): reject directory symlink escapes in files bridge

### Phase 6 — Server facade

- [x] `eb9ef58b9` feat(server): add files websocket service facade
- [x] `2535eabea` test(server): prove files service over websocket

### Phase 7 — Static adapter

- [x] `158156048` refactor(model): share files backing helpers
- [x] `3c1c6ff77` feat(model): add static dist files adapter
- [x] `df7b6f01a` test(model): prove dist files static capability

### Phase 8 — Live memory Files watch

- [x] `9ad52bd9d` feat(model): add live files/memory watch backing
- [x] `02ed724e3` test(model): prove live files/memory watch contracts

### Phase 9 — Files write/remove command surface

- [x] `79d7ebcab` feat(model): add files write/remove command grammar
- [x] `08a07ba1e` test(model): prove files write/remove contracts
- [x] `21bf81945` feat(model): add memory files write/remove backing support
- [x] `defa551ca` test(model): prove memory write/remove live hints
- [x] `defa551ca` refactor(model): remove memory/files dependency on fs adapter
  - Note: the dependency-direction refactor landed with the live-hints proof because removing the transitional live driver and sibling fs adapter dependency is part of making write/remove the real source of memory live changes.

### Phase 10 — Live memory post-write cleanup

- [x] `4736ac186` refactor(model): simplify live files/memory over writable backing
- [x] `64b6737fe` test(model): harden live files/memory write-remove projection contracts
- [x] `4515e8826` refactor(model): tighten files/memory live boundary residue

### Phase 11 — Live real FS Files watch

- [x] `3abc96307` refactor(model): centralize files capability handler overlay
- [x] `71a4baec3` refactor(model): inline files/static namespace export
- [x] `c705ab81e` test(model): align files/fs readonly test names
- [x] `ed1d08abc` feat(model): add live files/fs watch backing
- [x] `f898e23f7` test(model): prove live files/fs watch contracts
- [x] `f3a17201a` test(model): harden live files/fs watch filter proof
- [x] `da5485624` feat(fs): expose live files/fs watch bridge
  - Note: bridge authority proofs landed with the fs bridge implementation.

### Phase 12 — Reserved

- [x] No recorded Phase 12 in this arc.

### Phase 13 — Files authority derivation hardening

- [x] `f97152888` feat(model): add files authority resolver
- [x] `00d0fa05b` refactor(model): derive memory files authority
- [x] `fdcccf2ba` refactor(model): derive fs and static files authority

### Phase 14 — Durable files/fs write-remove backing

- [x] `34f73af0c` refactor(model): namespace files/memory authority axes
- [x] `2688e5ad8` refactor(model): namespace files/fs authority axes
- [x] `675eb6322` feat(model): add files write authority bounds
- [x] `8345d5576` feat(model): add writable files/fs backing
- [x] `8dcdec545` test(model): prove writable files/fs safety contracts
- [x] `65aa971af` fix(model): canonicalize files/fs command watch hints
- [x] `f9fcf2314` feat(fs): expose writable files/fs bridge
- [x] `3fd75ffa8` test(server): prove real fs writes over files websocket
  - Note: `e3596fdee` style(fs): polish copy dir formatting landed as adjacent residue cleanup, not as a durable Files behavior step.

### Phase 14.5 — Files WebSocket sample ergonomics and hosted lifecycle hardening

- [x] `f866fc382` refactor(server): group files server module under m.server.files
  - Moved the Files server facade into the `m.server.files` module boundary before the sample/client ergonomic pass.
- [x] `96cf30d90` feat(server): add files websocket sample
  - Added the bounded `-sample/files.websocket` workspace, real docs corpus, sample task, and behavior test.
- [x] `40b4775e4` refactor(model)!: expose files fs backing as Files.Fs
  - Made filesystem-backed Files usage read as `Files.Fs.Readonly.live(...)` / `Files.Fs.Writable.*` instead of leaking adapter-local runtime names into consumers.
- [x] `8f0807357` feat(server): add process lifecycle start for websocket services
  - Added hosted process lifecycle support and the `FilesServer.WebSocket.start(...)` facade path used by standalone samples.
- [x] `525acda1d` feat(cli): add service URL formatting helpers
  - Centralized service URL ordering/rendering in `Cli.Fmt.Url` for server and Cell startup/status output.
- [x] `f37ff066e` feat(server): add hosted websocket service startup
  - Added direct startup reporting from `t.Service.Status`, including `silent` support and upstream table rendering.
- [x] `9a290f0f4` refactor(server): align websocket module folder naming
  - Moved generic WebSocket implementation files under `src/m.server.websocket` while keeping the public import stable.
- [x] `0c05c9e66` refactor(server): inline files facade module
  - Folded the extra Files facade module into the `m.server.files` public module.
- [x] `da4d1ff7d` Update mod.ts
  - Minor follow-up cleanup to the inline Files facade export shape.
- [x] `6f37235cd` feat(model): add Files websocket client
  - Added `Files.Client.websocket(url)`, migrated Files-specific consumers away from manual raw WebSocket/Cmd transport wiring, polished the sample README, and removed type-test/alias residue exposed by the review.
- [x] `5715d25ce` feat(cli): add keyboard binding helper
  - Centralized terminal detection, quit-key semantics, keypress loop lifecycle, and unavailable-keyboard error handling under `Cli.Keyboard.bind(...)`.
- [x] `2d0fe866f` refactor(http): use CLI keyboard binding helper
  - Kept HTTP-specific open-browser behavior local while removing duplicate keyboard loop mechanics.
- [x] `90324e825` feat(server): add keyboard controls to websocket start
  - Added hosted keyboard quit controls to `WebSocketServer.start(...)` and `FilesServer.WebSocket.start(...)`, removed sample-local `HttpServer.keyboard(...)` wiring, and kept `create(...)` side-effect free.
- [x] `7a131e2d6` refactor(server): namespace websocket keyboard types
  - Completed the server-local polish by moving flat keyboard option aliases under `WebSocketServer.Keyboard.Options` / `WebSocketServer.Keyboard.Input`.

### Phase 14.6 — Files local client facade and static seam hardening

- [x] `68da168ce` feat(model): add Files client handle facade with readText
  - Added the humane Files client handle grammar and kept raw Cmd under `files.cmd`.
- [x] `914d9fafc` feat(event): add Cmd<T> local transport adapter
  - Promoted reusable in-process Cmd local transport infrastructure.
- [x] `e247ec973` feat(model): add local Files client binding
  - Added `Files.Client.local(backing)` over the production Cmd local transport.
- [x] `d26e8bc06` test(server): migrate Files websocket clients to handle.cmd grammar
  - Migrated server raw Cmd proofs to the explicit `client.cmd.send(...)` / `client.cmd.stream(...)` escape hatch.
- [x] `e7ac20129` test(draft.shell): read shell sample through Files client
  - Proved the draft shell sample through local and WebSocket Files client `readText(...)`.
- [x] `06ea48f41` feat(model): confine DistPkg Files coupling to static seam
  - Added type-seam docs and a production source-boundary test so `DistPkg` can enter Files only through the static adapter seam.

## Phase 15 — Files transport fidelity hardening

### 15.1 — Decide and document JSON-safe Files binary wire representation

- [ ] Decide whether byte payload preservation belongs in generic Cmd JSON transport or a Files-specific JSON codec.
- [ ] Preserve model boundary: `FilesCmd.Write.BytesPayload.content` may remain `Uint8Array`; JSON transport shape must be explicit and lossless.
- [ ] Add docs/comments that distinguish in-process command payloads from JSON-wire payloads.

### 15.2 — Prove and implement byte write over WebSocket Cmd

- [ ] Add a failing WebSocket Files test showing `kind: 'bytes'` does not currently arrive as `Uint8Array`.
- [ ] Implement the chosen JSON-safe byte encode/decode seam.
- [ ] Prove `files:write` byte content over WebSocket mutates real FS truth exactly.
- [ ] Prove command-origin hints and backing-watch hints still remain source-distinct.

### 15.3 — Prove and implement byte write over HTTP Cmd

- [ ] Add a focused HTTP Cmd + Files writable backing proof for byte writes.
- [ ] Ensure HTTP JSON round-trips byte payloads without widening Files authority.
- [ ] Keep static dist HTTP proof intact.

### 15.4 — Make HTTP Files watch semantics explicit

- [ ] Decide whether HTTP Cmd should reject streaming commands generically, or whether Files-over-HTTP needs a transport-adjusted facade/client.
- [ ] Ensure unary HTTP Files capabilities do not misleadingly advertise usable `watch` over the unary transport, or document that raw backing capabilities are not transport capabilities.
- [ ] Add tests for `files:watch` over HTTP behavior: explicit rejection, timeout-safe cancellation, or a streaming transport replacement.

### 15.5 — Resolve watch cursor/resume semantics

- [ ] Decide whether `Watch.Payload.since` is unsupported, best-effort, or backed by an event log.
- [ ] If unsupported, reject non-empty `since` consistently in memory and fs live backings.
- [ ] If supported, add bounded replay/log semantics and prove resumed watchers receive the expected hints.
- [ ] Document that watch events remain hints and clients must verify truth through `list/stat/read`.

### 15.6 — Tighten dynamic binary read semantics

- [ ] Decide whether dynamic backings expose binary reads as refs, add a byte read result, or explicitly reject non-text reads.
- [ ] Ensure binary write followed by read has predictable behavior for memory and fs backings.
- [ ] Avoid normalizing binary decode failures into misleading not-found/path-absence errors.
- [ ] Add tests for text, invalid UTF-8/binary, and max-read behavior.

### 15.7 — Preserve structured Files errors over remote Cmd transports

- [ ] Extend Cmd remote error envelopes or add a structured error payload convention without breaking existing string-error clients.
- [ ] Preserve domain error kind/name and safe message for Files failures.
- [ ] Prove remote clients can distinguish `PolicyDenied`, `NotFound`, `WriteTooLarge`, and transport-level `CmdError.Remote`.

### 15.8 — Boundary and regression validation

- [ ] Keep `m.files.fs` structural/model-only with no runtime `@sys/fs` import.
- [ ] Keep `@sys/fs` bridge runtime free of runtime `@sys/model` imports.
- [ ] Keep static, memory, fs, http, server, and event package boundary tests green.
- [ ] Run focused transport-fidelity tests before broader affected-package validation.

### 15.9 — Server DSL/help and speech-act reality pass

Status: completed.

Landed in:

- [x] `4d6f177e8` docs(server): update DSL for hosted Files websocket reality

- [x] Re-read `code/sys/server/src/m.help/yaml/*` against the current server/model reality.
- [x] Update `@sys/server --help`, DSL chapters, and skill projections so speech acts include hosted startup (`WebSocketServer.start(...)`, `FilesServer.WebSocket.start(...)`), process lifecycle, startup reporting, and the `silent` option where appropriate.
- [x] Update examples/speech acts that still imply `WebSocketServer.create(...)` is the only constructor; keep `create(...)` documented as the silent caller-owned primitive.
- [x] Reflect current folder/module reality: generic WebSocket internals live under `src/m.server.websocket`, while the public import remains `@sys/server/websocket`.
- [x] Keep the generic WebSocket DSL honest: it owns transport hosting, upgrade admission, lifecycle, and service status; it does not own Files grammar or a generic app client SDK.
- [x] Add or update Files-specific help/docs where needed so `Files.Client.websocket(url)` is the canonical Files client call-site instead of manual `Cmd.make<FilesCmd...>` plus `Cmd.Transport.fromWebSocket(...)` wiring.
- [x] Ensure speech acts distinguish generic Cmd-over-WebSocket usage from Files-over-WebSocket usage.
- [x] Update help tests if current text assertions or bundled YAML outputs lag the new speech acts.
