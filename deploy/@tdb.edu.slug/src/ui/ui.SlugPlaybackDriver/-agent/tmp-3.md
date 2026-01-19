# Plan: Extract Slug ingest loaders into @sys/driver-slug.
This refactor centralizes HTTP+schema ingest for slug manifests (slug-tree, assets, playback) so call-sites can wire PlaybackDriver bundles in 2–10 lines without duplicating loaders.

## Constraints.
- @sys/schema remains the canonical wire contract only (no fetchers, no mappers, no helpers beyond shape validation).
- @sys/driver-slug owns HTTP fetch + cache policy + manifest URL joining + schema validation + error shaping.
- Payload remains generic: playback loader supports <Payload> but defaults to unknown.

## Step 0: Create module skeleton.
- Create: code/sys.driver/driver-slug/
- Add deno.json with tasks (test/check) matching repo conventions.
- Add exports:
  - "." → ./src/mod.ts
  - "./t" → ./src/t.ts

## Step 1: Define driver-slug public surface (types).
Create `@sys/driver-slug/src/t.ts`:
- export type SlugClientLib = {
  readonly Url: SlugClientUrlLib;
  readonly loadTreeFromEndpoint: (baseUrl, docid, init?) => Promise<Result<t.SlugTreeProps>>;
  readonly loadAssetsFromEndpoint: (baseUrl, docid, init?) => Promise<Result<t.SlugAssetsManifest>>;
  readonly loadPlaybackFromEndpoint: <Payload = unknown>(baseUrl, docid, payload?: Payload, init?) => Promise<Result<t.SlugPlaybackManifest<Payload>>>;
  readonly loadBundleFromEndpoint: <Payload = unknown>(baseUrl, docid, args?: { payload?: Payload; init?: RequestInit; baseHref?: string }) => Promise<Result<t.TimecodePlaybackDriver.Wire.Bundle<Payload>>>;
};
- export Result<T> and SlugClientError (http|schema) with same shape as edu-slug currently uses.
- Keep Url helper type: clean(docid) and (optionally) manifestPath builders.

## Step 2: Implement Url helpers (move/port).
Create `@sys/driver-slug/src/m.Url.ts`:
- Start with existing SlugUrl.clean(docid) behavior.
- Add tiny helpers for manifest filenames:
  - slugTreeFilename(docidClean) → `slug-tree.${docidClean}.json`
  - assetsFilename(docidClean) → `slug.${docidClean}.assets.json`
  - playbackFilename(docidClean) → `slug.${docidClean}.playback.json`
- Do not add routing/HTTP logic here; just string shaping.

## Step 3: Implement loaders (move/port + extend).
Create:
- `src/u.loadTreeFromEndpoint.ts` (ported from edu-slug)
- `src/u.loadAssetsFromEndpoint.ts` (new)
- `src/u.loadPlaybackFromEndpoint.ts` (new, generic payload)
- `src/u.loadBundleFromEndpoint.ts` (new; constructs Wire.Bundle and resolveAsset map)

Implementation rules:
- Use Http.fetcher() and Url.parse(baseUrl).join(...) pattern (match edu-slug).
- Use RequestInit.cache='no-cache' default; merge user init after but do not allow overriding cache unless explicitly desired.
- Use @sys/schema validators / parse:
  - For slug-tree: use existing validateSlugTree (or equivalent schema parse path).
  - For assets: AssetsSchema.Manifest.parse(...)
  - For playback: PlaybackSchema.Manifest.parse(..., payload)
- Always docid-check parsed manifest docid vs expected cleaned docid (match harness loader).
- Asset href normalization:
  - replicate normalizeHref logic from ui-react-components loader.
  - allow args.baseHref override for cases where manifest hrefs are relative to baseHref, otherwise just resolve against baseUrl.

## Step 4: Assemble module entrypoints.
Create `@sys/driver-slug/src/m.Client.ts` exporting `SlugClient`:
- readonly Url: SlugUrl
- readonly loadTreeFromEndpoint
- readonly loadAssetsFromEndpoint
- readonly loadPlaybackFromEndpoint
- readonly loadBundleFromEndpoint

Create `src/mod.ts` exporting:
- export * from './m.Client.ts';
- export * from './t.ts';
- export * from './m.Url.ts';

## Step 5: Migrate @tdb/edu-slug to consume driver-slug.
Option A (preferred: no duplication):
- Replace `@tdb/edu-slug/src/m.slug.client/*` with thin re-export:
  - SlugClient = imported SlugClient from @sys/driver-slug
  - SlugUrl = imported Url from @sys/driver-slug (or re-export)
- Keep the same public surface for downstream consumers of @tdb/edu-slug (no breaking change).

Option B (if you insist on keeping local namespace):
- Keep files but implement as 1–3 line wrappers calling @sys/driver-slug.
- No local logic beyond mapping types.

## Step 6: Migrate @sys/ui-react-components harness loader to shared driver-slug.
- In `src/ui/Media.Timecode.PlaybackDriver/-spec/u.loadTimelineFromEndpoint.ts`:
  - Replace implementation with call to `SlugClient.loadBundleFromEndpoint(baseUrl, docid, ...)`.
  - Keep the comment about cache hardening; that policy now lives in driver-slug but the call-site can mention why.
- Ensure the returned value is exactly `t.TimecodePlaybackDriver.Wire.Bundle<unknown>`.

## Step 7: Tests in @sys/driver-slug.
Add `src/-test/u.loadBundleFromEndpoint.test.ts`:
- Stub fetcher via Http.fetcher mocking if available in sys patterns; otherwise use a tiny in-memory fetch adapter if Http supports injection.
- Cases:
  - happy path: returns bundle with resolveAsset working for a known (kind, logicalPath)
  - http fail: correct error.kind='http' and includes status/url
  - schema fail: correct error.kind='schema' and includes validator message
  - docid mismatch: schema error (or explicit mismatch error) surfaced cleanly
  - href normalization: relative href becomes absolute with baseUrl

## Step 8: Wire call-sites (tomorrow’s clean run).
- In `ui.SlugPlaybackDriver` controller work, ingestion should be:
  - const bundleRes = await SlugClient.loadBundleFromEndpoint(baseUrl, docid, { payload });
  - pass bundleRes.value into PlaybackDriver useOrchestrator wiring.

## Land checklist.
- deno task check/test in:
  - @sys/driver-slug
  - @tdb/edu-slug
  - @sys/ui-react-components
- Verify no remaining duplicate loader function names in ui-react-components.
- Verify exports remain stable for existing edu-slug consumers.
