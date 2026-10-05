# @sys/model-slug

Slug manifest loading and bundle assembly, without UI code. The root exports only `pkg`. Import the
APIs from these entrypoints:

- `/client`: descriptor and endpoint loaders for trees, file content, and playback bundles.
- `/schema` and `/core`: schema contracts and shared slug helpers.
- `/bundle` and `/fs`: bundle construction and filesystem-oriented operations.
- `/t`: type-only contracts.

## Load a playback bundle

Endpoint loaders need either a response policy or an HTTP client you own. The policy below limits
manifest response size, duration, redirects, and allowed origins.

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

Run with network access to the endpoint. Browser use also requires the endpoint to allow
cross-origin requests.

Limits apply to each fetch, not to the bundle load as a whole. Pass `policy` to let the loader
create and dispose its HTTP clients, or pass `client` to manage its lifetime yourself. For bundle
loading, the policy governs manifest requests—not returned media URLs. Changing layout or URLs does
not expand allowed manifest origins; asset resolution does not check `sourceOrigins`. Callers must
govern subsequent media requests separately.

By default, the loader reads `-manifests/dist.json` and the document's playback and assets
manifests. Use `layout: { manifestsDir: 'manifests' }` for a `manifests` directory. The playback
manifest must be listed in dist; without an assets entry, the asset set is empty. The result
contains a playback spec and asset resolver, not downloaded media or a running player. Membership
and schema checks do not authenticate manifests or media: no independent content pin or document
signature is checked. Treat the bundle as an observation, not verified payload evidence.

Reused HTTP clients, including those held by descriptor clients, cache successful `dist.json`
observations per manifest location while playback is refetched, so republished membership can remain
stale; policy-only endpoint loads do not use this client-owned Dist cache.

For descriptor-based loading, `SlugClient.FromDescriptor.make` returns a result containing a client
for the selected endpoint, document, and layout. Check `ok` before using the client, and dispose it
when finished. An HTTP client you supply remains yours to dispose.

[Client API](https://jsr.io/@sys/model-slug/doc/client)
