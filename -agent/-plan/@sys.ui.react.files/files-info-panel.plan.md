# @sys/ui/react/files InfoPanel Plan

- [ ] chore(ui): scaffold @sys/ui package
- [ ] refactor(ui): migrate draft files UI island to @sys/ui
- [ ] test(ui): prove @sys/ui react files export
- [ ] refactor(draft-shell): consume @sys/ui react files

## Essence
- Scaffold a new root package: `@sys/ui` at `code/sys.ui/ui`.
- Migrate the current proving island from `deploy/@draft.shell/src/@sys/ui/` into `@sys/ui`.
- Target public path: `@sys/ui/react/files`.
- Draft-shell becomes a consumer of the new package, not the owner of the island.
- Anchor noun: `Files.InfoPanel`.
- Visual root: `KeyValue.UI`; buttons are row values.
- No changes to `@sys/model/files` or `@sys/server/files`.
- AppShell supplies draft defaults; the panel stays extraction-clean.

## Namespace decision
- Protect `@sys/cell`: a cell is the runtime/metamedium composition unit, not the generic bucket for Files UI.
- Keep `@sys/ui-components` as the low-order primitive inventory: `KeyValue`, `Button`, `Bullet`, `TreeView`, `PathView`.
- Use `@sys/ui` as the higher-order system UI composition namespace.
- Use `@sys/ui/react/*` as the React adapter lane over system domains.
- React is a subpath/adapter lane under `@sys/ui`, not the architecture noun.
- `@sys/ui/react/files` may compose `@sys/model/files`, client/service snapshots, and primitive UI components, but must not own AppShell policy, cell bootstrapping, or server lifecycle.
- Current local module should move by path with minimal rewrite.

## Plan artifact name
- Recommended physical rename now that this is the promotion anchor: `@sys.ui.react.files.plan.md`.

## Migration baseline
- Start with the `@sys/tmpl` package scaffold for `@sys/ui`.
- Scaffold landing target: `code/sys.ui/ui`.
- First commit is scaffold only: package skeleton, workspace registration, generated defaults cleaned only as required by the scaffold gate.
- Second commit migrates the draft-shell `src/@sys/ui` island into `@sys/ui` and wires `@sys/ui/react/files`.
- Preserve behavior byte-for-byte unless the new package boundary requires import-path correction.
- Do not hand-roll a package skeleton.
- Do not let draft-shell defaults, AppShell state, or cell/server lifecycle move into `@sys/ui`.

## Target package shape
- `code/sys.ui/ui/deno.json` exports:
  - `.` → package identity only
  - `./t` and `./types` → package type plane
  - `./react/files` → `Files.InfoPanel` runtime surface
  - `./react/files/t` → Files UI type surface, if the package export model needs leaf type imports
- Root `mod.ts` should stay boring, like `@sys/ui-components`: package identity only.
- Root `types.ts` aggregates public package type surfaces.
- React leaf should own React imports; root package should not become a UI barrel.

## Scaffold gate
- Confirm `@sys/ui` is the right root noun before generation.
- Confirm `code/sys.ui/ui` is the package landing directory.
- Confirm package exports encode higher-order UI composition, not primitive components.
- Confirm `@sys/ui-components` remains the primitive dependency, not the destination.
- Confirm `@sys/cell` remains protected.

## Panel shape
- `:meta:` section: what/where facts, endpoint/root/path, capabilities, and status.
- Client API section: surface the normative `Files.Client` API as actions; start with `readText`.
- Events section: opt-in `Events<T>`/watch stream toggle that updates panel state.
- Optional event-list section: show recent stream events as `1..5..n`; keep local now, factor later into a common canonical event-list renderer.

## @sys/ui cell dev rig
- `@sys/ui` dev/serve tasks should run through `@sys/cell`, not direct Vite service scripts.
- Cell services:
  - `sys.ui:view` → Vite in `dev` mode, static dist service in default mode;
  - `sys.ui:files` → sample Files websocket/http manifest service.
- Sample Files service root is `./-sample/files`.
- Current dev ports avoid draft-shell conflicts:
  - UI: `http://localhost:1235/`
  - Files websocket: `ws://localhost:5051/files`
  - Files manifest: `http://localhost:5051/files/manifest`
- This is the evergreen backing rig for future `@sys/ui/react/files` specs/samples.
- Do not hide this service lifecycle inside `Files.InfoPanel`.

## Spec migration plan
- Do not blindly copy draft-shell `-spec` into `@sys/ui`.
- Existing draft spec has two concerns:
  - portable visual/debug harness for `Files.InfoPanel`;
  - draft-local websocket sample wiring at `ws://localhost:5050/files` with an active client singleton.
- Move the generalized spec into `code/sys.ui/ui/src/m.react/ui.files/-spec/`:
  - render `Files.InfoPanel` from static snapshot fixtures;
  - provide debug controls for `theme`, `debug`, and selected snapshot state;
  - keep fixture states local and deterministic: `stopped`, `ready`, `error`;
  - allow explicit connect/disconnect controls against the `@sys/ui` cell Files service at `ws://localhost:5051/files`;
  - keep connection policy spec-only; do not hide service lifecycle inside `Files.InfoPanel`;
  - use `t.Style.Input`, not local CSS aliases.
- Retire or rewrite draft-shell `-spec/-u.connect.ts` only after draft-shell consumes the generalized `@sys/ui` package leaf.

## Immediate follow-up after current unit lands
1. Add the local `./sys/ui/files` export and import-proof test.
2. Keep the local island extraction-clean; do not introduce draft-shell defaults into the panel surface.

Done locally:
- Factored InfoPanel row assembly into `u.items.tsx`.
- Factored capability row-value rendering into `u.items.Capabilities.tsx`.
- Kept `KeyValue.UI` as the visual root.
- Capability names use foreground by inheritance; `•` separators are decorative, opacity-controlled with `@sys/ui-css`, and spaced by inline-flex gap.
- Capability rendering uses pure TSX render helpers; no faux local component API or `className: string` prop plumbing.
- Added generalized `@sys/ui` Files DevHarness spec at `src/m.react/ui.files/-spec/`.
- Registered the spec as `sys.ui: react/files`.
- Spec has static snapshot fixtures plus explicit connect/disconnect controls for the `@sys/ui` cell Files service.

## Proof
- Add `./sys/ui/files` export in `deploy/@draft.shell/deno.json`.
- Use the short `it('API', async () => { ... })` import-proof style from `@sys/tmpl`.
- Test with `const m = await import('@draft/shell/sys/ui/files')`.
- Assert `expect(m.Files).to.equal(Files)` only; no surface-key inventory.
