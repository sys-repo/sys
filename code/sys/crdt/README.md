# CRDT
System [CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) tools providing the default [`Immutable<T>`](https://github.com/sys-repo/sys/blob/main/README.md#immutablet) interface for distributed state.  

Built on the [Ink & Switch](https://www.inkandswitch.com/) industrial research lab's **Automerge** replicated data structure, the de facto standard, surfaced via [`@sys/driver-automerge`](https://jsr.io/@sys/driver-automerge).

This module serves as the system entry point for CRDT management:
- Clean, minimal import path: `@sys/crdt`
- Defaults to Automerge as the system “standard”
- CRDT-safe (memory)


### Usage
```ts
// t.ts | type namespace:
export type { Crdt } from 'jsr:@sys/crdt/t';
```

Runtime: **Browser**
```ts
import type * as t from './t.ts';
import { Crdt } from 'jsr:@sys/crdt/web';

// Or with UI components
import { Crdt } from 'jsr:@sys/crdt/web/ui';
```

Runtime: **File System**
```ts
import type * as t from './t.ts';
import { Crdt } from 'jsr:@sys/crdt/fs';
```
