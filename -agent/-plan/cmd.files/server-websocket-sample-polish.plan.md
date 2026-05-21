# Files WebSocket sample polish plan

## Completed polish ledger

1. Standardize service startup reporting upstream. ✅
   - Landed in:
     - `f37ff066e` feat(server): add hosted websocket service startup
     - `525acda1d` feat(cli): add service URL formatting helpers
     - `9a290f0f4` refactor(server): align websocket module folder naming
   - `WebSocketServer.start(...)` renders direct-startup output from `t.Service.Status` unless `silent` is set.
   - `FilesServer.WebSocket.start(...)` inherits the same reporting surface.
   - `WebSocketServer.create(...)` remains silent, caller-owned, and the principled entry point for `@sys/cell` service adapters.
   - Cell-owned service runners render their own status; if they ever route through `start(...)`, they should pass `silent: true` and `until: args.until`.
   - Direct startup output is now ordered as: `service`, `url`, lifecycle/status/details rows, then `quit` for `lifecycle: 'process'`.
   - The `url` row is intentionally second, immediately under the service name.
   - Rows beneath the root `service` row are indented two characters, including the final `quit` row.
   - Path rows are displayed through `Fs.trimCwd(...)`.
   - Static startup output intentionally suppresses volatile snapshot facts like `connections`; those remain available through `status()` for live/status-aware renderers.
   - Styling is intentionally restrained: service name is highlighted, URLs keep URL-specific coloring, ordinary row values are gray, and only the `quit` row is dim gray.
   - WebSocket utility modules live under `m.server.websocket/u/`.
   - URL presentation/ordering is centralized in `@sys/cli` as `Cli.Fmt.Url`; `m.server.websocket/u/u.fmt.ts` owns only the service table structure.
   - Sample-local detail rows such as `sample` or duplicate `backing` labels are intentionally avoided; common startup output should only contain evergreen service facts from the public status contract.
   - Samples start services; upstream modules own standardized reporting.

2. Signal lifecycle wiring upstream. ✅
   - Landed in:
     - `8f0807357` feat(server): add process lifecycle start for websocket services
   - `WebSocketServer.start({ lifecycle: 'process' })` binds `SIGINT` and `SIGTERM` upstream.
   - Signal listeners are removed when the server finishes or its lifecycle completes/errors.
   - `create(...)` does not install process-global handlers.
   - Keyboard control is a separate hosted startup option owned by `start(...)`; process lifecycle reporting advertises `Ctrl+C`, and keyboard-enabled startup advertises `Ctrl+C or Q` only when terminal binding succeeds.

3. Add a first-class Files WebSocket client. ✅
   - Landed in:
     - `6f37235cd` feat(model): add Files websocket client
   - The sample surfaced an API gap: callers had to assemble `Cmd.make<...>`, `Cmd.Transport.fromWebSocket(...)`, and raw `WebSocket` readiness manually.
   - That was not a sample pattern to repeat.
   - The pure ownership location is `@sys/model/files`, because Files owns the Cmd grammar; `@sys/server` only hosts it.
   - Public call-site: `const client = await Files.Client.websocket(url)`.
   - `Files.Client.websocket(...)` opens the WebSocket, waits for readiness, binds the canonical `Files.Cmd.ns`, and returns a typed Files Cmd client.
   - The returned handle owns both the typed Files client surface and WebSocket lifecycle: `dispose()` closes the endpoint; `close(...)` disposes and awaits the WebSocket `finished` promise.
   - Appropriate call-sites migrated:
     - sample test: start task → connect `Files.Client.websocket(D.url)` → read files → `client.close(...)`.
     - Files server contract fixture: remote Files clients use the same public client API.
   - Low-level generic Cmd/WebSocket tests intentionally remain manual because they test the transport primitive itself, not the Files API.

4. Add hosted WebSocket keyboard controls. ✅
   - Landed in:
     - `5715d25ce` feat(cli): add keyboard binding helper
     - `2d0fe866f` refactor(http): use CLI keyboard binding helper
     - `90324e825` feat(server): add keyboard controls to websocket start
   - The sample exposed another hosted-startup seam: keyboard quit wiring was manually composed with `HttpServer.keyboard(...)` after `FilesServer.WebSocket.start(...)`.
   - The correct ownership boundary is `WebSocketServer.start(...)`, not `create(...)` and not the sample.
   - Public call-site: `WebSocketServer.start({ keyboard: true })` and inherited `FilesServer.WebSocket.start({ keyboard: true })`.
   - `create(...)` remains silent, embeddable, and free of terminal/process side effects.
   - `Cli.Keyboard.bind(...)` owns terminal detection, keypress loop, quit-key semantics, unavailable-keyboard error filtering, disposal, and `finished` lifecycle.
   - `HttpServer.keyboard(...)` now delegates to `Cli.Keyboard.bind(...)` and keeps only HTTP-specific `O` open-browser behavior.
   - `WebSocketServer.KeyboardOptions` intentionally projects the upstream CLI keyboard binding contract rather than redeclaring fields:
     - current shape: `Pick<t.CliKeyboardBindOptions, 'exit'>`.
   - `WebSocketServer.start(...)` strips hosted-only fields before calling `create(...)`, so `create(...)` receives only caller-owned create options.
   - Startup reporting renders quit controls from actual hosted lifecycle options and bound keyboard state:
     - process only: `Ctrl+C`
     - keyboard bound: `Ctrl+C or Q`
     - neither: no `quit` row
   - Follow-on polish: factor keyboard-related server types into a dedicated namespace so the public shape reads less flat, e.g. `WebSocketServer.Keyboard.Options` / `WebSocketServer.Keyboard.Input`, while still projecting the upstream CLI option contract rather than duplicating it.

## Remaining not-done / follow-on index

### Server-local sample/API polish

1. [ ] Factor keyboard-related server types into a dedicated namespace, e.g. `WebSocketServer.Keyboard.Options` / `WebSocketServer.Keyboard.Input`, while still projecting from the upstream CLI option contract.

### Root transport fidelity plan

2. [ ] Decide/document JSON-safe representation for Files byte payloads over JSON transports.
3. [ ] Prove and implement byte writes over WebSocket Cmd.
4. [ ] Prove and implement byte writes over HTTP Cmd.
5. [ ] Make HTTP Files `watch` semantics explicit for unary transport.
6. [ ] Resolve `Watch.Payload.since` cursor/resume semantics.
7. [ ] Tighten dynamic binary read behavior for memory/fs backings.
8. [ ] Preserve structured Files domain errors over remote Cmd transports.
9. [ ] Run/maintain boundary and regression validation across model/fs/http/server/event.
10. [ ] Update server DSL/help/speech acts to match hosted startup and `Files.Client.websocket(...)`.

### Root static-dist seam plan

11. [ ] Add FilesManifest vs DistPkg seam notes/JSDoc.
12. [ ] Add a production source-boundary test forbidding dist coupling outside the static seam.
13. [ ] Keep/sharpen existing graph-boundary tests.
14. [ ] Optionally narrow the model common helper pool only if seam tests prove friction.
15. [ ] Add canon/truth note after the seam test proves the invariant.
16. [ ] Do not brand `FilesManifest` / `DistPkg` unless their shapes converge enough to create real assignment risk.

### Suggested clean isolated next task

17. [ ] Knock off static-dist seam hardening steps 11–12 together as one small boundary commit: seam JSDoc plus a production source-boundary test for `DistPkg` / `Pkg.Dist` coupling outside `m.files.static`.
