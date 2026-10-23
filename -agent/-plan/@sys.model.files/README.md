# Files plans

This folder is now mostly follow-on planning. The major upstream Files/WebSocket service arc has
landed; remaining work should stay small and avoid re-opening completed seams.

## Current truth

Completed and reusable:

- `Files.Client.local(backing, options?)` exists in `@sys/model/files`.
  - It binds an in-process Files backing through `Cmd.Transport.local(...)`.
  - It returns a Files client handle, not a raw Cmd client.
- `Files.Client.transport(endpoint, options?)` exists and centralizes typed Files Cmd binding.
- `Files.Client.websocket(url, options?)` returns the same Files client handle grammar.
  - Normal consumer/sample call-sites use the humane Files client query/read/watch surface.
  - Raw Cmd remains available explicitly at `client.cmd.send(...)` and `client.cmd.stream(...)`.
- `Files.Client.Handle` exposes a small humane surface over the typed Files Cmd grammar:
  - `client.capabilities()` returns bounded-view capability facts.
  - `client.list(input?)` returns the lightweight catalog query result.
  - `client.stat(path)` returns the `Entry` directly, not `{ entry }`.
  - `client.manifest(input?)` returns the runtime manifest snapshot.
  - `client.manifest({ contentRefs: true })` returns a manifest with a present `contentRefs` array.
  - `client.readText(path, options?)` remains inline-text-only; content refs materialize through
    `Files.ContentRef.bytes/text(...)`.
  - `client.watch(input?)` returns the typed Cmd stream handle; stream disposal owns event
    subscription cleanup.
  - Do not add `write`, `remove`, pagination managers, content prefetching, or Files-specific watch
    lifecycle managers without a fresh capability/API review.
- `Cmd.Transport.local({ factory, handlers, hostOptions? })` exists in production `@sys/event/cmd`.
  - Files local binding uses this shared adapter rather than Files-only `MessageChannel` glue.
- `@sys/server/files/service` exists as `FilesWebSocketService`.
  - Cell composes it through `jsr:@sys/server/files/service`.
  - Config parsing/validation is service-owned and schema-backed.
  - The endpoint uses `FilesServer.WebSocket.create(...)`; Cell owns lifecycle/output.
- `@draft/shell` proves the checked-in sample through the Files client facade.
  - The proof reads the sample through both `Files.Client.local(...).readText(...)` and
    `Files.Client.websocket(...).readText(...)`.
  - The AppShell Files client sample uses `client.capabilities()`, `client.list()`,
    `client.manifest({ contentRefs: true })`, `client.readText(path)`, and `client.watch()`.
  - Server raw WebSocket/Cmd contract tests use `client.cmd.send(...)` / `client.cmd.stream(...)`;
    draft-shell stays on the humane consumer grammar.
- Cell startup output has been trimmed for operator DX.
  - Normal Cell output hides low-signal `config`, URL-redundant `path`/`port`, protocol internals
    (`namespace`, `files.kind`), and startup-noisy `connections`.
  - `files.capabilities` is rendered as `capabilities` with human comma spacing.
  - Loopback URL display is centralized in `@sys/cli` URL formatting (`127.0.0.1` displays as
    `localhost`); raw status/config values remain unchanged.
- Server Files WebSocket status no longer emits redundant `files.fidelity` detail.
- `DistPkg` may enter production Files runtime code only through the static dist seam.
  - `Files.Manifest` is documented as bounded runtime Files-view metadata, not frozen package
    metadata.
  - A source-level seam test now forbids dist/package coupling tokens outside the static adapter
    allowlist.
- `Files.ContentRef.bytes/text` exists in `@sys/model/files`.
  - It resolves Files-domain URL content refs, not arbitrary URLs or generic Fetch requests.
  - It verifies size/hash metadata by default when present.
  - It supports injected fetch, global Web Fetch, `AbortSignal`, and `UntilInput` cancellation.
  - It keeps `Files.Client.readText(...)` inline-only; read-ref materialization remains explicit.
  - The static Files sample now proves the real sequence: read returns a URL content ref, then
    `Files.ContentRef.text(read.contentRef)` materializes the content.

## Active plan index

### `transport-fidelity-hardening.plan.md`

Cross-package fidelity plan; keep it about representation/transport semantics, not completed service
or sample ergonomics.

- [ ] Decide/document JSON-safe representation for Files byte payloads over JSON transports.
- [ ] Prove and implement byte writes over WebSocket Cmd.
- [ ] Prove and implement byte writes over HTTP Cmd.
- [ ] Make HTTP Files `watch` semantics explicit for unary transport.
- [ ] Resolve `Watch.Payload.since` cursor/resume semantics.
- [ ] Tighten dynamic binary read behavior for memory/fs backings.
- [ ] Preserve structured Files domain errors over remote Cmd transports.
- [ ] Run/maintain boundary and regression validation across model/fs/http/server/event.
- [x] Update server DSL/help/speech acts to match hosted startup and `Files.Client.websocket(...)`.

BMIND: remaining work is transport fidelity, not another backing-authority redesign.
