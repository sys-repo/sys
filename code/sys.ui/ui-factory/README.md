# @sys/ui-factory

Tiny primitives for declarative UI composition.  

- #### Factory
  A factory is `data` ("**specs**") + a lazy `view` loader.  

- #### Specs
  A view specification defines a single factory `component` with a unique `id`, a JSONSchema/TypeScript `schema`, and layout `slots` available to render children into.

- #### Slots
  Slots are named attachment points a `view` exposes for placing **child** `views` within its `layout`.

- #### View
  A `view` is a renderable unit — library-agnostic (default adapter: `JSX → react`).



## Usage
```ts
import { pkg } from '@sys/ui-factory';
```
