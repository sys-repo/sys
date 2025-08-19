# @sys/ui-factory

Tiny primitives for declarative UI composition.  

### Factory
A factory is `data` ("**specs**") + a lazy `view` loader.  

### Specs
Specs declare unique `id`, `schema`, and `slots`.

### Slots
Slots are named attachment points a `view` exposes for placing **child** `views` within its `layout`.

### View
A `view` is a renderable unit — library-independent (default adapter: `JSX → react`).

## Usage

```ts
import { pkg } from '@sys/ui-factory';
```
