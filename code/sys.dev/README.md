# @sys/dev

Exports package metadata for the system development application. The `/t` entry point exports no
types.

```ts
import { pkg } from 'jsr:@sys/dev';

console.info(pkg.name);
```

The development UI and its local tasks are not public runtime exports. See the
[package documentation](https://jsr.io/@sys/dev/doc) for the published surface.
