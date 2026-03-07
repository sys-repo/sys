# UI Component Generation Protocol

This document defines the **non-negotiable contract** for authoring new `@sys/*` UI components
using Codex, with **zero stylistic drift**, **zero state leakage**, and **strict phase discipline**.

This is not guidance.
This is the system law.

====================================================================================================

## Core stance (non-negotiable)

- Components are built **phase by phase**
- Each phase is intentionally boring
- “It works” is meaningless without invariant compliance
- Codex is an implementer, never a designer

Long-term system integrity outranks local velocity.

====================================================================================================

## The canonical loop (always the same)

Every UI component is built using this exact loop:

1. **Plan**
   - Files touched
   - Allowed actions
   - Explicit prohibitions
   - Phase exit criteria

2. **Patch (Codex execution)**
   - The plan *is* the prompt
   - Minimal diff only
   - No inference, no embellishment

3. **Prove**
   - Harness / spec validation
   - Explicit invariant scan

4. **Commit immediately**
   - One phase → one commit
   - No opportunistic changes

Repeat.

This loop is designed to work even under fatigue.

====================================================================================================

## Phase guardrails are executable

Every phase spec MUST declare guardrails.

- Guardrails are **constraints**, not suggestions
- Violations are a **hard stop**, even if the UI renders correctly
- “Almost right” is wrong

If a guardrail is violated:
- Stop
- Tidy
- Commit the tidy
- Only then proceed

====================================================================================================

## Public surface only (runtime rule)

Runtime code targets **only the public surface** of dependencies.

Rules:
- Read `t.ts` before writing JSX
- Never reach through `.View`, `.Impl`, `.Internal`, or similar
- If unsure, stop and inspect types

Heuristic:
> If it *looks* internal, it is Phase-1 illegal.

====================================================================================================

## No prop guessing (types first, always)

When a phase says “do not guess props”:

- No autocomplete
- No inference from other usage
- No “obvious” additions

Only pass what the public type surface *requires*.

Anything else is a violation.

====================================================================================================

## Theme resolution invariant

A component MAY resolve theme **exactly once per render**:

```ts
const theme = Color.theme(props.theme);
```

After this line:
- All styling derives from `theme`
- `props.theme` MUST NOT be read again
- Child components receive `theme.name`, not raw props

This is the canonical pattern.

====================================================================================================

## Component identity invariant (HARD)

Component identity strings MUST NEVER be hard-coded.

Rules:
- All identity comes from `D`
- Literal names are forbidden outside `D`
- `data-component` MUST be:

```tsx
data-component={D.displayName}
```

Never:
```tsx
data-component={'LayoutTreeSplit'} // illegal
```

This rule is absolute.
Violations require immediate correction.

====================================================================================================

## Canonical defaults pattern (D / DEFAULTS) — HARD INVARIANT

When a UI component has **meaningful default values** for its props, those defaults MUST be:

- Defined **once** on `D` (aka `DEFAULTS`)
- Strongly typed against the public props
- Reused everywhere

### Rules

- Define defaults on `D` using `satisfies`:

```ts
export const D = {
  split: [0.35, 0.65] satisfies P['split'],
} as const;
```

- `D` is the **single source of truth** for:
  - Runtime prop destructuring defaults
    ```ts
    const { split = D.split } = props;
    ```
  - `-SPEC.Debug.tsx` defaults / persistence seeding
  - Any dev or test harness defaults

- Literal duplication of defaults is forbidden
- If a default exists, it lives on `D`
- If no default exists, the prop remains `undefined` unless explicitly supplied

This invariant prevents Codex drift and silent divergence.

====================================================================================================

## Placeholder vs real content (children discipline)

If a component accepts `children`:

- `children == null`
  → render placeholder container + message

- `children != null`
  → render children in a **neutral container** (layout only)

Never:
- Apply placeholder styling to real content
- Let empty-state semantics leak into populated states

====================================================================================================

## DevHarness debug state (default = persistent)

In `-spec/-SPEC.Debug.tsx`, debug state is **persistent by default**.

### Canonical persistent pattern (default)

When a `-SPEC.Debug.tsx` uses Signals, it MUST:

- Create a persistent store:
  ```ts
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;
  ```

- Seed Signals from `snap` (never from `defaults`):
  ```ts
  debug: s(snap.debug)
  theme: s(snap.theme)
  ```

- Implement reset via defaults path-walk:
  ```ts
  Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
  ```

- Persist changes via **one** `Signal.effect`:
  ```ts
  Signal.effect(() => store.change((d) => { ... }))
  ```

This pattern is not optional.

### Ephemeral debug state (exception)

Ephemeral debug state is allowed **only if the plan explicitly declares**:

> “Ephemeral debug state (no LocalStorage)”

If this declaration is missing, persistence is assumed.

====================================================================================================

## Assumption scan (mandatory review)

Before accepting a Codex diff, scan explicitly for:

- Props not listed in the plan
- Internal or private imports
- Styling that constrains future content
- “Helpful” behavior not requested

If found:
- Stop
- Tidy immediately
- Commit the tidy separately

====================================================================================================

## Commit discipline

- One phase → one commit
- Commit immediately after proof
- Commit message references the phase intent

Example:
```
Layout.TreeSplit: phase-1 layout skeleton
```

====================================================================================================

## Fatigue rule (protect the system)

When tired:
- Shrink phases
- Tighten invariants
- Prefer stop + tidy + commit

Never push forward while violating invariants.

====================================================================================================

## Summary (operational truth)

- Plan small
- Enforce invariants
- Trust public types
- Centralize identity and defaults
- Commit relentlessly

This is how we move fast **without** eroding the system.
