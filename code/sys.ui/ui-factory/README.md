# @sys/ui-factory

Tiny primitives for declarative UI composition.  

----

## Core
`Factory` → [ `Specs` → `Plan` ] → `View` → `Slots`

- #### Factory
  A factory is `{data}` + a lazy `view` loader.  
  	•	**Data**: the component `specs`, composed into a `plan` (a blueprint of structure and `slots`).  
  	•	**Loader**: the mechanism that resolves `specs` into live `views` at runtime.

- #### Specs → Plan
  A **plan** is the declarative blueprint a factory follows when **instantiating views**.  
  It is made up of **specs** consisting of:  
  - a unique component `id`, 
  - a JSONSchema `schema` and inferred TypeScript `types`,
  - the available layout `slots` for child placement.

- #### Slots
  Slots are named attachment points a `view` exposes for placing **child** `views` within its `layout`.

- #### View
  A `view` is a renderable unit that is library-agnostic.  
  Use independently imported **host adapters** to bridge to concrete UI runtimes.   
  (default adapter: `JSX → react`).



### Usage
```ts
import { Factory } from '@sys/ui-factory'; // ← core
import { Factory } from '@sys/ui-factory/core';

// Host adapters (concrete UI runtimes):
import { HostAdapter } from '@sys/ui-factory/react';
```


## Host Adapters
The **host adapter** pattern bridges the `@sys/ui-factory` **core** abstractions into 
a concrete runtime environment 


### Host Adapter: React
The [React](https://react.dev/) host adapter interprets resolved plans from a factory 
as real `React` elements:

- Each registration's `load()` produces a `ReactModule` with a `default` component.
- The adapter implements the `HostAdapter` rendering contract for [React](https://react.dev/).
- Together, `Factory` + `Plan` + `Renderer` produce a [React](https://react.dev/) tree.

#### Example: React
```ts
import { Factory } from '@sys/ui-factory/core';
import { renderPlan } from '@sys/ui-factory/react';

import type { Plan, ReactRegistration } from '@sys/ui-factory/t';

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

## Type Inference
Schemas act as the **single source of truth**.

They are exported as `TSchema` objects, which is **JSR-safe** (avoids the "slow type" constraint), 
and consumers infer types locally:
```ts
import { Type } from '@sys/schema';
import type { TSchema } from '@sys/schema/t';

// In a package (export side):
export const HelloSchema: TSchema = Type.Object({
  name: Type.Optional(Type.String()),
});
```

Consumers derive strong types directly from the schema:
```ts
import { HelloSchema } from '@sys/ui-factory/test/samples';
import type { Infer } from '@sys/ui-factory/t';

type Hello = Infer<typeof HelloSchema>; 
// → { name?: string }
```


## File Layout Guidance
A catalog is a type-safe bundle of schemas and UI definitions, shipped as a single import.

```
catalog/
  ├─ ui/
  │   ├─ Hello/
  │   │   ├─ schema.ts       ← Type.Object(...)
  │   │   ├─ spec.ts         ← ViewSpec                 ← id, slots, schema
  │   │   ├─ ui.tsx          ← View implementation      ← JSX or whatever (adapter specific)
  │   │   └─ mod.ts          ← exports:                 ← Hello's schema, spec, view
  ├─ regs.ts                 ← central Registration[]   ← built from /ui/
  ├─ plans.ts                ← UI composition plans     ← hierarchical structures of components
  └─ mod.ts                  ← Entrypoint
```


## Live
```
@sys/ui-factory: HostAdapter
```
**Dev (Harness):** [sys.ui.factory: HostAdapter → React](https://fs.db.team/sys/ui.factory/?dev=5066379583419)

