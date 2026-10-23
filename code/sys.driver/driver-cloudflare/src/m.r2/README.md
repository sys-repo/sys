# R2 reference

The [package README](../../README.md) introduces object access, application read routes, and the
Files adapter. This page describes their HTTP and error contracts; the [public types](./t.ts) define
the full API.

## Read routes

### Path matching

Paths match the parsed `Request` URL, not its original wire spelling. Encode each segment with
`encodeURIComponent`; query strings and alternate encodings are refused. `/` requires an explicit
mapping. Missing assets never fall back to HTML.

### Storage requests and responses

The bucket must support `presignGet`. Set `storageOrigin` to `service.storageUrl`, not the bucket's
public `readOrigin`. The handler verifies the signed URL's origin, bucket, and key before fetching.
It follows no redirects and forwards no browser credentials. Signed URLs stay server-side.

GET and HEAD use the same bounded, buffered GET from storage; HEAD omits the response body. The
response's MIME type comes from the object filename and its length from decoded bytes. The handler
relies on native Fetch for gzip, deflate, and Brotli decoding. Unsupported or stacked encodings are
refused.

Responses use `no-store` and `nosniff`. Provider headers and error details are not forwarded. Range
requests are refused; conditional headers do not produce a 304 response. Error responses have empty
bodies. The [ReadRoute types](./t.ts) list response statuses.

### Limits and cancellation

Supply all three limits as positive safe integers. `maxBytes` bounds decoded bytes per object;
`timeout` is in milliseconds from admission through response creation, with a maximum of seven days.
`maxConcurrent` bounds active operations per handler, including authorization and signing. Excess
requests are refused, not queued.

Timeout or cancellation settles the caller's response and signals abort. The operation retains its
slot until pending work and body cleanup settle. A dependency that never settles can exhaust
capacity even after callers receive timeout responses.

These limits do not cap deployment-wide traffic, spending, or total process memory. Transport
buffers and byte copies need additional headroom; returned responses can outlive their read slots.

## Errors

### Request diagnostics

`R2.Error.diagnostic(error)` recovers a known request diagnostic through standard `cause` and
`error` wrappers. It returns `undefined` when none is found; this does not establish whether the
operation succeeded or an object exists.

A diagnostic names the failed storage operation. It includes the HTTP status when available and a
code from `R2.Error.Code` when recognized. Unknown codes are omitted, not interpreted as credential
failures. A code describes the failed request, not the full set of permissions granted to the
credentials.

`R2.Error.format(detail)` renders only those fields. Provider messages, URLs, headers, response
bodies, credentials, and raw provider causes are excluded from the diagnostic.

### Files commands

`Files.Client` sends operations through Cmd. Errors returned through that command layer carry their
exposed details in `cause`. `R2.Error.diagnostic(error)` recovers known R2 diagnostics there.

A Files write may fail during a preliminary `stat` or `list`, before uploading anything. The
diagnostic names the storage operation that failed, not the Files command that initiated it.
Failures while reading a response body carry `read` diagnostics or a runtime permission denial;
local byte-limit refusals remain Files policy errors.

When Files reports a missing object, the remote error's `cause.name` is `FilesR2Error.NotFound`.
That detail contains no raw provider cause. A failed request, body read, or enumeration is not
evidence that an object is missing.

### Runtime permissions and custom transports

`R2.Error.permission(error)` identifies `NotCapable` and `PermissionDenied` through error wrappers.
These are runtime permission denials, not S3 authentication failures.

The built-in transport's diagnostic and redaction guarantees do not extend to arbitrary custom
transports. Custom transports remain responsible for their own errors. The adapter adds no automatic
retries; applications must choose their own retry policy.
