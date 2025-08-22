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
🐷

import { Factory, Plan, Renderer } from '@sys/ui-factory/core';
import { HostAdapter } from '@sys/ui-factory/react';
 
const resolved = await Plan.resolve(plan, factory);
const app = Renderer.mount(resolved.root, HostAdapter);
```
