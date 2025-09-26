# @sys/std
Standard system library.  
Common low(ish)-level utility functions and helpers.

```ts
import type { t } from 'jsr:@sys/std/t';
import { Obj, Arr, Num, Str } from 'jsr:@sys/std';
```


### Runtimes
- [`jsr:@sys/std`](https://jsr.io/@sys/std) ← Browser + [WinterTG](https://wintertc.org/)


<p>&nbsp;<p>

### Usage

```ts
// Types:
import type * as t from 'jsr:@sys/std/t';                // ↓
import type { t } from 'jsr:@sys/std';                   // ↑  (alternative)

// Common:
export { Arr, Err, Is, Num, Obj, Pkg, Str, Time } from 'jsr:@sys/std';
import { Args, Dispose, Path, Schedule, Signal } from 'jsr:@sys/std';

import { DateTime, Time } from 'jsr:@sys/std/date';
import { Immutable } from 'jsr:@sys/std/immutable';
import { Rx } from 'jsr:@sys/std/rx'; // event streams.

// Unit-testing:
import { Testing } from 'jsr:@sys/std/testing';          // ↓
import { Testing } from 'jsr:@sys/std/testing/server';   // ↑  (alternative)
```
