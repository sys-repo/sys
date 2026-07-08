# @sys/ui-components KeyValue Grouped Config Rows Plan
## Canonical status/commit checklist
### Done — committed code changes
- [x] feat(ui-components): render recursive KeyValue item groups — `6f386c2cb`
- [x] refactor(ui-components): move KeyValue utilities under u directory — `41fab97ae`
- [x] feat(ui-components): constrain reorder to direct KeyValue children — `5ab4c5292`
- [x] refactor(ui-components): extract KeyValue reorder change decision — `dab15c430`
- [x] feat(ui-components): support recursive groups in KeyValue.Switches — `7420c344f`
- [x] feat(ui): consume grouped KeyValue rows in Files.InfoPanel.Config — `3f5fe0840`
- [x] refactor(ui-components): move KeyValue root utilities under /u/ dir — `a2f88ed64`
- [x] refactor(ui-components): move KeyValue internals under ui — `e423a24a2`
- [x] refactor(ui-components): use Is predicates in KeyValue — `e84385905`
- [x] feat(ui-components): add opt-in KeyValue projection animation API — `57983e390`

### Done — plan decisions/proof covered by the commits above
- [x] design(ui): model KeyValue recursive item groups — covered by `6f386c2cb`
- [x] test(ui): prove recursive grouping, direct-child reorder, and InfoPanel consumption — covered by `5ab4c5292`, `dab15c430`, `7420c344f`, `3f5fe0840`
- [x] refactor(ui-components): align KeyValue predicates with `@sys/std`/canon `Is.*` usage — `e84385905`
- [x] design(ui): evaluate KeyValue projection animation after recursive identity is stable — implemented as opt-in API by `57983e390`
- [x] test(ui-components): prove projection animation for direct-child insert/remove/order changes — covered by `57983e390`

Current reality:
- Done/committed: the grouped config rows arc is complete through recursive model/rendering, direct-child reorder, Switches groups, Files.InfoPanel.Config consumption, tests, cleanup, `Is.*` canon alignment, and the opt-in projection animation API/proofs.
- In progress/uncommitted: none for this KeyValue grouped config rows arc.

## XHIGH DMIND / TMIND review
The core design is an S-tier candidate, not because it adds grouping, but because it removes the need
for a second grouping abstraction.

The stronger model is not a parallel `groups` prop and not `hr`-driven grouping.

The primitive should stay recursive:

```text
KeyValue item list
  item
  group item
    item
    item
  item
```

A `Group` is an item whose value is another ordered KeyValue item list. Reorder acts on direct children
of the current item list only. Therefore a group moves atomically at its parent level, while its own
children may later be reordered inside the group without adding a second grouping subsystem.

S-tier judgment:
- Flat KeyValue rows stay simple.
- Compound UI becomes possible without a parallel API lane.
- `hr`, `title`, and `spacer` remain presentation items, never semantic grouping mechanisms.
- Files-specific visibility/order policy stays outside the primitive.
- The design earns long-term quality only if implementation preserves direct-child identity and avoids leaking grouping policy into rendering details.

## Intent
- Lift the next `Files.InfoPanel.Config` needs into a reusable `KeyValue` substrate capability.
- Keep `KeyValue` as the baseline builder primitive: an ordered list of items where an item may itself contain items.
- Make grouped config rows a base `@sys/ui-components` affordance without introducing a separate `groups` API lane.
- Preserve the repeatable second-order pattern:
  - `Config` shapes view props,
  - `Info` projects subject state,
  - `<subject>` owns real capability/transport.
- Enable downstream callers to express rich config/status tooling with minimal call-site code.

## Source arc
This plan is split out of:
- `-agent/-plan/@sys.ui.react.files/files-info-panel.props-config.plan.md`

The Files arc proved the first usage path:
```text
Files.InfoPanel.Config → Files.InfoPanel → Files<T>
```

The next step belongs upstream:
```text
KeyValue recursive item groups → KeyValue.Switches → Files.InfoPanel.Config
```

## Boundary decision
`KeyValue` / `KeyValue.Switches` should own:
- recursive item grammar,
- stable direct-child identity for reorder,
- group-as-item rendering,
- direct-child reorder semantics,
- reusable recursive row projection semantics.

Downstream components should own:
- domain field ids,
- domain labels,
- domain visibility/order state,
- domain action wiring,
- domain-specific flattening back to external state.

`Files.InfoPanel.Config` should remain a consumer, not the place where recursive grouping/reorder mechanics are invented.

## Working API sketch
Use a compound item variant, not a top-level `groups` prop.

```ts
type Item = Row | Title | Hr | Spacer | Group;

type Group = {
  readonly id: string;
  readonly kind: 'group';
  readonly items: Item[];
};
```

The public type name should be `KeyValue.Group`. The prose concept is "item group". This keeps
`Group` scoped to the `KeyValue.Item` grammar and avoids a parallel grouping model.

## Target usage sketch
```tsx
<KeyValue.Switches.UI
  theme={theme}
  items={[
    {
      id: 'group:status',
      kind: 'group',
      items: [
        { id: 'status', label: 'status', value: true },
        { id: 'status:title', label: 'title status', value: true },
      ],
    },
    { id: 'events', label: 'events', value: true },
    { id: 'capabilities', label: 'capabilities', value: true },
    { id: 'error', label: 'error', value: true },
    { id: 'fidelity', label: 'fidelity', value: false },
  ]}
  reorder={{
    onChange: ({ next }) => {
      // `next` is the reordered direct-child list. The status group remains atomic.
      // Caller flattens stable leaf ids back to domain fields when needed.
    },
  }}
/>
```

## Naming decision
- Prefer `Group` / `KeyValue.Group`.
- Do not use a top-level `groups` prop.
- Do not use `ItemSet`: order is central, and `Set` collides with JS/TS collection semantics.
- Do not use `ItemList`: technically accurate but reads like internal collection machinery rather than a UI atom.
- Do not use `Block`: too visual/layout-coded for a semantic composition unit.

## Design decisions
- `Group.id` is required. A group exists because it is an identity-bearing direct child.
- Bare nested arrays are not part of the first public API. Anonymous render-only shorthand may be reconsidered later, but the canonical recursive form is an identity-bearing `Group` item.
- The public grammar stays one-lane: `items` only. No top-level `groups` prop.
- Reorder means direct-child reorder at the current item-list level.
- Nested reorder is a later local feature, not implicit cross-level behavior.

## Design questions
- How should `KeyValue.Switches.Item.ToggleArgs.index` read for nested switch rows: local sibling index only, or an earned `path` later?
- How should hidden/off rows in `Files.InfoPanel.Config` interact with grouped visible-field order?
- Should automatic divider projection exist later, or should callers keep using explicit `hr` items inside groups?
- How should recursive groups preserve flat visual equivalence in `table` layout, not only `spaced` layout?

## Reorder principles
- Reorder acts on direct children of the current `items` list.
- A `kind: 'group'` item is one direct child and moves atomically at its parent level.
- Nested reorder, if enabled later, is local to the nested item list.
- Preserve stable item ids across projection changes.
- Ensure emitted order is domain-mappable without inspecting rendered labels.
- Reject or normalize duplicate direct-child ids before emitting caller-facing changes.
- Do not allow accidental cross-level movement unless explicitly modeled later.

## Divider principles
- `hr` remains a visual item, not a semantic grouping mechanism.
- Grouping must not be inferred from nearby `hr` items.
- Callers may place `hr`, `title`, or `spacer` items inside a group when the visual structure should move with that group.
- If automatic divider projection is added later, generated dividers must remain presentation-only and must not enter domain reorder payloads.

## Render principles
- A group should render by reusing the same KeyValue item grammar recursively.
- The implementation should prefer an internal recursive render kernel over nesting public `<KeyValue.UI>` roots, so root semantics, table tracks, and reorder boundaries stay controlled.
- The default grouped visual should remain flat: no implicit indentation, title, divider, padding, or background.
- Indentation remains an item-level spacing concern, not a group concept.
- Recursive rendering must preserve theme, layout, size, mono, truncate, enabled, debug, and defaults unless explicitly overridden later.
- `spaced` layout is the first proof path; `table` layout needs a deliberate subgrid/display-contents pass so grouping does not break column alignment.
- If table layout cannot be made truthful in the first pass, scope support explicitly rather than silently degrading it.

## KeyValue.Switches usage goal
`KeyValue.Switches` should mirror the recursive grammar without introducing a parallel group API:
- `KeyValue.Switches.Item` should allow switch rows, presentation items, and switch item groups.
- A switch item group should project to `KeyValue.Group`.
- Toggle handlers remain row-owned.
- Group identity is for direct-child reorder and projection, not switch value state.

## Downstream Files usage goal
`Files.InfoPanel.Config` should become a thin domain adapter:
- define a status group containing `status` and `status:title`,
- keep singleton fields as singleton items,
- map fields to switch rows,
- flatten emitted recursive item ids back to `Files.InfoPanel.Field[]`,
- pass recursive items into `KeyValue.Switches.UI`.

It should not locally implement recursive sorting, group drag policy, divider insertion, or presentation-row filtering.

Because `Files.InfoPanel.Config.fields` is currently a visible-field list, hidden/off member ordering must be
reviewed carefully. If hidden-member order needs to survive independent of visibility, that is a Files config
state-contract question rather than a `KeyValue` primitive concern.

## Animation seam
- Motion was deferred until recursive item/group identity and reorder semantics were stable.
- Motion is now implemented as an explicit opt-in `KeyValue.Props.animation` projection API.
- Motion responds to legitimate direct-child insert/remove/order changes, not every render.
- The same substrate can later help `Files.InfoPanel` animate field projection changes.

### Animation implementation outcome
- Recursive groups do not imply animation; projection is a separate opt-in API added by `57983e390`.
- Projection animation requires stable, unique root direct-child ids; unstable identity falls back to static rendering.
- The first animation pass animates root direct-child insert/remove/order changes only; a group projects as one atomic direct child at its parent level.
- Nested projection animation can be enabled later per nested item list after local nested reorder/edit semantics exist.
- Reorder drag motion remains owned by the current Motion `Reorder` path; non-drag projection animation does not reuse reorder callbacks or change direct-child reorder semantics.

## Proof path
From `code/sys.ui/ui-components` or the relevant package root:
- run the package check task,
- run focused KeyValue/KeyValue.Switches tests,
- verify the DevHarness shows recursive switch groups and parent-level group drag as one unit.

Then from `code/sys.ui/ui`:
- run focused `ui.files` tests,
- verify `Files.InfoPanel.Config` consumes the recursive substrate without behavior regression.

## Non-goals
- No Files transport lifecycle changes.
- No global config framework.
- No cross-domain action system in this pass.
- No implicit animation from recursive groups or reorder mode; projection remains opt-in.
- No top-level `groups` prop.
- No one-off Files-only grouping code.
