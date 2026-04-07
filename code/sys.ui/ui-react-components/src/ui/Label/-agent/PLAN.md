# UI Plan: `<Label>`

## Intent

Build a reusable UI primitive for measured text truncation so components like
`Http.Origin` do not carry local measurement/layout hacks.

This primitive should own:

- text measurement
- width observation
- truncation policy
- rendered display text

It should not own:

- link behavior
- status icons
- verification logic
- domain-specific formatting beyond text display

---

## Problem

`Http.Origin` currently exposes a real layout problem:

- long URL values wrap badly
- CSS end ellipsis is the wrong behavior
- middle ellipsis must preserve the end of the string
- local measurement logic inside `Http.Origin` becomes scar tissue quickly

This is not a `Http.Origin` problem. It is a reusable text-display problem.

---

## Primitive

Create:

- `src/ui/Label`

Initial shape:

- `mod.ts`
- `t.ts`
- `common.ts`
- `ui.tsx`
- later `use.Measure.ts` or similar if needed
- `-spec/-SPEC.tsx`
- `-spec/-SPEC.Debug.tsx`

---

## Core Contract

`<Label>` renders text into available width and truncates it according to a
declared strategy.

First-class behaviors:

1. plain text display
2. end ellipsis
3. middle ellipsis
4. measured middle ellipsis with fixed right-tail preservation

The key requirement for the `Http.Origin` case:

- preserve a fixed right tail
- use the remaining width for the left side
- insert a single middle ellipsis

---

## Proposed API

Minimal first pass:

```ts
export declare namespace Label {
  export type TruncateMode = 'none' | 'end' | 'middle';

  export type Props = {
    text: string;
    title?: string;
    truncate?: TruncateMode;
    tail?: number;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
```

Notes:

- `text` is the raw input
- `truncate='middle'` activates measured middle ellipsis
- `tail` controls the fixed preserved suffix for middle truncation
- `title` can default to raw text for hover disclosure if desired

Do not add link props.
Do not add icon props.
Do not add URL-specific semantics.

---

## Measurement Ownership

`<Label>` should measure internally.

Use:

- `useSizeObserver`
- internal text measurement

Important boundary:

- measurement belongs inside the primitive, not at the call site
- consumers should not pass widths, refs, or char budgets

If shared text-measure infra is missing, create a local private helper inside
`Label` first, then later lift it down into shared UI infrastructure if reused.

Do not put text-measure globals into domain components.

---

## Rendering Rules

### `truncate='none'`

- render raw text
- allow normal layout

### `truncate='end'`

- CSS single-line end ellipsis

### `truncate='middle'`

- single-line only
- measure available width
- preserve `tail` characters on the right
- compute the maximum left prefix that fits
- render `prefix + '…' + suffix`

If full text fits:

- render full text

If width is not measurable yet:

- render raw text for first pass, or conservative fallback only inside `Label`
- do not leak temporary truncation heuristics into consumers

---

## `Http.Origin` Rollout

After `<Label>` exists:

1. `Http.Origin/ui.Value.tsx`
   - stop rendering raw trimmed URL text directly
   - render:
     - `<Label text={Str.trimHttpScheme(url)} truncate="middle" tail={7} />`

2. Keep `Anchor` as the outer interaction primitive.
   - `Label` is display-only
   - `Anchor` still owns linking

3. Keep status icon layout in `Http.Origin.Value`.
   - `Label` should not know about verification state

---

## Spec Plan

Need a dedicated `Label` spec before adoption.

Spec samples:

1. short text
2. long text with `truncate='end'`
3. long text with `truncate='middle'`
4. narrow width
5. wide width
6. monospace-like content such as URLs

The `Http.Origin` overflow sample remains as the integration repro.

---

## Testing Plan

Unit tests should focus on:

1. no truncation when text fits
2. end ellipsis mode
3. middle ellipsis preserves suffix
4. middle ellipsis grows/shrinks with width changes
5. raw text remains available via title/tooltip policy if enabled

Do not overtest pixel-perfect layout in unit tests.
Use spec harness for visual confirmation.

---

## Non-Goals

Not in first pass:

- multiline truncation
- rich inline formatting
- embedded icons
- URL parsing semantics
- link ownership
- copy affordances

---

## Acceptance Bar

This is done when:

1. `Label` is reusable and domain-neutral
2. `Http.Origin` no longer carries text-measure logic
3. middle ellipsis preserves the right tail correctly
4. visual repro in `Http.Origin` is fixed by consuming `Label`
5. the implementation would be respected as a standalone primitive

---

## Commit Shape

Likely sequence:

1. `feat(ui-react-components): add Label primitive for measured text truncation`
2. `refactor(ui-react-components): use Label for Http.Origin value truncation`
