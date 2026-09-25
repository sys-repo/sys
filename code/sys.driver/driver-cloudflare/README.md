# @sys/driver-cloudflare

Cloudflare R2 object storage through its S3-compatible HTTP API.

- `R2.Service` — direct object operations and presigned GET URLs.
- `R2.ReadRoute` — authorized HTTP delivery from a fixed path-to-object map.
- `R2.Files` — a policy-controlled directory view for `@sys/model/files`.

## Object access

```ts
import { R2 } from 'jsr:@sys/driver-cloudflare/r2';

const service = R2.Service.create({
  accountId: '<account-id>',
  credentials: {
    accessKeyId: '<access-key-id>',
    secretAccessKey: '<secret-access-key>',
  },
});

const bucket = service.bucket('assets');
await bucket.write('hello.txt', 'Hello from R2.', { mediaType: 'text/plain' });
```

Use an existing bucket and R2 access-key credentials. Keep real credentials out of source control
and client-delivered code. Bucket handles expose `stat`, `read`, `write`, `remove`, and asynchronous
`list` operations.

`bucket.presignGet` creates a temporary GET URL for one object. It is available only when the
transport supports signing. Anyone holding the URL can reuse it while valid; authorize access before
issuing it and keep it out of logs. Signing makes no network request and does not check whether the
object exists.

## Application read routes

`R2.ReadRoute` serves selected objects without making the bucket public. Its handlers have the shape
`Request → Promise<Response>`; the application owns the server, routes, and authorization policy.

Choose a constructor:

- `create` takes an explicit path-to-object map and returns a handler. Invalid configuration throws.
- `fromDist` fetches and verifies a pinned `dist.json`, then runs the route-selection callback. It
  returns a `ready` result containing a handler, or a failure result.

Both require a bucket with `presignGet` support and the private S3 origin from `service.storageUrl`,
not the bucket's public `readOrigin`. Signed URLs stay server-side: callers receive bytes, not
download redirects.

### Explicit routes

Using the service and bucket above, map application paths to complete object keys:

```ts
const handler = R2.ReadRoute.create({
  bucket,
  storageOrigin: service.storageUrl,
  routes: {
    '/': 'sample/index.html',
    '/assets/app.js': 'sample/assets/app.js',
  },
  // Deliberately allow anonymous reads of only these mapped objects.
  authorize: () => true,
  limits: { maxBytes: 1_048_576, timeout: 5_000, maxConcurrent: 4 },
});
```

Here `sample/` is an object-key prefix, not a URL mount. For a built application, preserve its
relative file paths, use its actual filenames—including hashes—and map every asset it loads. The
handler does not discover files automatically. See the
[deployment sample](https://github.com/sys-repo/sys/tree/main/code/sys.driver/driver-cloudflare/-sample/deploy).

### Routes from a pinned Dist manifest

`fromDist` downloads `prefix/dist.json` once, checks its checksum, and validates its metadata before
constructing a handler. Supply a trusted `DistPin` with the shape `{ 'dist.json': checksum }`: the
checksum is SHA-256 of the **complete file bytes**, not the manifest's embedded `hash.digest`.
Obtain the pin independently of this download.

Using that `pin` and the service and bucket above, set separate manifest and response limits:

```ts
const result = await R2.ReadRoute.fromDist({
  bucket,
  storageOrigin: service.storageUrl,
  prefix: 'sample',
  pin,
  manifestLimits: {
    manifestBytes: 65_536,
    entries: 256,
    fileBytes: 1_048_576,
    totalBytes: 4_194_304,
  },
  limits: { maxBytes: 1_048_576, timeout: 5_000, maxConcurrent: 4 },
  routes: () => ({ '/': 'index.html', '/dist.json': 'dist.json' }),
  // Deliberately allow anonymous reads of only these mapped objects.
  authorize: () => true,
});
if (result.kind !== 'ready') throw new Error(`Manifest routes refused: ${result.kind}`);
const handler = result.handler;
```

The `routes` callback runs once, after verification, with immutable manifest metadata. Return a map
from URL paths to filenames in `dist.hash.parts`, without prepending `prefix`. You may also route
`dist.json`. Use `prefix: ''` for the bucket root.

The callback must be synchronous and IO-free, returning a plain data map. Accessors and async
results are refused; one invalid entry rejects the entire map. The
[public contracts](./src/m.r2/t.ts) specify callback-result and signal handling in full.

Construction does not invoke `authorize`; each later mapped request authorizes before signing. Only
`ready` contains a handler. Refusals are `invalid-input`, `read-refused`, `manifest-refused`,
`policy-refused`, `cancelled`, or `timeout`, with no provider or callback details.

An optional native `AbortSignal` cancels construction, not the returned handler. During
construction, `limits.timeout` covers signing and reading the manifest, not manifest verification or
route selection. The call can return on cancellation or timeout before pending work and cleanup
finish.

These checks do not establish who produced the manifest or whether its listed files exist. The
handler does not compare served file bytes with the manifest's file hashes. An explicitly routed
`dist.json` is fetched again, not cached.

### Authorization and read limits

The authorization callback receives the request, selected object key, and a signal for cancellation
or timeout. Only `true` permits storage work. Identity checks belong to the application.

Requests can access only mapped objects. `/` needs an explicit mapping; missing assets never fall
back to HTML. Paths must use the encoding described in
[path matching](./src/m.r2/README.md#path-matching).

GET and HEAD share the same bounded, buffered storage GET; HEAD still reads the object but omits the
response body. Responses use `no-store` and `nosniff`, without provider headers or error details.
See the [HTTP contract](./src/m.r2/README.md#storage-requests-and-responses) for response behavior.

Set all three limits for each handler as positive safe integers:

| Limit           | Meaning                                                        |
| --------------- | -------------------------------------------------------------- |
| `maxBytes`      | Maximum decoded bytes per object                               |
| `timeout`       | Milliseconds from request admission through response creation  |
| `maxConcurrent` | Maximum active operations, including authorization and signing |

The timeout ceiling is seven days. Excess requests are refused, not queued. Timeout or cancellation
does not release a slot while work or cleanup remains pending; a dependency that never settles can
exhaust capacity.

These limits do not cap deployment-wide traffic, spending, or total memory. Allow headroom for
transport buffers, byte copies, and responses retained by consumers.

## Files adapter

`R2.Files.create` adapts a bucket for `Files.Client.local`. With `prefix: 'sample'`, the object
`sample/index.html` appears as `index.html`; directories are synthesized from key segments. This is
a view over object storage, not a POSIX filesystem. Watch is unsupported.

Using `bucket` from the first example, allow listing only:

```ts
import { Files } from 'jsr:@sys/model/files';

const backing = R2.Files.create({
  bucket,
  prefix: 'sample',
  policy: { list: '**' },
});
const files = Files.Client.local(backing);

try {
  const page = await files.list({ depth: 1, limit: 100 });
  console.info(page.entries);
} finally {
  files.dispose();
}
```

Files policy denies operations unless allowed. It governs the Files interface, not direct calls to
`bucket`; R2 credentials remain responsible for provider access.

List and manifest scan the whole backing prefix before filtering, sorting, and paging. Each result
page repeats the scan; a cursor is not a snapshot. Small pages do not make a large namespace cheap.
Choose a prefix whose contents fit the finite per-command
[enumeration limits](./src/m.r2/m.Files/README.md). Exceeding a limit rejects the command rather
than returning an incomplete tree.

Recursive removal checks all targets before deleting, but is not atomic: a later provider failure
can leave partial deletion. Preflight does not isolate removal from concurrent writers.

## Error diagnostics

Use `R2.Error.diagnostic(error)` to inspect a failure from the built-in S3 transport. A diagnostic
names the failed operation and includes the HTTP status and a recognized S3 code when available.
`R2.Error.format(detail)` formats only those fields, excluding provider messages, URLs, headers,
response bodies, and credentials.

`R2.Error.permission(error)` identifies runtime permission denials separately from S3 request
failures.

A failed request, body read, or enumeration is not evidence that an object is missing. The adapter
adds no automatic retries.

## Reference

- [Read-route contracts](./src/m.r2/README.md#read-routes) — paths, responses, and cancellation.
- [Error contracts](./src/m.r2/README.md#errors) — diagnostic fields and errors through Files.
- [Files enumeration](./src/m.r2/m.Files/README.md) — defaults, accounting, and custom transports.
- [Source types](./src/m.r2/t.ts).
- [Published R2 API](https://jsr.io/@sys/driver-cloudflare/doc/r2).
