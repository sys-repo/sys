# Files HTTP Static Sample

Run sample with:

```sh
deno task sample:files:http:static
```

---

A generated `dist.json` bundle, served by plain static HTTP, reconstructed as a bounded `Files`
client view. `FilesStatic.fromDist` is a structural adapter: it does not fetch, authenticate, or
verify a manifest.

The test obtains an exact manifest pin from its local fixture, then uses bounded Fetch transport
before parsing the authenticated bytes:

```ts
const fetch = Fetch.make({
  policy: {
    maxBytes: manifestBytes,
    timeout: 1_000,
    maxRedirects: 0,
    progressInterval: 100,
    sourceOrigins: [origin],
    credentialOrigins: [],
  },
});

try {
  const fetched = await fetch.blob(manifestUrl, undefined, {
    checksum: manifestIntegrity,
  });
  if (!fetched.ok) throw fetched.error;

  const value = Json.parse<unknown>(await fetched.data.text());
  if (!Pkg.Is.dist(value)) throw new Error('Expected canonical dist.json.');

  const policy = Files.Policy.readonly('**');
  const backing = FilesStatic.fromDist({ dist: value, baseUrl: origin, policy });
  const files = Files.Client.local(backing);
} finally {
  fetch.dispose('done');
}
```

`manifestIntegrity` must come from an independent trusted source. A checksum derived from the same
remote response is not artifact authority.

The shape is intentionally explicit:

```text
independent manifest pin + bounded Fetch → authenticated dist.json bytes
                                      ↓
                     FilesStatic backing → Files client → URL content ref
```

Files sample lanes:

```text
sample:files:ws           = live authoring/dev mode over WebSocket
sample:files:http:cmd     = unary request/response Cmd mode over HTTP JSON
sample:files:http:static  = generated publication/runtime mode over static HTTP
```
