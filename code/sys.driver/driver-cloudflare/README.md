# @sys/driver-cloudflare

Cloudflare R2 object storage through its S3-compatible HTTP API.

`R2.Service` creates bucket handles for object operations. `R2.Files` adapts a bucket to the
policy-controlled Files interface from `@sys/model/files`.

```ts
import { R2 } from 'jsr:@sys/driver-cloudflare/r2';

const service = R2.Service.create({
  accountId: '<account-id>',
  credentials: {
    accessKeyId: '<access-key-id>',
    secretAccessKey: '<secret-access-key>',
  },
});

const bucket = service.bucket('media');
await bucket.write('hello.txt', 'Hello from R2.', { mediaType: 'text/plain' });
```

The example uses an existing bucket and R2 access-key credentials. Keep real credentials out of
source control and client-delivered code. Bucket handles expose `stat`, `read`, `write`, `remove`,
and asynchronous `list` operations.

## Files adapter

`R2.Files.create` returns a backing for `Files.Client.local`. It projects object keys under an
optional `prefix` into relative file paths and synthetic directories. For example, with
`prefix: 'site'`, the object `site/assets/app.js` appears as `assets/app.js` beneath directory
`assets`. This is a directory view over object storage, not a POSIX filesystem; watch is
unsupported.

Using `bucket` from the first example, allow listing only:

```ts
import { Files } from 'jsr:@sys/model/files';

const backing = R2.Files.create({
  bucket,
  prefix: 'site',
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

## Files enumeration limits

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
