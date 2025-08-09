# @sys/std
Standard system libraries.  
Common low(ish)-level utility functions and helpers.

```ts
import type { t } from 'jsr:@sys/std/t';
import { Obj, Arr, Num, Str } from 'jsr:@sys/std';
```


### System:Std (Standard)

- [`jsr:@sys/std`](https://jsr.io/@sys/std) ← Browser + WinterTG



<p>&nbsp;<p>


## Example

```ts
import type * as t from 'jsr:@sys/std/t';                // ↓
import type { t } from 'jsr:@sys/std';                   // ↑  (alternative)

import { Args, Async, Dispose, Path } from 'jsr:@sys/std';

import { Args } from 'jsr:@sys/std/args';
import { DateTime, Time } from 'jsr:@sys/std/date';
import { Immutable } from 'jsr:@sys/std/immutable';

import { Testing } from 'jsr:@sys/std/testing';          // ↓
import { Testing } from 'jsr:@sys/std/testing/server';   // ↑  (alternative)
```
