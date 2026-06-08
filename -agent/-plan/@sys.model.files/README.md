# Files plans

BMIND sync: 2026-05-22.

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

Recently completed and retired plan ledgers:

- Files client local facade rollout:
  - `68da168ce0cb37377e88ada988cc79e53cc0a8a2` —
    `feat(model): add Files client handle facade with readText`
  - `914d9fafce2cf5ed4d9f61d4bb7e211b34e1df20` — `feat(event): add Cmd<T> local transport adapter`
  - `e247ec9737442e120664a7f8317aae5c83d8e752` — `feat(model): add local Files client binding`
  - `d26e8bc06c35de6d70d653079253b8dbbb867a41` —
    `test(server): migrate Files websocket clients to handle.cmd grammar`
  - `e7ac2012901d15c7c89cc8e5def5627ff55e89c7` —
    `test(draft.shell): read shell sample through Files client`
  - `9ca6c494e` — `plan(files): add Files client local facade plan`
  - `2a407d631` — `plan(files): retire Files client local facade plan`
- Files WebSocket sample polish rollout:
  - `f37ff066e` — `feat(server): add hosted websocket service startup`
  - `525acda1d` — `feat(cli): add service URL formatting helpers`
  - `9a290f0f4` — `refactor(server): align websocket module folder naming`
  - `8f0807357` — `feat(server): add process lifecycle start for websocket services`
  - `6f37235cd` — `feat(model): add Files websocket client`
  - `5715d25ce` — `feat(cli): add keyboard binding helper`
  - `2d0fe866f` — `refactor(http): use CLI keyboard binding helper`
  - `90324e825` — `feat(server): add keyboard controls to websocket start`
  - `7a131e2d6` — `refactor(server): namespace websocket keyboard types`
- Static DistPkg seam hardening:
  - `06ea48f41` — `feat(model): confine DistPkg Files coupling to static seam`
- Files static sample rollout:
  - `62958485b` — `sample(server): add static Files dist sample`
  - Adds `code/sys/server/-sample/files.static` adjacent to `files.websocket`.
  - Proves generated publication/runtime mode: plain `@sys/http` static server →
    `Pkg.Dist.fetch({ origin })` → `FilesStatic.fromDist({ dist, baseUrl, policy })` →
    `Files.Client.local(...)` → Files manifest/read-ref → plain HTTP asset fetch.
  - Keeps static read semantics honest: static `read` returns URL content refs; it does not use
    `readText(...)` or introduce a content-ref fetch facade.
- Files ContentRef resolver rollout:
  - `8bebdf7b95aa3e23770cd8335e0ec3798c900f02` — `feat(model): add Files ContentRef resolvers`
  - `294f6ae70` — `plan(files): mark ContentRef resolver plan landed`
  - `161ac1c33ee1f4a64792e69215b17078414103bf` — `plan(files): retire ContentRef resolver plan`
  - Adds `Files.ContentRef.bytes(ref, options?)` and `Files.ContentRef.text(ref, options?)`.
  - Resolves URL refs with Files-domain error policy and default size/hash verification.
  - Uses `@sys/crypto/hash`, `@sys/std/error`, `@sys/std/dispose`, and `@sys/std/is` rather than
    ad-hoc helper policy.
  - Updates the static sample to replace ad-hoc asset fetch with explicit Files-domain content-ref
    resolution.

## Active plan index

### `files-client-query-surface.plan.md`

Completed rollout for lifting Files capability/list/stat/manifest/watch onto the humane client handle
while keeping manifest content-ref semantics tight and explicit.

- `65f6658ad` — `refactor(model): rename manifest content refs`
- `382d585bd` — `fix(event): dispose Cmd stream event subscriptions`
- `7d792fdd9` — `feat(model): add Files client query surface`
- `cf86f5ce4` — `refactor(draft-shell): consume Files client query surface`

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
