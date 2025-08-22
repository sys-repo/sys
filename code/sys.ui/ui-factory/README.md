# @sys/ui-factory

Tiny primitives for declarative UI composition.  

----
`Factory` → |`Specs` → `Plan`| → `View` → `Slots`

- #### Factory
  A factory is `{data}` + a lazy `view` loader.  
  	•	**Data**: the component `specs`, composed into a `plan` (blueprint of structure and `slots`).  
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
  A `view` is a renderable unit that is library-agnostic. Use **host adapters** to bridge to concrete UI runtimes.   
  (default adapter: `JSX → react`).



## Usage
```ts
import { Factory } from '@sys/ui-factory'; // ← core
import { Factory } from '@sys/ui-factory/core';

// Host adapters (concrete UI runtimes):
import { HostAdapter as ReactHostAdapter } from '@sys/ui-factory/react';
```
