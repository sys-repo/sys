# @sys — System Discipline & Non-Negotiables

This document encodes the **canonical engineering, architectural, and aesthetic commitments** governing the `@sys` monorepo. It serves as the **immune system** for design, implementation, review, and AI-assisted collaboration.

This document is **descriptive, not aspirational**. It reflects how the system is actually built and how it must continue to evolve.

---

## Core Philosophy

### Elegance Over Expedience
Quality is measured by:
- **Modularity** — clear boundaries, single responsibility
- **Cohesion** — related concerns stay together
- **Separation of Concerns** — one module, one concept
- **Clean Abstraction** — information hiding, honest interfaces
- **Loose Coupling** — minimal dependencies, late binding

**Never optimize for speed or convenience at the expense of structural integrity.**

---

### Reduction-First Design
- **Types before implementation** — shape the problem space first
- **One concept → one noun** — eliminate overloaded terms
- **Honest duplication over premature indirection** — prove the abstraction first
- **No speculative APIs** — build only what is needed, when it is needed
- **Orchestration lives outside primitives** — workflows belong at the edges

---

### Local-First, Open System
- **No hidden magic** — legible, inspectable, runnable locally
- **No opaque runtime coupling** — explicit dependencies only
- **No cloud dependency assumptions** — distributed-first, not server-first
- **Standards-locked** — W3C, ECMA/TC39 (ESM), WinterCG

---

### Truthful APIs
**Never expose shapes, options, or abstractions that the underlying library or runtime does not actually support.**

If a library provides 3 options, expose 3 options.
If it provides 12, expose 12.

No invented convenience layers. No divergence from runtime truth.

---

## Language, Runtime, and Tooling

### Mandatory
- **TypeScript only** (treat JS as TS unless explicitly stated otherwise)
- **Deno-first** — ESM, URL imports, web standards, secure by default
- **JSR packages** — canonical distribution (`jsr.io/@sys`)
- **No classes by default** — functional, composable modules
- **No `this`** — no implicit context
- **Avoid `as`** except at explicit interop or branding boundaries
- **`readonly` by default** — prefer `readonly T[]`, immutable data shapes

### Forbidden
- CommonJS (`require`, `module.exports`)
- Implicit globals
- Mutation without explicit justification
- Framework coupling in pure logic layers
- **`console.log`** in the sys repo
  - `console.info` only for intentional lifecycle markers
  - `warn` / `error` sparingly and semantically

---

## Namespace & Package Structure

### Domain Organization (Not Layers)
```
@sys/std              → pure, framework-free logic
@sys/types            → shared type primitives, compile-time utilities
@sys/event            → event algebra, stream semantics (incl. bus)
@sys/event/cmd        → command algebra, unary + streaming commands
@sys/immutable        → immutable state primitives + traits
@sys/schema           → JSONSchema, strongly typed runtime schema validation (Standard Schema)
@sys/tools/*          → CLI tools (local-first, interactive when needed)
@sys/ui-*             → System UI namespace
@sys/ui-state/*       → pure UI state machines and reducers
@sys/ui-react-*       → thin React adapters only (never source of truth)
@sys/driver-*         → runtime/platform adapters (Monaco, Automerge, Vite, etc.)
@sys/dev              → programming system layer, DevHarness, authoring tools
```

### Anti-Pattern: Browser / Server Split
**Never organize by deployment target.**

Prefer semantic domains: `ui`, `state`, `driver`, `runtime`, `edge`.

---

## File, Module, and Naming Layout

### Canonical Surfaces
- **`mod.ts` is the public module root**
  - Single intentional import surface
  - Re-exports stable public APIs (types + values)
- Internal files exist to support `mod.ts`, not replace it

---

### Filenames Encode Role

Use filenames to make intent obvious without opening the file.

- **`t.ts`** → canonical types for the package/module (the type spine)
  - Default pattern across the repo
  - `*.t.ts` may exist as a *local* pattern, not a global rule
- **`u.<name>.ts`** → utility helpers
  - Pure, local, boring
  - If a utility becomes a concept, it must be renamed and promoted
- **`m.<CapsName>.ts`** → named internal module parts
  - Represents a deliberate noun-bound sub-surface
  - Capitalization signals semantic weight
- **`main.ts` is not canonical** in @sys
  - Prefer `mod.ts` + `m.*` + `u.*`

---

### Folder Layout
Prefer shallow folders. Organize by semantic domain, not deployment target.

```
/
├─ mod.ts
├─ t.ts
├─ m.<Name>.ts
├─ u.<name>.ts
└─ -test/
   └─ -<name>.test.ts
```

### Rules of Motion
- `mod.ts` is stable and boring — never a scratchpad
- Excess `m.*` files indicate unclear concepts
- Excess `u.*` files indicate naming avoidance

---

## Types plane (cycle-safe) convention
We treat TypeScript types as a separate "contract plane" to avoid fragile ESM runtime import cycles and to keep public surfaces explicit.

### Rules
- All public types live in `t.ts` and `t.*.ts` (module-local type files).
- `src/types.ts` (exported as `./t` in `deno.json`) re-exports all public types for the package.
- All runtime modules import types via the package type pool (typically through `common.ts`), e.g. `import type { t } from "../common.ts"`.
- Do not import types by reaching into runtime modules.
- Submodules may add their own local `common.ts` convenience aggregator when needed.

### Containment rule
- If an internal-only area needs to stay out of the shared type pool, keep its extra types/exports out of:
  - `src/types.ts` (package-wide `./t`)
  - the root `common.ts` pool
- In that case, use a local `common.ts` within the internal area and import its types from there.

### Hard invariant
- No runtime in the type plane.
  - `t.ts` / `t.*.ts` must not export values or import runtime modules (no side effects, no convenience re-exports).

### Deno exports
- Each package exports `./t` (and `./types`) → `./src/types.ts` so the contract plane is a stable import target.

---

## Testing Discipline

### Location and Naming
- Tests live in **`/-test/`**
- Test files are named **`-<name>.test.ts`**
- Tests are part of the module's contract

Example:
```
-test/
  ├─ -normalize.test.ts
  └─ -u.filename.test.ts
```

---

### BDD + Expect

```typescript
import { describe, it, expect } from "@std/testing/bdd";

describe("Thing", () => {
  it("preserves identity when no wrapping occurs", () => {
    const result = fn(input);
    expect(result).equal(input); // identity
  });

  it("produces structurally equivalent output", () => {
    const result = fn(input);
    expect(result).eql({ foo: 1 }); // deep equality
  });
});
```

### Test Principles
- **Tests assert invariants**, not vibes
- **`.equal`** only for identity (same instance)
- **`.eql`** for structural equality
- **Prefer real implementations**
- **Lifecycle tests where side-effects exist** (init → operate → dispose)

---

## Immutable — Universal State Primitive

### Kernel (Minimal)

The kernel stays intentionally small. Capabilities layer via explicit traits.

```typescript
export type ImmutableRef<T> = {
  readonly current: T;
  readonly change: (fn: (draft: T) => void) => void;
  readonly events: {
    readonly $: Observable<unknown>;
    readonly dispose: () => void;
  };
};
```

### Traits (Layered Capabilities)
- `PersistableImmutableRef<T>`
- `VersionedImmutableRef<T>`
- `AdvancedImmutableRef<T>` (only when earned)

### Events
- **Events form a typed change stream**
- **Prefer standards-aligned patch formats** (e.g. RFC-6902) when applicable
- **Never force a patch model that lies about the underlying substrate**

### Principles
- **One pattern, many systems**
- **Lifecycle explicit**
- **No implicit subscriptions**

---

## UI & React Discipline

### React as Adapter Layer
**React is never the source of truth.**

- State machines live **outside React**
- Hooks are **thin wiring**, not logic containers
- Compound components are **wired once, exported immutable**
- DevHarness replaces Storybook (Spec + Dev + Signal)

### Anti-Patterns

```typescript
// ❌ BAD
function MyComponent() {
  const [data, setData] = useState(/* logic */);
  useEffect(() => { /* side-effects */ }, []);
}

// ✅ GOOD
function MyComponent() {
  const state = useStateMachine(machine);
  return <View {...state} />;
}
```

### Compound Components

Wire once. Export immutable.

```typescript
export const MyCard = {
  Root: CardRoot,
  Header: CardHeader,
  Body: CardBody,
} as const;
```

---

## Eventing, State, and Control Flow

### Explicit Readiness

**No implicit initial flags.**

Controllers emit explicit readiness events.

---

### Side-Effects: Single Ownership
- **One owner per side-effect domain**
- **Observers observe; owners act**
- **Cleanup is mandatory and explicit**

---

### CRDT as Coordination Surface
- **CRDT = collaboration and control**, not bulk storage
- **Heavy artifacts live outside CRDT** — filesystem, SQLite, providers
- **CRDT stores pointers, metadata, and intent**

---

### Loop Prevention
- **Source tagging** required
- **Explicit translation at boundaries**
- **No implicit propagation**

---

## CLI & UX Principles

### Interaction
- **Interactive by default** when ambiguity exists
- **Never hide broken substrates**
- **Failure must be legible, bounded, and non-humiliating**
- **Prefer boring explicit tools over clever abstractions**

### Output
- **Tuftean restraint**
- **White space is intentional**
- **Naming is part of the API**

---

## Driver Pattern

### Purpose
Thin bindings to external engines (Monaco, Automerge, Vite, etc.)

### Rules
- **Truthful APIs only**
- **Side-effects centralized and owned**
- **Lifecycle tests required**
- **Drivers translate; they do not decide**

```typescript
export type MonacoDriver = {
  readonly editor: monaco.editor.IStandaloneCodeEditor;
  readonly setValue: (value: string) => void;
  readonly dispose: () => void;
};

export function create(el: HTMLElement): MonacoDriver {
  const editor = monaco.editor.create(el, /* options */);
  return {
    editor,
    setValue: (v) => editor.setValue(v),
    dispose: () => editor.dispose(),
  };
}
```

---

## Collaboration Rules (Human + AI)

### Constraints
1. **Never guess missing context** — stop and ask
2. **Never invent APIs or behavior**
3. **Keep original implementations byte-for-byte** unless explicitly changing
4. **Wrap all edits in labeled change markers**
5. **Go slow** — correctness compounds

### Surgical Change Protocol
Every change must be wrapped in paired markers:

```typescript
// 🌸🌸 ---------- ADDED: feature-name ----------
// new code here
// 🌸 ---------- /ADDED ----------

// 🌸🌸 ---------- CHANGED: existing-function ----------
// modified code here
// 🌸 ---------- /CHANGED ----------

// 🌸🌸 ---------- REMOVED: deprecated-api ----------
// 🌸 ---------- /REMOVED ----------
```

**ACTION ∈ {ADDED, CHANGED, REMOVED, FIXED, REFACTORED}**

- One action type per block
- No nesting
- Only ASCII quotes in markers
- Edits strictly inside markers

---

## Aesthetic Commitments

### Tuftean Restraint
- **Maximize signal, minimize ornament**
- **Every character earns its place**
- **Consistency enables comparison**

---

### Unix Philosophy (McIlroy)
1. **Write programs that do one thing well**
2. **Expect output to become input to another program**
3. **Design to be tried early**
4. **Prefer tools over unskilled help**

---

### Kay (Used Carefully)
- **Simple things simple, complex things possible**
- **Late binding is powerful — use it with discipline**
- **Relationships matter more than rigid structure**

---

### Engelbart
- **Tools augment human intellect**
- **Cut-and-try co-exists with rigor**
- **Integrated notation + intuition**

---

## North Star

This system is a **thinking harness**:

A disciplined, local-first, deeply typed environment for building **tools-for-thought** that can plausibly last a decade without architectural regret.

**Not a framework. A discipline.**

---

**Version**: 1.0.0
**Canonical Location**: `.claude/SYSTEM.md`
