# Registry
Namespace entry for working with package registries.

<p>&nbsp;</p>

## Surfaces
- `jsr:@sys/registry` → root namespace package metadata.
- `jsr:@sys/registry/jsr` → JSR client helpers (default entry)
- `jsr:@sys/registry/jsr/client` → explicit JSR client entry.
- `jsr:@sys/registry/jsr/server` → JSR server helpers.

<p>&nbsp;</p>

## JSR
JSR is exposed under this namespace as a registry-specific surface.

JSR docs:
- https://jsr.io/docs/api

Retrieve version information about a package:
```ts
import { Jsr } from 'jsr:@sys/registry/jsr';

const res = await Jsr.Fetch.Pkg.versions('@sys/std');
const data = res.data;
//    ↑  { scope: 'sys', name: 'std', latest: '0.0.42', versions: [Getter] }
```

Retrieve information about a specific package version:
```ts
import { Jsr } from 'jsr:@sys/registry/jsr';

const res = await Jsr.Fetch.Pkg.info('@sys/std', '0.0.42');

// res.data:
//  -  pkg
//  -  manifest
//  -  exports
//  -  graph (moduleGraph1, moduleGraph2)
```

Pull package source locally from the server surface:
```ts
import { Jsr } from 'jsr:@sys/registry/jsr/server';

const { manifest } = await Jsr.Manifest.fetch('@sys/std', '0.0.42');
if (manifest) {
  const pulled = await manifest.pull('./my-modules-dir');
  //                         ↑ saves to: <dir>/@<scope>/<module-name>
  console.log(pulled);
}
```
