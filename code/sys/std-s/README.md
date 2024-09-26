# @sys/std-s
Standard library for running within (non-browser) server environments.

Surfaces and augments, with server specific modules, the "[@sys/std](https://jsr.io/@sys)" module which in turn surfaces the deno "[@std libs](https://jsr.io/@std)" module(s).


### System Namespace:

- [`jsr: @sys/std`](https://jsr.io/@sys/std)
- [`jsr: @sys/std-s`](https://jsr.io/@sys/std-s)


### Example

```ts
import type * as t from 'jsr:@sys/std-s/t';

import { Fs } from 'jsr:@sys/std-s/fs';
import { Cmd } from 'jsr:@sys/std-s/process';
import { Server } from 'jsr:@sys/std-s/server';
import { Testing } from 'jsr:@sys/std-s/testing';
```
