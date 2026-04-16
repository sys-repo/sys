# @tdb/data
Filesystem-backed data staging, runtime clients, and UI helpers for staged slug datasets.

This package stages local source folders and slug datasets into published data roots, provides runtime clients for mounted data, and includes optional UI and dev helpers for inspecting staged outputs.

## API

The published entrypoint exposes package metadata, staged-data client helpers, and the package type surface.

```ts
import { pkg } from '@tdb/data';

console.info(pkg.name, pkg.version);
```
