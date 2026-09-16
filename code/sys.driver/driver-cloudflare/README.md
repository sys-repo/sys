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

`R2.ReadRoute.create` serves selected objects without making the bucket public. It returns a
`Request → Promise<Response>` handler; the application owns the server and caller policy.

For an `@sys/driver-vite` application, upload the contents of `dist/` without changing their
relative paths. Using the service and bucket above, this map serves one sample build at `/` from
objects stored under `sample/`:

```ts
const handler = R2.ReadRoute.create({
  bucket,
  storageOrigin: service.storageUrl,
  routes: {
    '/': 'sample/index.html',
    '/pkg/-entry.BCez1vdb.js': 'sample/pkg/-entry.BCez1vdb.js',
    '/pkg/m.Cl5h3wvc.js': 'sample/pkg/m.Cl5h3wvc.js',
    '/pkg/m.D9-fqq9M.js': 'sample/pkg/m.D9-fqq9M.js',
    '/pkg/m.Ntdn-fxD.js': 'sample/pkg/m.Ntdn-fxD.js',
  },
  // Deliberately allow anonymous reads of only these mapped objects.
  authorize: () => true,
  limits: { maxBytes: 1_048_576, timeout: 5_000, maxConcurrent: 4 },
});
```

Use the exact hashed filenames from your build and map every asset it loads; the handler does not
discover files automatically. Here `sample/` is an object-key prefix, not a URL mount.

The authorization callback receives the request, selected object key, and a signal for cancellation
or timeout. Only `true` permits storage work. Identity checks belong to the application.

Paths match the parsed `Request` URL, not its original wire spelling. Encode each segment with
`encodeURIComponent`; query strings and alternate encodings are refused. `/` requires an explicit
mapping, and missing assets never fall back to HTML. Requests select a mapped key; they cannot
supply one.

The bucket must support `presignGet`. The handler verifies the signed target's origin, bucket, and
key, then fetches without redirects or forwarded browser credentials. Signed URLs stay server-side:
the caller receives bytes, not a download redirect.

GET and HEAD share the same bounded, buffered read; HEAD omits the body. MIME comes from the object
filename and length from decoded bytes. The handler relies on native Fetch for gzip, deflate, and
Brotli decoding; unsupported or stacked encodings are refused.

Responses use `no-store` and `nosniff`. Provider headers and error details are not forwarded. Range
requests are refused; conditional headers do not produce a 304 response.

### Read limits

Set all three limits: `maxBytes` per decoded object, `timeout` in milliseconds from admission
through response creation, and `maxConcurrent` per handler. Active operations include authorization
and signing. Excess requests are refused, not queued.

Timeout or cancellation settles the caller's response and signals abort, but the operation keeps its
slot until pending work and body cleanup settle. A dependency that never settles can exhaust
capacity.

These are not deployment-wide rate, spending, or memory limits. Allow headroom for transport
buffers, byte copies, and responses retained by consumers. See the [API contracts](./src/m.r2/t.ts)
for validation rules and response statuses.

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

### Files enumeration limits

List and manifest scan the whole backing prefix before filtering, sorting, and paging. Each result
page rebuilds that index: a cursor is neither a provider continuation nor a snapshot. Small result
pages do not make a large namespace cheap; choose a backing prefix whose contents fit the budget.

Every Files command has fresh, finite enumeration limits, separate from result-page and inline
read/write limits. Exceeding a limit rejects the command rather than returning an incomplete tree.
Omit `enumeration` for defaults, or supply all five limits within their ceilings. These bound
logical enumeration and index growth, not total process memory, response buffering, or elapsed time.

Recursive removal completes enumeration and checks every target's policy before the first delete. A
later provider failure can leave partial deletion; removal is neither atomic nor isolated from
concurrent writers.

See the [enumeration reference](./src/m.r2/m.Files/README.md) for defaults, exact accounting, error
behavior, and custom-transport requirements. API reference: [source types](./src/m.r2/t.ts) and
[published R2 docs](https://jsr.io/@sys/driver-cloudflare/doc/r2/).
