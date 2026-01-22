# @sys/model-slug
Slug ingest + wiring driver.

Pure edge/orchestration layer for loading **slug manifests** (tree, assets, playback),
validating against `@sys/model`, and assembling **wire bundles** suitable for
`TimecodePlaybackDriver` and other consumers.

- No UI
- No FS assumptions beyond explicit loaders
- Schema-truthful, minimal glue



### Example
```ts
import { SlugClient } from 'jsr:@sys/model-slug/client';

// Load a playback-ready bundle (assets + timecode playback)
const bundle = await SlugClient.loadBundleFromEndpoint(
  'https://example.com/publish.assets',
  'crdt:my-doc',
);
```
