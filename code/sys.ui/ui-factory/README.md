# @sys/ui-factory

Tiny primitives for declarative UI composition.  

Factory → Specs → Plan → View → Slots

----

- #### Factory
  A factory is `data` ("**specs**" in a "**plan**") + a lazy `view` loader.  

- #### Specs → Plan
  A **plan** is the declarative blueprint a factory follows.  
  It contains the component **specs** consisting of:  
  - a unique component `id`, 
  - a JSONSchema `schema` and inferred TypeScript `types`,
  - the available layout `slots` for child placement.

- #### Slots
  Slots are named attachment points a `view` exposes for placing **child** `views` within its `layout`.

- #### View
  A `view` is a renderable unit — library-agnostic  
  (default adapter: `JSX → react`).



## Usage
```ts
import { pkg } from '@sys/ui-factory';
```
