# Phase 1 execution plan (Codex-ready)

## Scope
Only: `code/sys.driver/driver-slug`
No edits in:
- `code/sys.ui/ui-react-components`
- `deploy/@tdb.edu.slug`

## Files to create
1) `src/t.ts`
- Types:
  - `Result<T>`
  - `SlugClientError`
  - `SlugClientLib` (Url + 3 loaders)

2) `src/m.Url.ts`
- `SlugUrl.clean(docid)`
- `assetsFilename(cleanDocid)`
- `playbackFilename(cleanDocid)`

3) `src/u.loadAssetsFromEndpoint.ts`
- Fetch `${baseUrl}/manifests/${assetsFilename(clean)}`
- `RequestInit` merge rule: `const req: RequestInit = { ...init, cache: 'no-cache' }`
- Validate with `AssetsSchema.Manifest.parse`
- Enforce `parsed.value.docid === clean`

4) `src/u.loadPlaybackFromEndpoint.ts`
- Same pattern; `PlaybackSchema.Manifest.parse(json, payload)`
- Enforce `parsed.value.docid === clean`

5) `src/u.loadBundleFromEndpoint.ts`
- Calls assets+playback loaders
- Builds `assetMap` key `${kind}:${logicalPath}`
- `normalizeHref` ported from ui-react-components:
  - absolute http(s) passthrough
  - leading '/' resolves against `${base.origin}${basePath}${href}`
  - else resolves against `baseUrl`
- Returns `t.TimecodePlaybackDriver.Wire.Bundle<Payload>`:
  - `{ docid: clean, spec: { composition, beats }, resolveAsset }`

6) `src/m.Client.ts`
- `export const SlugClient: SlugClientLib = { Url: SlugUrl, ... }`

7) `src/mod.ts`
```ts
/**
 * @module
 */
export * from './m.Client.ts';
export * from './m.Url.ts';
export type * from './t.ts';
```

## Imports (truth)
- `AssetsSchema` from `@sys/schema/wire/slug/assets`
- `PlaybackSchema` from `@sys/schema/wire/timecode/playback`
- Fetcher/URL helpers from sys conventions (match existing `Http.fetcher()` + `Url.parse().join()` idiom).

## Error shaping
- HTTP error:
  - `kind: 'http'`
  - include `status`, `statusText`, `url`
- Schema error:
  - `kind: 'schema'`
  - message includes validator reason
- Docid mismatch treated as schema error.

## Tests
Create `src/-test/u.loadBundleFromEndpoint.test.ts` with:
- happy path bundle + resolveAsset works
- http fail (assets 404) → kind='http'
- schema fail (invalid playback) → kind='schema'
- docid mismatch → kind='schema'
- href normalization case (relative + leading slash)

## Run
From `code/sys.driver/driver-slug`:
- `deno task check`
- `deno task test`
