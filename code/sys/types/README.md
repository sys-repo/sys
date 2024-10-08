# Types \<T\>
Common ("standard") type definitions shared between system modules.

### Usage

This library provides no implementations, and is safe to import without out needing to 
worry about exploding bundle size.  To further ensure this is the case, remember to
include the `type` keyword on your imports, eg:

```ts
import type { Immutable } from '@sys/types'
```
