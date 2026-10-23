# @sys/types

Shared type vocabulary for system modules. These contracts describe values and behavior; they do not
implement the resources they describe.

Use type-only imports so the dependency is erased from emitted JavaScript:

```ts
import type { ImmutableRef } from 'jsr:@sys/types/t';

type Counter = ImmutableRef<{ count: number }>;
```

The root also exports runtime package metadata (`pkg` and `distTypePath`). `/t` exports types only;
implementations such as immutable references live in their owning packages.

See the [type documentation](https://jsr.io/@sys/types/doc) for the shared contracts.
