# @sys/model-slug
Slug ingest and orchestration layer.

Loads slug manifests (tree, assets, playback), validates them against
`@sys/model`, and assembles wire-ready bundles for
`TimecodePlaybackDriver` and related consumers.

- No UI
- No implicit filesystem assumptions (loaders are explicit)
- Schema-truthful, minimal glue



### Example
```ts
import { SlugClient } from 'jsr:@sys/model-slug/client';

// Load a playback-ready bundle (assets + timecode playback)
const bundle = await SlugClient.FromEndpoint.Bundle.load(
  'https://example.com/publish.assets',
  'crdt:my-doc',
);
```
