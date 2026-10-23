@sys.ui.react.files
files-info-panel.status-recovery-events.plan.md
- [ ] feat(ui): add files status recovery event model
- [ ] feat(ui): surface lost-connection status in Files.InfoPanel
- [ ] test(ui): prove files status recovery transitions

## Intent

- Track and display the runtime path from connected → lost connection → recovery.
- Keep `Files.InfoPanel` as a projection of state, not the owner of service lifecycle.
- Model the UX around observable events so later components can compose the same status stream.

## Problem

- Current status display is snapshot-shaped and too coarse for connection recovery.
- A websocket/client can be meaningfully different states:
  - never connected / stopped
  - connecting
  - connected / ready
  - lost connection after prior readiness
  - reconnecting
  - recovered
  - terminal error
- The user needs to see when a previously healthy connection was lost, without confusing that with
  first-load `stopped` or a generic `error`.

## Holding vocabulary

- `connected`: client has reached ready state at least once.
- `lost connection`: connection failed after prior readiness.
- `recovering`: reconnect/retry is in progress after loss.
- `recovered`: ready again after loss.
- `error`: terminal or explicit failure snapshot.

## Refactor seams

- Spec-only connection controller:
  - `ui.InfoPanel/-spec/-u.connect.ts` should emit or derive status events.
  - Do not move websocket lifecycle into `Files.InfoPanel`.
- `Files.InfoPanel.Snapshot`:
  - may need an additional recovery/status detail field if `t.Service.State` is too coarse.
  - keep outputs strict and named; avoid booleans like `wasConnected` unless clearly local.
- `StatusTitle`:
  - should remain a compact status projection.
  - avoid duplicate labels when the row body already carries stronger error detail.
- Event list:
  - keep local in spec/panel for now if needed.
  - promote only after repeated use earns a common renderer.

## Candidate status event shape

```ts
type FilesConnectionEvent =
  | { kind: 'connecting'; at: number }
  | { kind: 'connected'; at: number }
  | { kind: 'lost'; at: number; error?: t.StdError }
  | { kind: 'recovering'; at: number }
  | { kind: 'recovered'; at: number }
  | { kind: 'error'; at: number; error: t.StdError };
```

This is a planning sketch only; confirm against current Files client/service event surfaces before
implementing.

## UI notes

- `lost connection` should be legible and calm, not a full crash state.
- Use error red as a signal/accent, not an all-red paragraph.
- Keep full error detail available through native tooltip until a fuller error renderer exists.
- Recovery should make the timeline understandable: loss happened, reconnect began, ready returned.

## Proof path

- From `code/sys.ui/ui`:
  - `deno task test --trace-leaks ./src/ui.react/ui.files`
  - `deno task check`
- Runtime proof:
  - `deno task dev`
  - connect to sample files service.
  - stop/kill or disconnect the files service.
  - verify lost-connection status appears.
  - restart service or reconnect.
  - verify recovery state returns to ready without stale error UI.

## Non-goals

- No changes to `@sys/model/files` or `@sys/server/files` until their actual event contract demands
  it.
- No hidden reconnect policy inside `Files.InfoPanel`.
- No global event-list primitive in this pass.
- No speculative status taxonomy beyond what current client/runtime events can truthfully support.
