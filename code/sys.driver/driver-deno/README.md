# Deno Driver
Tools for working with the [Deno Runtime](https://docs.deno.com/runtime/) and
Deno cloud platform surfaces.

### Exports

- `jsr:@sys/driver-deno` → package metadata (`pkg`)
- `jsr:@sys/driver-deno/runtime` → runtime/workspace helpers such as `DenoFile` and `DenoDeps`
- `jsr:@sys/driver-deno/cloud` → cloud platform helpers such as `DenoDeploy`

### Example

Read a workspace file and inspect monorepo imports:

```ts
import { DenoDeps, DenoFile } from 'jsr:@sys/driver-deno/runtime';

const workspace = await DenoFile.workspace('./deno.json');
const deps = await DenoDeps.from('./deps.yaml');
```
