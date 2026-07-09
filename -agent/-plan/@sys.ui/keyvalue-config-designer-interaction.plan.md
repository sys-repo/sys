# KeyValue focus interaction model

Commit arc:

- [x] 95991740e design(ui-components): define KeyValue focus interaction model
- [x] 24acd1b8d feat(ui-components): add KeyValue focus model
- [x] 531ac903d feat(ui-components): enter KeyValue focus mode from rows
- [ ] feat(ui-components): navigate KeyValue focus scopes
- [ ] feat(ui-components): render quiet KeyValue focus affordance
- [ ] feat(ui): apply KeyValue focus to InfoPanel config designer
- [ ] feat(ui): support focused divider insertion in InfoPanel config designer

## Essence

The subject is `<KeyValue>` focus, not dynamic dividers and not `InfoPanel.Config`.

Dynamic dividers are the forcing case: `InfoPanel.Config` needs to insert an HR, which exposes the durable primitive question:

> What item or scope inside a dense `KeyValue` projection is command-addressable right now?

Answer that in `@sys/ui-components` at the `KeyValue` primitive boundary. `InfoPanel.Config` is only the first consumer/reality test.

Core boundary:

- `KeyValue` remains a dense display/projection surface.
- Focus is opt-in; normal `KeyValue` remains non-focusable and visually unchanged.
- The `KeyValue` focus layer owns focus refs, focus scopes, navigation commands, and active affordance.
- Hosts own domain data, edit validity, and persistence.
- HR/divider insertion is a later host edit command over `KeyValue` focus, not the focus primitive itself.

## Primitive home

Implementation starts in:

```text
code/sys.ui/ui-components/src/ui.react/KeyValue/
```

Not in:

```text
code/sys.ui/ui/src/ui.react/ui.files/ui.InfoPanel.Config/
```

`InfoPanel.Config` should consume the primitive only after `KeyValue` focus exists.

## Boundary truth

Current `InfoPanel.Config` emits visible fields as `Field[]`. That shape cannot truthfully carry inserted dividers, local sectioning, or future non-field layout items.

Do not smuggle dividers into `Field[]`.

A richer host-owned editable layout shape may be introduced later when the insertion slice needs it. That belongs to `InfoPanel.Config` or its domain host, not to the base `KeyValue` focus primitive.

Planning sketch only:

```ts
type ConfigItem =
  | { readonly kind: 'field'; readonly field: Field; readonly indent?: number }
  | { readonly kind: 'hr'; readonly id: string; readonly indent?: number }
  | { readonly kind: 'group'; readonly id: string; readonly items: readonly ConfigItem[] };
```

The `KeyValue` focus primitive should not commit this host shape.

## Primitive set

### FocusRef

A focus ref identifies an item in a projected `KeyValue` item tree.
It is not a DOM id and not a source-object data address.

```ts
type FocusRef = {
  readonly path: t.ObjectPath;
};
```

Path rules:

- Path tokens are stable `KeyValue.Item.id` values.
- Items without stable identity are not focusable by default.
- Avoid positional indexes unless a caller explicitly accepts unstable focus identity.
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

A focus scope is a list of peer focusable `KeyValue` items.
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
- The first primitive should accept/derive focusable items from stable `KeyValue.Item` identity.
- Public focusability should be exposed through an opt-in `KeyValue` focus surface, not implicit row behavior.
- Reorder drag may set active item later, but drag must not be required before keyboard commands can target an item.

### Focus mode

This is configuration/command focus for dense projected data, not ordinary text/input focus.

- Default state remains normal dense `KeyValue`; no row focus chrome.
- Focus mode is opt-in on the `KeyValue` surface.
- `Option+click` on a focusable row can enter focus mode and set active item.
- Treat `Option+click` as a power accelerator, not the only eventual entry path.
- A later explicit host/designer affordance may also enter focus mode.
- DOM focus and model focus are related but distinct: DOM focus captures keyboard events; model focus names the command target.
- Native controls inside rows keep their own semantics; focus-mode keyboard handling must not steal normal control activation.

### Focus affordance

The active mark must be clear, quiet, and zero-layout-shift.

- Prefer inset/dotted/overlay styling over a real border that changes metrics.
- Avoid browser-default blue focus halos as the config-focus design language.
- The affordance belongs to `KeyValue` focus mode, but renders only when the opt-in focus layer is active.

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

These are not first-slice scope. They test whether the `KeyValue` focus primitive is powerful enough.

### Insertion

Design insertion as slot-based, not divider-specific.

- HR is the first insertable kind.
- The same insertion primitive should later admit spacer/title/custom items.
- Insertions target a position relative to active focus: before, after, or inside when the active item permits children.
- Host reducers own the actual item insertion and emitted change payload.

### Delete

Delete is optional and capability-gated.

- Enable deletion per host/designer instance.
- Gate deletion per item kind and, if needed, per item.
- Delete targets selected items if selection exists; otherwise active focus.
- Domain reducers own required-field dependency policy.

### Indent / dedent

Indent/dedent are host/designer commands, not base `KeyValue` semantics.

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

1. Resolve `KeyValue.Item[]` tree.
2. Resolve focusable items and scopes from the item tree.
3. Apply focus command to `FocusModel`.
4. Render focused `KeyValue` projection when focus mode is active.
5. Let hosts apply future edit commands to their own domain item/config model.
6. Let hosts project domain data back to `KeyValue` / `KeyValue.Switches` items.
7. Let hosts emit host-owned change payloads.

`KeyValue.Switches` should remain a boring projection layer: rows, groups, HRs, reorder, labels.

## First useful slice

Prove the primitive in `@sys/ui-components` before consuming it from `InfoPanel.Config`:

1. Define `KeyValue` focus types/model using `t.ObjectPath`.
2. Use `Obj.Path` helpers for focus equality and scope movement.
3. Define local data-only focus commands.
4. Resolve focus scopes from `KeyValue.Item[]`, with groups as atoms until entered.
5. Keep the first slice pure: no DOM, no React event wiring, no visual affordance.
6. Add focused tests under `code/sys.ui/ui-components/src/ui.react/KeyValue/-test/`.
7. Only after this lands, wire focus-mode entry/navigation/affordance into `KeyValue.UI`.
8. Only after `KeyValue` focus is coherent, apply it to `InfoPanel.Config` and then implement focused HR insertion.

## Review gates

Before landing implementation:

- [ ] The first focus model lands in `@sys/ui-components` `KeyValue`, not `@sys/ui` `InfoPanel.Config`.
- [ ] Base `KeyValue` remains visually unchanged unless focus mode is explicitly enabled.
- [ ] Focus is single; future multi-target behavior is selection.
- [ ] `FocusRef.path` uses `t.ObjectPath` / `Obj.Path` without becoming a source-object data path.
- [ ] Focus path tokens use stable `KeyValue.Item.id` identity, not positional indexes when avoidable.
- [ ] Groups are focus atoms at parent scope and enterable child scopes only when commanded.
- [ ] Focusability is opt-in.
- [ ] Focus-mode entry is not designed as modifier-click-only forever.
- [ ] Active-row affordance causes no layout shift.
- [ ] Commands are pure reducer-style transforms before UI wiring.
- [ ] Command payloads are `Cmd<T>`-friendly but do not depend on `@sys/event/cmd`.
- [ ] Insertion is generic enough for future item kinds.
- [ ] Delete is capability-gated and item-kind-aware.
- [ ] Indent/dedent do not force `KeyValue` to own hierarchy semantics.
