# @sys/registry

Read JSR and npm package metadata and retrieve JSR source files.

The root exports package metadata and types. Choose a registry entry point:

- [`/jsr`](https://jsr.io/@sys/registry/doc/jsr/client), also `/jsr/client`: `Jsr` helpers for
  versions, package information, and source files.
- [`/npm`](https://jsr.io/@sys/registry/doc/npm/client), also `/npm/client`: `Npm` package metadata
  helpers.
- [`/jsr/server`](https://jsr.io/@sys/registry/doc/jsr/server): adds source manifests and optional
  filesystem writes through `Jsr.Manifest`.

Type-only contracts are available from `/t`.

## Read JSR versions

```ts
import { Jsr } from 'jsr:@sys/registry/jsr';

const result = await Jsr.Fetch.Pkg.versions('@sys/std');
if (!result.ok) throw result.error;

console.info(result.data.latest);
```

This makes a network request to JSR. Check `ok` before reading response data. Version lists and
latest-version lookups request fresh metadata by default; pass `{ fresh: false }` when a cached
response is acceptable.

Use `Jsr.Fetch.Pkg.info(name, version)` for a specific version's manifest, exports, and normalized
module graph.

## Pull source files

From `/jsr/server`, call `Jsr.Manifest.fetch` and check `ok` before using the returned `manifest`.
Pass a destination to `manifest.pull` to write its files beneath that directory.

Fetch success and write success are separate: a pull's `ok` covers file fetches; inspect `error` for
write failures too. A failed pull may already have written files.

See the [package API](https://jsr.io/@sys/registry/doc) and
[JSR API reference](https://jsr.io/docs/api) for request and result details.
