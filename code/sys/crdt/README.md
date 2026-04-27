# Crdt Types
Abstract, implementation-agnostic, `type` symbols.  

- see also [jsr:`@sys/crdt`](https://jsr.io/@sys/crdt)

---

### Purpose

Defines CRDT types without binding to any engine.
Kept minimal, depending only on @sys/types, so that @sys/crdt remains a low-level primitive layer, free of circular references.

### Usage
Two equivalent imports — one via the main package, one via the pure type-only library.  

```ts
import type { Crdt } from 'jsr:@sys/crdt/t';    // ← preferred
import type { Crdt } from 'jsr:@sys/crdt-t';    // pure type-lib
```
