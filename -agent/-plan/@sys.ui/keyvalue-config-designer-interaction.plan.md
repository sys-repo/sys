# KeyValue config designer interaction model

Commit arc:

- [x] design(ui): define KeyValue focus interaction model
- [ ] feat(ui): add InfoPanel config focus model
- [ ] feat(ui): enter InfoPanel config focus mode from rows
- [ ] feat(ui): navigate InfoPanel config focus scopes
- [ ] feat(ui): render quiet InfoPanel config focus affordance
- [ ] feat(ui): support focused divider insertion in InfoPanel config designer

## Essence

The subject is focus, not dynamic dividers.

Dynamic dividers are the forcing case: `InfoPanel.Config` needs to insert an HR, which exposes the more durable question:

> What item or scope is command-addressable right now?

Answer that with a small focus model. Everything else — insertion, deletion, indent/dedent, grouping, command palettes, remote command dispatch — should build on top of that target.

Core boundary:

- `KeyValue` remains a dense display/projection surface.
- The host owns config/layout data.
- The designer/editor layer owns focus, commands, validity, and future selection.
- HR/divider is the first insertable item kind, not a special architecture.

## Boundary truth

Current `InfoPanel.Config` emits visible fields as `Field[]`. That shape cannot truthfully carry inserted dividers, local sectioning, or future non-field layout items.

Do not smuggle dividers into `Field[]`.

A richer host-owned editable layout shape may be introduced when the insertion slice needs it. Planning sketch only:

```ts
type ConfigItem =
  | { readonly kind: 'field'; readonly field: Field; readonly indent?: number }
  | { readonly kind: 'hr'; readonly id: string; readonly indent?: number }
  | { readonly kind: 'group'; readonly id: string; readonly items: readonly ConfigItem[] };
```

The first focus slice should not require committing this public shape.

## Primitive set

### FocusRef

A focus ref identifies an item in projected designer structure.
It is not a DOM id and not a source-object data address.

```ts
type FocusRef = {
  readonly path: t.ObjectPath;
};
```

Path rules:

- Path tokens are stable projected item IDs; avoid positional indexes when stable identity exists.
- Use `Obj.Path.eql` for equality.
- Use `Obj.Path.slice` and `Obj.Path.joinAll` for scope movement.
- Use `Obj.Path.encode` only when a stable string key is needed.
- Reuse `Obj.Path` tooling without implying `KeyValue` owns object hierarchy.

Examples:

```ts
{ path: ['group:title'] }
{ path: ['group:title', 'title'] }
{ path: ['group:title', 'group:title.status', 'title.status'] }
```

### FocusModel

Focus is single.
Do not model `multi-focus`; future multi-target behavior is selection.

First implementation:

```ts
type FocusModel = {
  readonly active?: FocusRef;
};
```

Future-compatible shape:

```ts
type FocusModel = {
  readonly active?: FocusRef;
  readonly anchor?: FocusRef;
  readonly selected?: readonly FocusRef[];
};
```

The future shape is not first-slice scope. It exists to keep names compatible with later range/multi-selection.

### FocusScope

A focus scope is a list of peer focusable items.
Root is a scope. An entered group is a scope.

At a parent scope, a child group is one focusable atom until explicitly entered.

Navigation:

- `ArrowUp` / `ArrowDown` move among focusable siblings in the current scope.
- `Enter` on an enterable focused group enters its child scope and focuses the first eligible child.
- `Escape` inside a child scope exits to the parent scope and focuses the parent group atom.
- `Escape` at root exits focus mode and clears active focus.
- If plain `Enter` conflicts with row activation later, reserve `Option+Enter` as the enter-scope accelerator.

Future selection should initially stay within one scope. Arbitrary cross-tree selection is out of scope.

### Focusability

Focusable is opt-in.

- Do not make every `KeyValue` item focusable by default.
- Prove focusability first in the config designer projection.
- Avoid adding public `KeyValue.Item.focusable` / `canFocus` until the model earns promotion.
- Reorder drag may set active item, but drag must not be required before keyboard commands can target an item.

### Focus mode

This is configuration focus, not ordinary text/input focus.

- Default state remains normal dense `KeyValue`; no row focus chrome.
- `Option+click` on a focusable row can enter focus mode and set active item.
- Treat `Option+click` as a power accelerator, not the only eventual entry path.
- A later explicit designer affordance may also enter focus mode.
- DOM focus and model focus are related but distinct: DOM focus captures keyboard events; model focus names the command target.
- Native controls inside rows keep their own semantics; focus-mode keyboard handling must not steal normal control activation.

### Focus affordance

The active mark must be clear, quiet, and zero-layout-shift.

- Prefer inset/dotted/overlay styling over a real border that changes metrics.
- Avoid browser-default blue focus halos as the config-focus design language.
- The mark belongs to the projected designer layer first, not base `KeyValue` styling.

## Command shape

Use plain reducer command data for local focus state.
Do not introduce `@sys/event/cmd` inside the first focus implementation.

```ts
type FocusCommandName =
  | 'focus:set'
  | 'focus:next'
  | 'focus:previous'
  | 'focus:enter'
  | 'focus:exit';

type FocusCommandPayload = {
  readonly 'focus:set': { readonly ref?: FocusRef };
  readonly 'focus:next': Record<string, never>;
  readonly 'focus:previous': Record<string, never>;
  readonly 'focus:enter': Record<string, never>;
  readonly 'focus:exit': Record<string, never>;
};
```

Keep commands `Cmd<T>`-friendly:

- stable string-literal names;
- data-only payloads;
- no React events, DOM nodes, or synthetic events in payloads;
- room for later handled/no-op/failure results;
- namespace-ish names that can lift into `Cmd.make<N, P, R, E>()` if commands cross a runtime boundary.

Use `@sys/event/cmd` only for boundaries such as iframe, worker, remote control plane, external command palette host, or dev harness control.

## Future command reality tests

These are not first-slice scope. They test whether the focus primitive is powerful enough.

### Insertion

Design insertion as slot-based, not divider-specific.

- HR is the first insertable kind.
- The same insertion primitive should later admit spacer/title/custom items.
- Insertions target a position relative to active focus: before, after, or inside when the active item permits children.

### Delete

Delete is optional and capability-gated.

- Enable deletion per designer instance.
- Gate deletion per item kind and, if needed, per item.
- Delete targets selected items if selection exists; otherwise active focus.
- Domain reducers own required-field dependency policy.

### Indent / dedent

Indent/dedent are designer commands, not `KeyValue` semantics.

Default flat-with-depth interpretation:

- Right increases the active item depth/indent when allowed.
- Left decreases depth/indent or lifts the item toward root.
- The host reducer validates limits and dependency rules.

Tree interpretation remains possible later:

- Right can nest the active item under a previous eligible sibling.
- Left can lift the active item to the parent list.

The invariant: `KeyValue` receives an honest projection — row spacing, groups, dividers, labels — and does not become a hierarchy editor.

### Group

`Cmd+G` should wait until selection exists.

- With only one active item, grouping is underspecified.
- With same-scope range selection, `Cmd+G` can wrap selected siblings in a group.

## Projection seam

Keep transforms pure before UI wiring:

1. Resolve host-owned config item list.
2. Resolve focusable projected items and scopes.
3. Apply focus command to `FocusModel`.
4. Apply future edit command to host item list when needed.
5. Validate domain constraints.
6. Project host data to `KeyValue` / `KeyValue.Switches` items.
7. Emit host-owned change payload.

`KeyValue.Switches` stays boring: rows, groups, HRs, reorder, labels.

## First useful slice

Prove focus before building editor commands:

1. Define internal `FocusRef` / `FocusModel` for `InfoPanel.Config` using `t.ObjectPath`.
2. Use `Obj.Path` helpers for focus equality and scope movement.
3. Define local data-only focus commands.
4. Project focusable field rows through the existing `KeyValue.Switches` shape.
5. Enter focus mode with `Option+click` and active row set.
6. Exit child scopes/root focus mode with `Escape`.
7. Move active focus with `ArrowUp` / `ArrowDown` in the current scope.
8. Enter groups with `Enter` when unambiguous.
9. Add a quiet zero-layout-shift active-row affordance.
10. Add HR insertion only after focus is coherent.

## Review gates

Before landing implementation:

- [ ] Dividers are not encoded as fake fields.
- [ ] Base `KeyValue` remains a projection component.
- [ ] Focus is single; future multi-target behavior is selection.
- [ ] `FocusRef.path` uses `t.ObjectPath` / `Obj.Path` without becoming a source-object data path.
- [ ] Focus path tokens use stable projected identity, not positional indexes when avoidable.
- [ ] Groups are focus atoms at parent scope and enterable child scopes only when commanded.
- [ ] Focusability is opt-in and first proven in the designer layer.
- [ ] Focus-mode entry is not designed as modifier-click-only forever.
- [ ] Active-row affordance causes no layout shift.
- [ ] Commands are pure reducer-style transforms before UI wiring.
- [ ] Command payloads are `Cmd<T>`-friendly but do not depend on `@sys/event/cmd`.
- [ ] Insertion is generic enough for future item kinds.
- [ ] Delete is capability-gated and item-kind-aware.
- [ ] Indent/dedent do not force `KeyValue` to own hierarchy semantics.
