# @sys/std
Standard system libraries.  
Wraps and extends the audited deno [@std](https://jsr.io/@std) modules ← "standard libs"

### System Namespace:

- [`jsr: @sys/std`](https://jsr.io/@sys/std)
- [`jsr: @sys/std-s`](https://jsr.io/@sys/std-s)


#### Example

```ts
import type * as t from 'jsr:@sys/std/t';

import { Async } from 'jsr:@sys/std';
import { Color, c } from 'jsr:@sys/std';
import { Dispose } from 'jsr:@sys/std';
import { Http } from 'jsr:@sys/std';
import { Path } from 'jsr:@sys/std';
import { Semver } from 'jsr:@sys/std';

import { DateTime, Time } from 'jsr:@sys/std/date';
import { Immutable } from 'jsr:@sys/std/immutable';

import { Testing } from 'jsr:@sys/std/testing';
import { Testing } from 'jsr:@sys/std/testing/server'; // ↑ server alternative.
```
