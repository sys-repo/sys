feat(edu-slug): add minimal SlugSheetController and mount it via SlugSheetStack

1) Add `ui.SlugSheet/m.Controller.ts` (or `m.Controller.ts`)
- Expose `SlugSheetController.create(...)`
- Own only:
  - `selectedPath` (signal)
  - `split` (signal, optional)
  - `treeRoot` (signal, optional)
- Emit a single `props(): t.SlugSheetProps` (or `toProps()`) that is stable + pure.

2) Define minimal controller types in `ui.SlugSheet/t.ts`
- `SlugSheetController` type alias (create, dispose, props/toProps)
- `SlugSheetControllerProps` input (theme/debug + initial tree docId/baseUrl OR direct root)

3) Implement composition in controller (no policy)
- Compose `TreeHost` into the sheet’s slots:
  - tree slot: default TreeHost tree
  - aux slot: placeholder (optional)
  - main slot: placeholder “hello world” (for now)
- Wire:
  - `TreeHost.onPathChange` → controller.selectedPath mutate
  - `TreeHost.onSplitChange` → controller.split mutate (if you keep split in controller)

4) Update `ui.SlugSheet/ui.tsx`
- Keep UI pure.
- Accept `slots` (or `children/slots`—whatever you chose) from props and render them.
- No signals created inside UI.

5) Add `ui.SlugSheetStack/m.Controller.ts`
- Own `stack: Signal<readonly SheetModel[]>` where SheetModel at minimum is:
  - `{ readonly id: t.StringId; readonly sheet: t.SlugSheetController }`
- API:
  - `push(model)`
  - `pop(leave = 1)` (never pop past root)
  - `dispose()` (dispose all sheet controllers)

6) Update `ui.SlugSheetStack/t.ts`
- Add `SlugSheetStackController` types and `SlugSheetStackProps` expected by UI:
  - `items: readonly { id; props: t.SlugSheetProps }[]`
  - `onPop?: () => void` (optional, provided by controller)

7) Update `ui.SlugSheetStack/ui.tsx`
- Render stack visually (topmost last).
- For now: no animations, just absolute/grid layering.
- Include a simple “back” affordance on the top sheet wired to `props.onPop?.()`

8) Wire a dev harness (`ui.SlugSheetStack/-spec`)
- Create root `SlugSheetController` (TreeHost with real loader sample).
- Create StackController, push root.
- Add a “push overlay” button in debug panel that pushes a second stub sheet.
- Verify:
  - tree selection updates path (no errors)
  - pop removes top sheet (root remains)

9) Tests (smoke)
- `SlugSheetController`:
  - selecting path mutates controller state
  - `toProps()` is stable shape (no undefined crashes)
- `SlugSheetStackController`:
  - push/pop semantics, never below root
  - dispose calls child disposes
