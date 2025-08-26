# @sys/ui-factory
Tiny primitives for declarative UI composition.  

---

|   | Stage         | Primitive  |
|---|---------------|------------|
| ↓ | Definition    | `factory`  |
| ↓ | Composition   | `specs`    |
| ↓ | Instantiation | `plan`     |
| ↓ | Rendering     | `view`     |
| ↓ | Placement     | `slots`    |

…resolved and validated across **context boundaries**.


## Core
### Factory
A factory is `{data}` + a lazy `view` loader.  

  •	**Data**: the component `specs`, composed into a `plan` (a blueprint of structure and `slots`).  
  •	**Loader**: the mechanism that resolves `specs` into live `views` at runtime 
    (dynamic ESM import, code-split boundaries).


**Note:** Factories use standard [dynamic `import()`](https://github.com/tc39/proposal-dynamic-import) (TC39) within the factory's loader. As a consequence, code is naturally split across ESM module boundaries.

These boundaries typically align with the natural namespacing seams of the consuming `host`,
forming **context boundaries** within the larger system.

```ts
const catalog = await import('@namespace/my-catalog');
```


---

### Specs → Plan → Validation
  A **plan** is the declarative blueprint a factory follows when **instantiating views**.  
  It is made up of **specs** consisting of:  
  - a unique component `id`.
  - A [JSON Schema–compatible](https://json-schema.org/) `schema` with inferred TypeScript `types`, 
implementing [**Standard Schema**](https://standardschema.dev).
  - the available layout `slots` for child placement.

---

### Slots
  Slots are named attachment points a `view` exposes for placing **child** `views` within its `layout`.

### View
  A `view` is a renderable unit that is library-agnostic.  
  Use independently imported **host adapters** to bridge to concrete UI runtimes.   
  (default adapter: `JSX → react`).

<p>&nbsp;<p>

## Usage
```ts
import { Factory }     from 'jsr:@sys/ui-factory/core';
import { HostAdapter } from 'jsr:@sys/ui-factory/react'; // ← Host adapter (hook into concrete UI runtime).
```

<p>&nbsp;<p>

## Schema → Type Inference
`specs` embed **Schemas**, which serve as the **single source of truth** for a `Catalog`’s public API surface.  
They are exported as `TSchema` objects (which are **JSR-safe**, avoiding the “no slow types” constraint),  
allowing consumers to `Infer` precise types locally — **without drift**.


```ts
import { Type } from 'jsr:@sys/schema';
import type { TSchema } from 'jsr:@sys/schema/t';

// In a package (export side):
export const HelloSchema: TSchema = Type.Object({
  name: Type.Optional(Type.String()),
});
```

Consumers may derive strong `types` directly from the imported catalog `schema`:
```ts
import { HelloSchema } from 'jsr:@sys/ui-factory/sample/catalog';
import type { Infer } from 'jsr:@sys/ui-factory/t';

type Hello = Infer<typeof HelloSchema>; 
// → { name?: string }
```

<p>&nbsp;<p>




<p>&nbsp;<p>

## Host Adapters
The **host adapter** pattern bridges the `@sys/ui-factory` **core** abstractions into 
a concrete runtime environment.


### React Host Adapter
The [React](https://react.dev/) host adapter interprets resolved plans from a factory 
as real `React` elements:

- Each registration's `load()` produces a `ReactModule` with a `default` component.
- The adapter implements the `HostAdapter` rendering contract for [React](https://react.dev/).
- Together, `Factory` + `Plan` + `Renderer` produce a [React](https://react.dev/) tree.

<p>&nbsp;<p>

#### Example: React
```ts
import type { Plan, ReactRegistration } from 'jsr:@sys/ui-factory/t';
import { Factory }                      from 'jsr:@sys/ui-factory/core';
import { renderPlan }                   from 'jsr:@sys/ui-factory/react';

// 1. Define registrations (components).
const regs = [
  {
    spec: { id: 'Hello:view', slots: [] },
    load: async () => ({ default: (props: { name: string }) => <h1>Hello, {props.name}!</h1> }),
  },
] satisfies readonly ReactRegistration<'Hello:view'>[];

// 2. Build a factory.
const factory = Factory.make(regs);

// 3. Author a simple plan.
const plan: Plan<typeof factory> = {
  root: { component: 'Hello:view', props: { name: 'World' } },
};

// 4. Render to a React element.
const element = await renderPlan(plan, factory);

// 🌳
// → `element` is a React tree you can pass into <App/> or ReactDOM.render
```

<p>&nbsp;<p>

## File Layout Guidance
A **catalog** is a type-safe bundle of schemas and UI definitions, shipped as a 
single [dynamic `import()`](https://github.com/tc39/proposal-dynamic-import).

```
catalog/
  ├─ ui/
  │   ├─ Hello/
  │   │   ├─ schema.ts       ← Type.Object(...)
  │   │   ├─ spec.ts         ← ViewSpec                 ← id, slots, schema
  │   │   ├─ ui.tsx          ← View implementation      ← JSX or whatever (adapter specific)
  │   │   └─ mod.ts          ← exports:                 ← <Hello>'s schema, spec, view
  ├─ regs.ts                 ← central Registration[]   ← built from /ui/
  ├─ plans.ts                ← UI composition plans     ← hierarchical structures of components
  └─ mod.ts                  ← 🌳 (entrypoint)
```

<p>&nbsp;<p>

## Runtime Validation
Plans may be validated against each view's [`JsonSchema`](https://json-schema.org/draft/2020-12/json-schema-core.html) during development or production - ensuring mismatches are surfaced early. 

Validation can also be configured to run "always" (including in production) when required — for example, in scenarios where a live code editor dynamically drives the shape of the UI/Factory Catalog, ensuring factories are continuously validated against user input.


```ts
const { ok, element, issues } = useFactory(factory, plan, { validate: 'always' });
// issues.runtime     → Error | undefined
// issues.validation  → { id, path, message }[]
```

<p>&nbsp;<p>

## Live
**Dev Harness:** 
- [sys.ui.factory: HostAdapter → React](https://fs.db.team/sys/ui.factory/?dev=5066379583419)

