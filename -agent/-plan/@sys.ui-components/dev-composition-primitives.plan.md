@sys.ui-components
dev-composition-primitives.plan.md
- [x] d6a8ca8c9 test(ui-components): clarify public leaf export contracts
- [x] d9fa9161f feat(ui-components): add Dev Help Markdown composition primitive
- [x] c6b4e3fb1 refactor(ui-components): compose KeyValue cursor help with Dev Markdown
- [x] 4579dd77d refactor(ui-components): extract Dev Help composition module
- [x] 5f83a4c58 style(ui-components): strengthen Anchor underline contrast
- [x] 0f8a1daec refactor(ui-dev): rename devharness Dev aggregate to Harness
- [ ] feat(ui-components): add Dev KeyValue controls composition primitive

Checklist entries become `[x] <hash>` only after their commits land.

## Status

The Dev Help composition arc is complete. The only possible follow-on in this plan is a Dev
KeyValue-shaped controls helper, and it remains gated on a real repeated DEBUG-panel forcing case.

## Package boundary

```text
@sys/ui-dev                  → raw dev harness chassis/runtime/router/index
@sys/ui-components           → production UI primitives
@sys/ui-components/react/dev → dev-only composition over ui-components
```

`Dev` remains exclusive to `@sys/ui-components/react/dev`. `Harness` remains the `@sys/ui-dev`
aggregate.

`@sys/ui-components/react/dev` may own:

- reusable dev-only composition over production components;
- repeated debug-panel micro-structures;
- explicit composition of `Button`, `Chip`, `Anchor`, `KeyValue`, and `Prose.Markdown`.

It must not own:

- devharness routing or module-index behavior;
- caller state, signals, callbacks, or persistence;
- production component policy;
- one-off abstractions extracted from a single large spec panel.

## Landed Dev Help surface

```tsx
import { Dev } from '@sys/ui-components/react/dev';

<Dev.Help.Markdown.UI value={markdown} theme={theme} renderers={overrides} />;
```

`Dev.Help.Markdown.UI` transparently composes `Prose.Markdown`, supplies dev-oriented `Chip.UI` and
safe `Anchor.UI` defaults, preserves caller overrides, and remains independent from harness runtime
and routing.

## Pending Dev KeyValue controls

- [ ] Prove a repeated KeyValue-shaped control rollup in a real DEBUG panel.
- [ ] Define and land a helper only if that proof demonstrates a stable reusable API.

Candidate namespace only:

```tsx
import { Dev } from '@sys/ui-components/react/dev';

<Dev.KeyValue.Controls.UI items={items} theme={theme} />;
```

The name and input model remain intentionally unsettled.

Requirements:

- callers own signals, state, callbacks, labels, and persistence;
- raw `Button` and `KeyValue` remain escape hatches;
- the helper may improve repeated visual composition but must not become a form framework;
- cursor-oriented demos remain close to the KeyValue primitive;
- do not promote a one-off `-SPEC.Debug.tsx` control pile;
- do not add the namespace until a real host proves its exact API.

## Non-goals

- No Markdown parser or production `Prose.Markdown` renderer work in this plan.
- No resurrection of the retired Markdown-backed dev-help-panel plan.
- No `@sys/ui-dev` kitchen-sink control framework.
- No hidden state or storage codec inside a Dev helper.
