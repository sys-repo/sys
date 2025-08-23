# @sys/ui-factory

Tiny primitives for declarative UI composition.  

----
`Factory` → [`Specs` → `Plan`] → `View` → `Slots`

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
  A `view` is a renderable unit that is library-agnostic. Use independently imported
  **host adapters** to bridge to concrete UI runtimes.   
  (default adapter: `JSX → react`).



## Usage
```ts
import { Factory } from '@sys/ui-factory'; // ← core
import { Factory } from '@sys/ui-factory/core';

// Host adapters (concrete UI runtimes):
import { HostAdapter } from '@sys/ui-factory/react';
```


## Host Adapters
The **host adapter** pattern bridges the core `@sys/ui-factory` abstractions into 
a concrete runtime environment 


### Host Adapter: React
The ([React](https://react.dev/) host adapter interprets resolved plans from a factory 
as real `React` elements:

- Each registration's `load()` produces a `ReactModule` with a `default` component.
- The adapter implements the `HostAdapter` rendering contract for [React](https://react.dev/).
- Together, `Factory` + `Plan` + `Renderer` produce a [React](https://react.dev/) tree.

#### Example
```ts
import { Factory } from '@sys/ui-factory/core';
import { renderPlan } from '@sys/ui-factory/react';
import type { Plan, ReactRegistration } from '@sys/ui-factory/t';

// 1. Define registrations (components).
const regs = [
  {
    spec: { id: 'Hello:view', slots: [] },
    load: async () => ({ default: ({ name }: { name: string }) => <h1>Hello, {name}!</h1> }),
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
// → `element` is a React tree you can pass into <App /> or ReactDOM.render
```
