# Plan: Files authority derivation hardening

## Status

Current move: Phase 13 — Files authority derivation hardening is complete.

The Files live/write/WebSocket substrate is landed. The authority hardening step eliminates authority drift by making capabilities, policy checks, max-read reconciliation, and handler gating mechanically derive from one resolved runtime authority value.

## Goal

Introduce a mechanically-derived `Files.Authority` layer in `m.files`:

```text
Policy input + backing facts
→ Authority.resolve(...)
→ capabilities + check + total handler-map gating
```

`Policy` remains the human-authored input. `Authority` is resolved runtime truth.

## BMIND/TMIND decision

Use the contained mechanically-derived path, not `Granted extends Name` static capability generics.

Rationale:

- The actual defect is drift between policy, capabilities, and handler behavior.
- A runtime authority resolver removes that drift without pushing type parameters through server/WebSocket.
- `HandlerMap` stays total over the full Files command grammar; ungranted commands are gated at one chokepoint.
- Server structural `Backing` type stays unchanged.
- Transport remains a wide grammar boundary where clients can ask any Files command and receive canonical denial.
- Full static unrepresentability is elegant inside `m.files` but lossy at the transport seam.

## Current commit sequence

```text
Phase 13 — Files authority derivation hardening
  [x] f97152888 feat(model): add files authority resolver
  [x] 00d0fa05b refactor(model): derive memory files authority
  [x] fdcccf2ba refactor(model): derive fs and static files authority
```

## Arc

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

Phase 13 — Files authority derivation hardening
  [x] f97152888 feat(model): add files authority resolver
  [x] 00d0fa05b refactor(model): derive memory files authority
  [x] fdcccf2ba refactor(model): derive fs and static files authority
```

## Acceptance criteria

- `Files.Authority` is exposed alongside `Files.Cmd`, `Files.Cursor`, and `Files.Policy`.
- Capabilities are projected from resolved authority, not hand-authored per adapter.
- Strictest `maxReadBytes` reconciliation is owned once by authority resolution.
- Handler gating for ungranted commands is centralized.
- `HandlerMap` remains total over `FilesCmd.Name`.
- `Policy` remains stable as authored input.
- Server/WebSocket `Backing` type remains unchanged.
- Existing adapter behavior remains stable: memory writable/live can write/remove; fs live is readonly+watch; static remains read/ref snapshot only.

## Non-goals

- Do not introduce `Granted extends FilesCmd.Name` generic propagation through server/WebSocket.
- Do not make unsupported handlers absent from the total command grammar.
- Do not change public Files policy shape unless a later phase explicitly requires it.
- Do not widen write/remove authority for fs or static adapters.
