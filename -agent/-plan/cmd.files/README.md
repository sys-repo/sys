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
  - Normal consumer/sample call-sites use `client.readText(path)`.
  - Raw Cmd remains available explicitly at `client.cmd.send(...)` and `client.cmd.stream(...)`.
- `files.readText(path, options?)` is the first and only humane convenience method.
  - Do not add `read`, `stat`, `list`, `write`, `remove`, or `watch` convenience methods without a
    fresh capability/API review.
- `Cmd.Transport.local({ factory, handlers, hostOptions? })` exists in production `@sys/event/cmd`.
  - Files local binding uses this shared adapter rather than Files-only `MessageChannel` glue.
- `@sys/server/files/service` exists as `FilesWebSocketService`.
  - Cell composes it through `jsr:@sys/server/files/service`.
  - Config parsing/validation is service-owned and schema-backed.
  - The endpoint uses `FilesServer.WebSocket.create(...)`; Cell owns lifecycle/output.
- `@draft/shell` proves the checked-in sample through the Files client facade.
  - The proof reads the sample through both `Files.Client.local(...).readText(...)` and
    `Files.Client.websocket(...).readText(...)`.
  - Server raw WebSocket/Cmd contract tests use `client.cmd.send(...)` /
    `client.cmd.stream(...)`; draft-shell stays on the humane consumer grammar.
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

Recently completed and retired plan ledgers:

- Files client local facade rollout:
  - `68da168ce0cb37377e88ada988cc79e53cc0a8a2` — `feat(model): add Files client handle facade with readText`
  - `914d9fafce2cf5ed4d9f61d4bb7e211b34e1df20` — `feat(event): add Cmd<T> local transport adapter`
  - `e247ec9737442e120664a7f8317aae5c83d8e752` — `feat(model): add local Files client binding`
  - `d26e8bc06c35de6d70d653079253b8dbbb867a41` — `test(server): migrate Files websocket clients to handle.cmd grammar`
  - `e7ac2012901d15c7c89cc8e5def5627ff55e89c7` — `test(draft.shell): read shell sample through Files client`
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

