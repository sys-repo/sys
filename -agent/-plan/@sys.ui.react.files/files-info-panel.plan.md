# @sys/ui/react/files InfoPanel

## Commit arc

- [x] `bbd7cc1f5` chore(ui): scaffold @sys/ui root package
- [x] `1bcd662ce` refactor(ui): copy files info panel leaf into @sys/ui
- [x] `74a068db3` refactor(ui): nest files info panel under Files namespace
  - Added the focused package-leaf import proof.
- [x] `aa67f44a0` chore(ui): add cell-backed dev rig
- [x] `d13b2ba0e` refactor(shell): consume migrated files UI package
- [x] `029ed6678` refactor(ui): normalize React source lane to ui.react
- [x] `c7d3bdfcd` chore(cell): align ui and draft shell dev ports

Checklist entries are marked complete only where repository history and current runtime/package
reality agree.

## BMIND reality assessment

Status: **LANDED — RETAIN AS ARCHITECTURE ANCHOR.**

The original package-promotion arc is complete, but this plan remains relevant because its namespace
and responsibility decisions still describe the live architecture:

- `@sys/ui` is the higher-order system UI composition package.
- `@sys/ui-components` remains the low-order primitive inventory.
- `@sys/cell` remains the runtime/metamedium composition unit rather than a generic Files UI bucket.
- `@sys/ui/react/files` owns the `Files.InfoPanel` composition leaf.
- Files client/service lifecycle remains outside the panel.
- Draft shell consumes the package leaf rather than owning a private Files UI island.

Current proof against reality:

- Package root exists at `code/sys.ui/ui`.
- `code/sys.ui/ui/deno.json` exports `@sys/ui/react/files`.
- The package root remains intentionally boring and does not barrel-export React UI.
- `src/ui.react/ui.files/-test/-api.test.ts` proves the public `Files.InfoPanel` surface.
- Draft shell imports `Files` directly from `@sys/ui/react/files`.
- The Cell dev rig owns `sys.ui:view` and `sys.ui:files`.
- Canonical local ports are `1234` and `5050`; the earlier proposed `1235`/`5051` values were not
  retained.
- The current source lane is `src/ui.react/ui.files`; the earlier `src/m.react/ui.files` spelling
  was superseded by `029ed6678`.
- No `./react/files/t` export exists. The existing `./react/t` type plane is sufficient until a real
  consumer proves a leaf-type export is needed.

This is no longer an active implementation queue. Active follow-ons live in focused plans for stable
InfoPanel Config switch ordering and status recovery events.

## Essence

- Root package: `@sys/ui` at `code/sys.ui/ui`.
- Public leaf: `@sys/ui/react/files`.
- Anchor noun: `Files.InfoPanel`.
- Visual root: `KeyValue.UI`; buttons are row values.
- No Files model/server ownership in this package leaf.
- AppShell supplies app-specific defaults; the panel stays extraction-clean.

## Namespace decision

- Protect `@sys/cell`: a cell is the runtime/metamedium composition unit, not the generic bucket for
  Files UI.
- Keep `@sys/ui-components` as the low-order primitive inventory: `KeyValue`, `Button`, `Bullet`,
  `TreeView`, `PathView`.
- Use `@sys/ui` as the higher-order system UI composition namespace.
- Use `@sys/ui/react/*` as the React adapter lane over system domains.
- React is a subpath/adapter lane under `@sys/ui`, not the architecture noun.
- `@sys/ui/react/files` may compose Files model contracts, client/service snapshots, and primitive
  UI components, but must not own AppShell policy, cell bootstrapping, or server lifecycle.

## Current package shape

`code/sys.ui/ui/deno.json` exports:

- `.` → package identity and type plane only;
- `./t` and `./types` → package type plane;
- `./react/t` → React type plane;
- `./react/files` → `Files.InfoPanel` runtime surface.

The root `mod.ts` stays boring. React leaves own React imports. A dedicated `./react/files/t` export
remains deferred until a consumer demonstrates that `./react/t` is insufficient.

## Panel boundary

`Files.InfoPanel` owns:

- Files status/snapshot projection;
- metadata, capabilities, error, event, and transport-control rows;
- companion `Files.InfoPanel.Config` composition;
- pure rendering over caller/controller-owned state.

It does not own:

- Files server lifecycle;
- hidden websocket/client construction;
- AppShell defaults or persistence policy;
- Cell service startup;
- generalized event-list or form frameworks.

## Cell-backed dev rig

`@sys/ui` development and serving run through `@sys/cell`.

Services:

- `sys.ui:view` → Vite in dev mode and static serving in default mode;
- `sys.ui:files` → sample Files WebSocket service.

Current endpoints:

- UI: `http://localhost:1234/`;
- Files WebSocket: `ws://localhost:5050/files`;
- Files manifest: `http://localhost:5050/files/manifest`.

The sample Files root is `./-sample/files`. Service lifecycle remains in the rig/spec rather than
the panel.

## Spec and consumer posture

- The generalized spec lives under `src/ui.react/ui.files/ui.InfoPanel/-spec/`.
- Static snapshot fixtures remain deterministic.
- Explicit connection controls target `ws://localhost:5050/files`.
- Connection policy remains spec-owned.
- Draft shell consumes `@sys/ui/react/files` directly; the earlier draft-local `./sys/ui/files`
  wrapper proposal is superseded.

## Proof

From `code/sys.ui/ui`:

```sh
deno task test --trace-leaks ./src/ui.react/ui.files
deno task check
```

Package proof imports `@sys/ui/react/files` and verifies the `Files.InfoPanel` runtime surface.
Runtime proof starts the Cell-backed dev rig and verifies the InfoPanel spec against the canonical
sample Files endpoint.

## Durable non-goals

- No AppShell defaults in `@sys/ui`.
- No changes to Files model/server contracts from this UI leaf.
- No generalized event-list component until repeated use earns it.
- No root `@sys/ui` primitive inventory; primitives remain in `@sys/ui-components`.
- No `./react/files/t` export without a concrete consumer need.
