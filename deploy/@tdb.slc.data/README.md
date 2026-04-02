# @tdb/slc-data
SLC data pipelines and runtime components.

This package is the working home for SLC content generation, local serving, and related data/UI glue.

## API

The published entrypoint currently exposes package metadata and the package type surface.

```ts
import { pkg } from '@tdb/slc-data';

console.info(pkg.name, pkg.version);
```
