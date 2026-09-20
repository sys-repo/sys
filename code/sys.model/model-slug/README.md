# @sys/model-slug

Slug manifest loading and bundle assembly, without UI code. The root exports only `pkg`. Import the
APIs from these entrypoints:

- `/client`: descriptor and endpoint loaders for trees, file content, and playback bundles.
- `/schema` and `/core`: schema contracts and shared slug helpers.
- `/bundle` and `/fs`: bundle construction and filesystem-oriented operations.
- `/t`: type-only contracts.

## Load a playback bundle

Import `SlugClient` from `/client`. Endpoint loaders need either a response policy or an HTTP client
you own. The policy below limits response size, duration, redirects, and allowed origins.

```ts
import { SlugClient } from 'jsr:@sys/model-slug/client';

// Replace these with a published slug endpoint and its document ID.
const baseUrl = 'https://example.com/publish.assets/';
const result = await SlugClient.FromEndpoint.Timeline.Bundle.load(
  baseUrl,
  'crdt:my-docid',
  {
    policy: {
      maxBytes: 5 * 1024 * 1024,
      timeout: 10_000,
      maxRedirects: 0,
      progressInterval: 100,
      sourceOrigins: [new URL(baseUrl).origin],
      credentialOrigins: [],
    },
  },
);

if (result.ok) {
  console.info(result.value.spec.beats);
} else {
  console.error(result.error);
}
```

Use a real endpoint and document ID, with network access to that endpoint. In a browser, the
endpoint must also allow any cross-origin requests.

Limits apply to each fetch, not to the bundle load as a whole. Pass `policy` to let the loader
create and dispose its HTTP clients, or pass `client` to manage its lifetime yourself. Changing the
layout or URLs does not expand the allowed origins.

By default, the loader reads `manifests/dist.json` and the document's playback and assets manifests.
The playback manifest must be listed in dist; without an assets entry, the asset set is empty. The
result contains a playback spec and asset resolver, not downloaded media or a running player.

For descriptor-based loading, `SlugClient.FromDescriptor.make` returns a result containing a client
for the selected endpoint, document, and layout. Check `ok` before using the client, and dispose it
when finished. An HTTP client you supply remains yours to dispose.

[Client API](https://jsr.io/@sys/model-slug/doc/client)
