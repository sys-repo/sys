# @sys/ui-factory

Tiny primitives for declarative UI composition.  

----

## Core
`Factory` → [ `Specs` → `Plan` ] → `View` → `Slots`


- #### Factory
  A factory is `{data}` + a lazy `view` loader.  
  	•	**Data**: the component `specs`, composed into a `plan` (a blueprint of structure and `slots`).  
  	•	**Loader**: the mechanism that resolves `specs` into live `views` at runtime 
      (dynamic ESM import, code-split boundaries).

**Note**: Using [standard dynamic `import()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) within the Loader in ESM naturally defines bundle boundaries, with code-splitting handled automatically by the bundler as a consequence.

---

- #### Specs → Plan → Validation
  A **plan** is the declarative blueprint a factory follows when **instantiating views**.  
  It is made up of **specs** consisting of:  
  - a unique component `id`.
  - A [JSON Schema–compatible](https://json-schema.org/) `schema` with inferred TypeScript `types`, 
implementing [**Standard Schema**](https://standardschema.dev).
  - the available layout `slots` for child placement.

---

- #### Slots
  Slots are named attachment points a `view` exposes for placing **child** `views` within its `layout`.

- #### View
  A `view` is a renderable unit that is library-agnostic.  
  Use independently imported **host adapters** to bridge to concrete UI runtimes.   
  (default adapter: `JSX → react`).

<p>&nbsp;<p>

## Usage
```ts
import { Factory } from 'jsr:@sys/ui-factory/core';

// ↓ Host adapter (hook into concrete UI runtime).
import { HostAdapter } from 'jsr:@sys/ui-factory/react';
```


<p>&nbsp;<p>

## Host Adapters
The **host adapter** pattern bridges the `@sys/ui-factory` **core** abstractions into 
a concrete runtime environment.


### Host Adapter: React
The [React](https://react.dev/) host adapter interprets resolved plans from a factory 
as real `React` elements:

- Each registration's `load()` produces a `ReactModule` with a `default` component.
- The adapter implements the `HostAdapter` rendering contract for [React](https://react.dev/).
- Together, `Factory` + `Plan` + `Renderer` produce a [React](https://react.dev/) tree.

<p>&nbsp;<p>

#### Example: React
```ts
import { Factory } from 'jsr:@sys/ui-factory/core';
import { renderPlan } from 'jsr:@sys/ui-factory/react';

import type { Plan, ReactRegistration } from 'jsr:@sys/ui-factory/t';

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

## Type Inference
Schemas act as the **single source of truth**.

They are exported as `TSchema` objects, which is **JSR-safe** (avoiding the "no slow types" constraint), 
allowing consumers `Infer` types locally:
```ts
import { Type } from 'jsr:@sys/schema';
import type { TSchema } from 'jsr:@sys/schema/t';

// In a package (export side):
export const HelloSchema: TSchema = Type.Object({
  name: Type.Optional(Type.String()),
});
```

Consumers derive strong types directly from the schema:
```ts
import { HelloSchema } from 'jsr:@sys/ui-factory/sample/catalog';
import type { Infer } from 'jsr:@sys/ui-factory/t';

type Hello = Infer<typeof HelloSchema>; 
// → { name?: string }
```

<p>&nbsp;<p>


## File Layout Guidance
A catalog is a type-safe bundle of schemas and UI definitions, shipped as a 
single [`import`](https://tc39.es/ecma262/#sec-import-calls).

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
Plans may be checked against each view's `schema` ([`JsonSchema`](https://json-schema.org/draft/2020-12/json-schema-core.html)) during development 
ensuring mismatches are surfaced early. Validation can also be re-run
in `production` ("always") if need be, for instance when the UI factories are being dynamically re-defined and modified by the host application.

```ts
const { ok, element, issues } = useFactory(factory, plan, { validate: 'always' });
// issues.runtime     → Error | undefined
// issues.validation  → { id, path, message }[]
```

<p>&nbsp;<p>

## Live
**Dev Harness:** 
- [sys.ui.factory: HostAdapter → React](https://fs.db.team/sys/ui.factory/?dev=5066379583419)

