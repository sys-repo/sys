---
name: slc-data-client
description: Use when you need to consume `@tdb/slc-data` from application or UI code through its published client and UI surfaces.
---

# slc-data-client

## Use this skill when
- the task is to load staged or published SLC data from application code
- the task is to discover available mounts at runtime
- the task is to wire `@tdb/slc-data/ui` into a React surface
- the task is to understand which published `@tdb/slc-data` imports are intended for consumer code
- the task is to verify that a client read path is working correctly

## Do not use this skill when
- the task is to create or edit stage profiles
- the task is to run staging workflows
- the task is to deploy staged output
- the task is to edit pipeline or CLI internals rather than consume the published package

## Boundary
- This skill is the consumer-side workflow layer.
- The published package surface is the execution layer.
- Prefer published imports:
  - `@tdb/slc-data`
  - `@tdb/slc-data/ui`
  - `@tdb/slc-data/t`
- Do not import these in application code:
  - `@tdb/slc-data/fs`
  - `@tdb/slc-data/cli`
  - `@tdb/slc-data/dev`
- If the published surface cannot do what is needed, fix the package first rather than bypassing it with internals.

## Published API surface

### `@tdb/slc-data`
```ts
import { DataClient, SlcMounts } from '@tdb/slc-data';
```

- `DataClient.create({ baseUrl, docid, layout? })`
- `DataClient.fromDataset({ origin, dataset, docid?, layout? })`
- `DataClient.Mounts.load(origin)`
- `DataClient.refsFromTree(tree, total?)`
- `DataClient.findHash(entries, ref)`
- `DataClient.selectOrFirst(selected, refs)`
- `SlcMounts`

### `@tdb/slc-data/ui`
```ts
import { HttpOrigin, Mounts } from '@tdb/slc-data/ui';
```

- `HttpOrigin` — origin selector/control
- `Mounts` — runtime mount list

### `@tdb/slc-data/t`
```ts
import type * as t from '@tdb/slc-data/t';
```

- full published type surface

## Result contract

All async `DataClient` reads return `SlugClientResult<T>`:

- `{ ok: true, value }`
- `{ ok: false, error }`

Always check `.ok` before reading `.value`.

Do not assume success.

## Workflow

### 1. Choose the origin

Use the HTTP root that serves staged mounts:

- local/project proxy example:
  - `http://localhost:1234/data/`
- production example:
  - `https://socialleancanvas.com/data/`

This origin should contain:

- `mounts.json`
- `<mount>/manifests/...`
- `<mount>/content/...`

### 2. Discover mounts

```ts
const res = await DataClient.Mounts.load(origin);
if (!res.ok) throw new Error(res.error.message);

const mounts = res.value.mounts;
const dataset = mounts[0]?.mount;
```

Use this when the mount is not already known.

### 3. Create a client

Preferred entry point:

```ts
const client = DataClient.fromDataset({
  origin,
  dataset,
});
```

Use `create(...)` only when you already have the fully resolved base URL and docid.

### 4. Load data

Tree only:

```ts
const tree = await client.Tree.load();
if (!tree.ok) throw new Error(tree.error.message);
```

Tree + content:

```ts
const res = await client.TreeContent.load({ ref });
if (!res.ok) throw new Error(res.error.message);

const value = res.value;
```

Lower-level content access:

```ts
const index = await client.FileContent.index();
if (!index.ok) throw new Error(index.error.message);

const hash = DataClient.findHash(index.value.entries, ref);
if (!hash) throw new Error(`Missing hash for ref: ${ref}`);

const doc = await client.FileContent.get(hash);
if (!doc.ok) throw new Error(doc.error.message);
```

### 5. Integrate into UI

Use `HttpOrigin` when the UI needs environment/origin selection.

Use `Mounts` when the UI needs runtime mount discovery and selection.

Typical shape:

```tsx
const [dataset, setDataset] = React.useState<string | undefined>(undefined);

<Mounts.UI origin={origin} selected={dataset} onSelect={setDataset} />
{dataset && <HttpDataSurface origin={origin} dataset={dataset} />}
```

`Mounts` can own the initial first-mount selection policy.
Downstream consumer components should stay pure and consume `origin + dataset`.

## Verification

Verification is observational:

- `DataClient.Mounts.load(origin)` returns at least one mount
- `DataClient.fromDataset({ origin, dataset })` can load tree/content successfully
- failure cases return `ok: false` with a real error kind/message

For local verification, inspect:

- `<root>/mounts.json`
- `<root>/<mount>/manifests/slug-tree.<mount>.json`
- `<root>/<mount>/content/*.json`

## Source-checkout-only refs

Use these only when debugging or extending the published surface:

- `./src/m/m.client/`
- `./src/m/m.Mounts/`
- `./src/ui/ui.HttpOrigin/`
- `./src/ui/ui.Mounts/`

## Notes
- Keep `DataClient` usage minimal and explicit.
- Keep UI wrappers thin; do not turn debug/dev harness concerns into the app data API.
- The `Mounts` UI is for selection; the `DataClient` API is the actual data-loading contract.
- Deploy is downstream and out of scope for this skill.
