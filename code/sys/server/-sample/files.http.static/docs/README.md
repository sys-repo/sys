# Static Files over HTTP

This sample serves a generated distribution over static HTTP and exposes its inventory through a
`Files` client. `FilesStatic.fromDist()` builds that view from supplied content facts; it does not
fetch or authenticate the manifest, or verify payload bytes.

From `code/sys/server`:

```sh
deno task sample:files:http:static
```

## What the test checks

The test checks the local fixture with `FsPkg.Dist.Local.verify()`, proving consistency without an
independent content pin. It then hashes the local manifest and uses that checksum to check the HTTP
response before parsing. Fetch bounds the response size, duration, redirects, and allowed origins:

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
    checksum: manifestChecksum,
  });
  if (!fetched.ok) throw fetched.error;

  const value = Json.parse<unknown>(await fetched.data.text());
  if (!Pkg.Is.dist(value)) throw new Error('Expected canonical dist.json.');

  const policy = Files.Policy.readonly('**');
  const backing = FilesStatic.fromDist({
    dist: value.hash,
    buildTime: value.build.time,
    baseUrl: origin,
    policy,
  });
  const files = Files.Client.local(backing);
  try {
    const manifest = await files.cmd.send(Files.Cmd.Name.manifest, { contentRefs: true });
    console.info(manifest);
  } finally {
    files.dispose('done');
  }
} finally {
  fetch.dispose('done');
}
```

`manifestChecksum` identifies the fixture's exact document bytes, not its `sys.dist/v2` content.
Deriving the expected checksum from the HTTP response itself would make this comparison circular.
The schema guard and `FilesStatic` adapter do not authenticate the inventory or verify later asset
responses. `buildTime` is descriptive metadata, not part of the content identity.

To check independently selected content, obtain a `pin: { scheme: 'sys.dist/v2', digest }`
separately from the download. Use `FsPkg.Dist.Pinned.admitManifest()` to check the manifest
inventory, or `FsPkg.Dist.Pinned.verify()` to check the complete local distribution. Both require
explicit limits. Manifest admission alone does not verify later asset responses.

## Data flow

```text
local fixture → expected manifest checksum
HTTP response → bounded Fetch + checksum check → parsed manifest
parsed inventory + descriptive buildTime → FilesStatic → Files client → URL references
```

## Related samples

```text
sample:files:ws           = live authoring/dev mode over WebSocket
sample:files:http:cmd     = unary request/response Cmd mode over HTTP JSON
sample:files:http:static  = generated publication/runtime mode over static HTTP
```
