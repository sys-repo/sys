# Deno Driver
A standardized `@sys` workspace remains a real workspace all the way to live
deployment.

Tools for working with the [Deno Runtime](https://docs.deno.com/runtime/) and
Deno cloud platform surfaces.

### Exports

- `jsr:@sys/driver-deno` → package metadata (`pkg`)
- `jsr:@sys/driver-deno/runtime` → runtime/workspace helpers such as `DenoFile` and `DenoDeps`
- `jsr:@sys/driver-deno/cloud` → cloud platform helpers such as `DenoDeploy`

### Example

Load a workspace config and project canonical dependency data from an input file such as `deps.yaml` into `deno.json`, import maps, and optional `package.json` files:

```ts
import { DenoDeps, DenoFile } from 'jsr:@sys/driver-deno/runtime';

const workspace = await DenoFile.workspace('./deno.json');
const deps = await DenoDeps.from('./deps.yaml');
```
