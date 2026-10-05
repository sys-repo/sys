# R2 Files enumeration

Reference for `R2.Files.create({ bucket, policy, enumeration })`. See the
[package README](../../../README.md) for the object/Files distinction and a client example.

## Policy

Construction captures a complete enumeration policy. Omit `enumeration` to use the defaults below;
an override must contain exactly these five fields as positive integers at or below their ceilings.
Each Files command receives fresh counters shared by all of its enumeration helpers. These counters
do not change result-page limits or inline read/write limits.

| Limit          | Default | Ceiling | Counts                                    |
| -------------- | ------: | ------: | ----------------------------------------- |
| `maxRequests`  |      64 |   1,024 | Client-issued listing requests            |
| `maxObjects`   |  10,000 | 100,000 | Listing records and exact removal objects |
| `maxKeyBytes`  |   8 MiB |  64 MiB | UTF-8 bytes of keys for counted objects   |
| `maxEntries`   |  20,000 | 200,000 | Unique indexed files and directories      |
| `maxPathBytes` |  16 MiB | 128 MiB | Logical UTF-8 path storage                |

Byte-valued fields take integer byte counts; 1 MiB is 1,048,576 bytes.

## Accounting

- Requests include continuations hidden by the client, even when a page is empty or short. A
  terminal request needed to establish listing completion must also fit the budget.
- Objects and key bytes count every yielded record before filtering or indexing, including
  duplicates and discarded records. An exact object admitted for removal is also counted. Each
  admitted key is limited to 1,024 UTF-8 bytes.
- Entries count unique indexed files and synthetic directories, including root. Deep keys can create
  many directory entries even when few objects are listed.
- Path bytes count two logical slots per indexed entry, two per removal target, and one per manifest
  content ref. Duplicate removal targets are charged separately even when the index deduplicates
  them.

List and manifest require a complete enumeration of the backing prefix before filtering, sorting,
and paging. Reaching the requested result-page size does not end that enumeration. Every subsequent
result page rebuilds the index; its cursor provides neither a provider continuation nor a snapshot.

One over-budget record may be yielded to detect overflow. The driver refuses it before retention,
and any request needed to obtain it must fit the request budget. Owned iterators close on refusal; a
budget check does not cancel an already-issued request.

## Refusal and deletion

Exceeding any enumeration limit throws `FilesR2Error.EnumerationLimit` at the backing's handler
boundary. Through Files/Cmd, the caller receives a redacted enumeration-limit message, not a typed
provider-error variant. Do not rely on the local error name surviving the Cmd boundary.

Recursive removal completes enumeration, checks the projected tree for file/directory collisions,
accounts for target paths, and checks every target's policy before the first delete. A budget or
policy refusal during this preflight deletes nothing. Nonrecursive directory refusal uses a bounded
existence probe instead of enumerating all descendants.

Once deletion begins, provider failures can leave partial deletion. Preflight is not a transaction
or protection from concurrent writers.

## Custom listing transports

A custom bucket or transport must honor `R2.Bucket.ListOptions.beforeRequest` before **every**
client-issued listing request, including hidden continuations. If the hook throws, do not dispatch
the request. When no result limit is supplied, do not silently cap the iterable: Files relies on
listing completion to establish a complete tree.

The built-in S3 transport gives each listing its own client and invokes the hook at that client's
public `makeRequest` boundary. Signing and XML parsing are handled by the S3 client.

A listing that never calls the hook is refused. This detects absent accounting, not every possible
undercount: the driver cannot audit hidden requests in a custom transport that violates the
contract.

## Resource and projection boundaries

These are logical enumeration/index bounds, not SDK response-byte, XML-parser, process-RSS,
redirect-traffic, or elapsed-time bounds. The SDK may buffer a response or page before yielding
records; rejecting a key or record does not undo that buffering. Path accounting conservatively
charges logical storage, not engine allocation or all output metadata and URL bytes.

Enumeration limits do not make the Files projection lossless: raw keys pass through Files path
normalization, and different raw keys may map to the same logical path. Nor do the limits establish
correctness of the upstream XML parser.

The [public types](../t.ts), [budget accounting](./u/enumeration.ts),
[path projection](./u/path.ts), and [S3 transport](../u/u.transport.s3.ts) define these boundaries.
