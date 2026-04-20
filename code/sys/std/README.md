# Standard Lib
Standard system libraries.
Common low(ish)-level utility functions and helpers.

```ts
import type { t } from 'jsr:@sys/std/t';
import { Num } from 'jsr:@sys/std/num';
import { Pkg } from 'jsr:@sys/std/pkg';
import { Str } from 'jsr:@sys/std/str';
import { Obj } from 'jsr:@sys/std/value';
```


### Runtimes
- [jsr:`@sys/std`](https://jsr.io/@sys/std) ← Browser + [WinterTG](https://wintertc.org/)

#### see also (primitives):
- [jsr:`@sys/types`](https://jsr.io/@sys/types)
---
- [jsr:`@sys/fs`](https://jsr.io/@sys/fs)
- [jsr:`@sys/cli`](https://jsr.io/@sys/cli)
- [jsr:`@sys/http`](https://jsr.io/@sys/http)
- [jsr:`@sys/process`](https://jsr.io/@sys/process)
---
- [jsr:`@sys/crdt`](https://jsr.io/@sys/crdt)
- [jsr:`@sys/schema`](https://jsr.io/@sys/schema)
<p>&nbsp;<p>

## Usage

```ts
// Types:
import type * as t from 'jsr:@sys/std/t';
import type { t } from 'jsr:@sys/std';

// Common:
export { Arr } from 'jsr:@sys/std/arr';
export { Err } from 'jsr:@sys/std/error';
export { Is } from 'jsr:@sys/std/is';
export { Num } from 'jsr:@sys/std/num';
export { Pkg } from 'jsr:@sys/std/pkg';
export { Str } from 'jsr:@sys/std/str';
export { Time } from 'jsr:@sys/std/time';
export { Obj } from 'jsr:@sys/std/value';

import { Args } from 'jsr:@sys/std/args';
import { Schedule } from 'jsr:@sys/std/async';
import { Dispose } from 'jsr:@sys/std';
import { Path } from 'jsr:@sys/std/path';
import { Signal } from 'jsr:@sys/std/signal';
import { Date, Time } from 'jsr:@sys/std/time';
import { Rx } from 'jsr:@sys/std/rx';

// Unit-testing:
import { Testing } from 'jsr:@sys/std/testing';
import { Testing } from 'jsr:@sys/std/testing/server';
```
