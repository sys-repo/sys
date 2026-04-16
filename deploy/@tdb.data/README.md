# @tdb/data
Filesystem-backed data staging, runtime clients, and UI helpers for staged slug datasets.

This package stages local source folders and slug datasets into published data roots, provides runtime clients for mounted data, and includes optional UI and dev helpers for inspecting staged outputs.

## Package Root

The package root exposes package metadata only.

```ts
import { pkg } from '@tdb/data';

console.info(pkg.name, pkg.version);
```

## Slug Surface

The working runtime and type surface is namespaced under `@tdb/data/slug`.

```ts
import { DataClient, SlcMounts } from '@tdb/data/slug';
import { SlcDataPipeline } from '@tdb/data/slug/fs';
import { SlcDataCli } from '@tdb/data/slug/cli';
```

## Subpaths

- `@tdb/data/slug`
  - runtime slug dataset client helpers and shared exports
- `@tdb/data/slug/t`
  - package type surface for slug tooling
- `@tdb/data/slug/fs`
  - filesystem staging pipeline helpers
- `@tdb/data/slug/cli`
  - profile-driven staging CLI helpers
- `@tdb/data/slug/ui`
  - runtime UI components for staged slug data
- `@tdb/data/slug/ui/dev`
  - dev-only UI probes for staged slug data
