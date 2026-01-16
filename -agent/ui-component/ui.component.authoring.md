# UI Component Generation Protocol

This document defines the canonical process for generating new `@sys/*` UI component modules
using Codex, with zero stylistic drift, no state leakage, and strict phase discipline.

It describes **how you and I work together** to plan, prompt, execute, verify, and commit UI components
in small, controlled increments.

====================================================================================================

## Core stance

- Components are built **phase by phase**.
- Each phase is intentionally boring.
- “Works” is not sufficient; **guardrail compliance** is the bar.
- Codex is treated as a fast pair-implementer, not a designer.

The goal is to preserve long-term system integrity while moving quickly.

====================================================================================================

## The canonical loop

Every UI component is developed using the same tight loop:

1. **Plan**
   Write a short, explicit plan (1–5 steps).
   - What files are touched.
   - What is allowed.
   - What is explicitly forbidden.
   - What “done” means.

2. **Patch (Codex execution)**
   Use the plan as the Codex prompt.
   - No extra features.
   - No helpful guesses.
   - Minimal diff only.

3. **Prove**
   Validate via the dev harness or spec.
   - Confirm layout, semantics, and constraints.
   - Look specifically for guardrail violations.

4. **Commit immediately**
   - Small, phase-scoped commit.
   - No bundling of “while I’m here” changes.

Repeat.

This loop is intentionally friction-light so it can be used even under fatigue.

====================================================================================================

## Phase guardrails are executable
Each phase spec **must include guardrails** (explicit do / do-not rules).

Examples:
- “Do NOT introduce Signals or state.”
- “Do NOT guess component props.”
- “Use Color.theme(props.theme) exactly once.”

Review rule:
- Any guardrail violation is a **hard stop**, even if the UI renders correctly.
- Guardrails are treated as executable constraints, not suggestions.

====================================================================================================

## Public surface only (no internal reach-through)
Always target the **public library surface**.

Rules:
- Prefer `Tree.Index` over `Tree.Index.View`.
- Prefer exported lib members over internal-looking subcomponents.
- If unsure, **stop and read the type surface** (`t.ts`) before proceeding.

Heuristic:
- If a symbol looks like `.View`, `.Impl`, `.Internal`, or similar,
  it is almost never Phase-1 safe.

====================================================================================================

## No prop guessing (types first, always)
When a spec says “do not guess props”:

- Do not rely on autocomplete.
- Do not infer from other usages.
- Do not “add what seems obvious”.

Instead:
- Open the component’s `t.ts`.
- Identify the minimal legal surface.
- Pass **only** what is explicitly required.

A 10-line type check now avoids hours of cleanup later.

====================================================================================================

## Placeholder vs real content (children discipline)
Any component that accepts `children` must obey this rule:

- `children == null`
  → render placeholder container + message.

- `children != null`
  → render children in a **neutral container** (min constraints only).

Never:
- Apply placeholder typography, opacity, centering, or sizing
  to real content.
- Let empty-state styling leak into populated states.

This prevents future layout corruption.

====================================================================================================

## Assumption surfaces (UI review checklist)
Before accepting a Codex diff, do a fast scan for:

- Props not mentioned in the phase spec.
- Reliance on internal exports or subcomponents.
- Styling that changes semantics for future children.
- Unnecessary keys, wrappers, or defaults.
- Behavior that “feels helpful” but wasn’t asked for.

If found:
- Stop.
- Tidy immediately.
- Commit the tidy as its own change.



====================================================================================================



## DevHarness debug state (canonical persistence rule)
In `-spec/-SPEC.Debug.tsx`, debug state is **persistent by default**.

The DevHarness exists to make UI behavior inspectable, repeatable, and fatigue-resistant.
Therefore, debug Signals are normally backed by LocalStorage so that:

- UI state survives refresh
- experiments are resumable
- Codex output matches established sys patterns

Ephemeral (in-memory) debug state is allowed **only when explicitly stated in the plan**.

---

### Canonical persistent pattern (default)
When a `-SPEC.Debug.tsx` uses Signals, it MUST follow the template pattern:

In `createDebugSignals()`:

- Create a persistent store:
  - `const store = LocalStorage.immutable<Storage>(\`dev:${D.displayName}\`, defaults);`
  - `const snap = store.current;`

- Seed Signals from `snap` (never from `defaults`):
  - `debug: s(snap.debug)`
  - `theme: s(snap.theme)`
  - `...`

- Implement reset via defaults path-walk:
  - `Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));`

- Persist changes using a single `Signal.effect`:
  - `Signal.effect(() => store.change((d) => { ... }))`

This pattern is not optional.
If debug state is meant to behave like other sys UI specs (e.g. SplitPane),
this pattern applies automatically.

---

### Ephemeral debug state (exception)
Ephemeral debug state may be used only when the plan explicitly declares:

- "Ephemeral debug state (no LocalStorage)"
- Signals are seeded directly from `defaults`
- Refresh resets state by design

If this declaration is missing, persistence is assumed.

---

### Planning guardrail (for Codex)
Every plan that edits `-SPEC.Debug.tsx` MUST include one of:

- **Default (implicit):** follow canonical persistent pattern
- **Explicit override:** "Ephemeral debug state (no LocalStorage)"

If neither appears, Codex output is considered incorrect.



====================================================================================================


## Canonical defaults pattern (D / DEFAULTS)
When a UI component has meaningful default values for its props, those defaults MUST be defined once on `D` (aka `DEFAULTS`) and reused everywhere.

### Rules

- Define defaults on `D` with a strongly typed mapping back to the public props:
  ```ts
  export const D = {
    split: [0.35, 0.65] satisfies P['split'],
  } as const;
  ```

- Use `D` as the single source of truth for:
  - Component prop destructuring defaults
    ```ts
    const { split = D.split } = props;
    ```
  - `-SPEC.Debug.tsx` defaults / storage seeding
  - Any dev or test harness defaults

- Never re-encode literal defaults in multiple places.
  - If a default exists, it lives on `D`.
  - If no default exists, the prop must remain `undefined` unless explicitly supplied.

### Rationale

- Guarantees consistency between runtime behavior, debug specs, and harnesses.
- Makes defaults discoverable and reviewable in one place.
- Prevents Codex drift caused by duplicated literals.
- Keeps defaults aligned with the actual public prop surface via `satisfies`.

### Plan-level guardrail (for Codex)

Plans that introduce or rely on defaults MUST explicitly include:
- “Add defaults to `D` using `satisfies P['prop']`”
- “Reuse `D.*` for component destructuring and debug defaults”


====================================================================================================



## Commit discipline
- One phase → one commit.
- Commit as soon as the phase is proven.
- Commit messages should reference the phase intent.

Example:
- `Layout.TreeSplit: phase-1 guardrail tidy`

This keeps the history readable and Codex-friendly.


====================================================================================================


## Fatigue-aware operation
This protocol is designed to work under load.

When tired:
- Shrink plans, do not skip them.
- Enforce guardrails more strictly, not less.
- Prefer “stop + tidy + commit” over pushing forward.

Clean stopping points preserve the next session’s leverage.

====================================================================================================

## Summary

- Plan small.
- Obey guardrails.
- Trust public surfaces.
- Separate placeholder from real content.
- Commit early and often.

This is how we move fast **without** eroding the system.
