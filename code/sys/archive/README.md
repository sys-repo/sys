# @sys/archive

`@sys/archive/zip` is a strict, bounded, read-only ZIP32 inspector and payload-integrity tester. It
accepts archive bytes, takes an internal snapshot, and exposes frozen structural evidence. It has no
filesystem, network, environment, or subprocess authority; it does not extract files, create ZIPs,
or resolve paths.

Use the protocol-specific subpath:

```ts
import { Zip } from 'jsr:@sys/archive/zip';
```

The package does not auto-detect formats or expose a format-neutral `Archive.open()` facade. Public
types are available from `jsr:@sys/archive/t`.

## Three different claims

A ZIP can be structurally valid while containing corrupt payloads. A ZIP whose payloads match their
recorded CRC values can still be malicious or come from the wrong source. The API keeps these claims
separate:

```text
caller-owned bytes
  → Zip.open()         structural and path-tree admission over an owned snapshot
  → archive.inspect() frozen metadata from that admitted structure
  → archive.test()    complete payload decoding, size accounting, and CRC-32 testing
  → caller policy     origin, signature, cryptographic digest, and content trust
```

| Layer                 | What it establishes                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `Zip.open()`          | The owned bytes form one supported, contiguous ZIP32 archive with one portable path tree.    |
| `archive.inspect()`   | The admitted structure and its recorded metadata are available as cached frozen evidence.    |
| `archive.test()`      | Every file decodes completely, consumes its exact compressed range, and matches size/CRC.    |
| Caller authentication | The exact stable archive bytes came from the intended source and satisfy application policy. |

Neither structural admission nor CRC-32 authenticates an archive. CRC-32 detects ordinary
corruption; an attacker can replace a payload and its CRC together.

## Open, inspect, and test

```ts
import { Zip } from 'jsr:@sys/archive/zip';

async function examineZip(bytes: Uint8Array) {
  const archive = await Zip.open(bytes, {
    timeout: 30_000,
    limits: { maxEntries: 500 },
  });

  const inspection = archive.inspect();
  const integrity = await archive.test({ timeout: 30_000 });

  return { inspection, integrity };
}
```

`Zip.open()` and `archive.test()` each require an explicit finite `timeout` and accept an optional
canonical `until` lifecycle.

### Source ownership

`Zip.open()` accepts only a direct native `Uint8Array` backed by one fixed, non-shared
`ArrayBuffer`. Proxies, subclasses, detached buffers, `SharedArrayBuffer`, and resizable or growable
backing stores are rejected because they cannot provide the required snapshot boundary.

Opening performs its copy after initial option and lifecycle settlement. Treat the input as borrowed
while the returned promise is pending; once `Zip.open()` resolves, later caller mutation cannot
alter the opened archive. The internal copy and payload bytes are never exposed.

A complete byte snapshot is deliberate. ZIP places its authoritative central directory at the end
and then refers back to local records, so strict validation requires bounded random access. A
forward-only source would require a separate spool or seekable-source owner rather than a nominally
streaming overload.

### Structural inspection

`archive.inspect()` is synchronous and returns the same frozen `Inspection` identity on every call.
It does not inflate payloads. The `Archive`, `Inspection`, `Usage`, entry array, and every `Entry`
record are frozen; none exposes the private source buffer.

| Evidence          | Meaning                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `sourceBytes`     | Exact size of the internal archive snapshot.                                              |
| `fileCount`       | Explicit regular-file records in the central directory.                                   |
| `directoryCount`  | Explicit directory records in the central directory.                                      |
| `treeEntryCount`  | Unique files, explicit directories, and implicit parent directories in the realized tree. |
| `compressedBytes` | Sum of compressed sizes recorded by admitted entries.                                     |
| `expandedBytes`   | Sum of expanded sizes recorded by admitted entries.                                       |
| `usage`           | Counts of stored, deflated, UTF-8, and data-descriptor entries.                           |
| `entries`         | Frozen records in zero-based central and physical order.                                  |

Each entry reports its admitted path and kind, creator convention, compression method, encoded
DEFLATE option bits, UTF-8 and descriptor use, CRC-32, recorded sizes, and local-header offset.
Directory paths retain their trailing slash. `deflateOption` describes the two general-purpose flag
bits; it does not measure how a compressor actually encoded the payload.

Recorded expanded sizes and CRC values remain archive claims until `archive.test()` succeeds.
Archive and entry comments are accepted as opaque structural bytes but are not exposed.

### Payload integrity

`archive.test()` walks every regular file in physical order. For each file it:

1. reads only the admitted compressed range;
2. checks stored bytes directly or completes one raw-DEFLATE stream;
3. proves that DEFLATE consumed the exact compressed range, rejecting trailing or concatenated data;
4. accounts actual expanded bytes against the per-entry and archive limits;
5. compares actual size with the recorded size; and
6. computes and compares ZIP CRC-32 over the complete expanded payload.

A successful result is frozen:

```ts
{
  kind: 'passed',
  filesTested,
  compressedBytes,
  expandedBytes,
}
```

The result reports actual processed file totals; the inspection retains the archive's recorded
claims. Testing discards expanded bytes after accounting and CRC work. It is not extraction, content
scanning, provenance verification, or a promise that decoded content is safe to interpret.

## Supported ZIP32 grammar

Protocol semantics are pinned to
[PKWARE APPNOTE 6.3.10](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT), final revision
2022-11-01. The implementation intentionally accepts a closed subset:

| Dimension        | Accepted                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Container        | One contiguous, single-disk ZIP32 archive, including the empty archive.                      |
| Record layout    | Local records from byte zero, one matching central directory, and one terminal EOCD record.  |
| Versions         | ZIP versions needed 1.0 and 2.0 for their admitted features.                                 |
| Compression      | Stored entries and raw DEFLATE.                                                              |
| Data descriptors | Exact signed or unsigned ZIP32 descriptors.                                                  |
| Creator systems  | MS-DOS (`0`) and Unix (`3`) conventions for ordinary files and directories.                  |
| Entry names      | Canonical UTF-8 when flagged; otherwise printable ASCII only.                                |
| Extra fields     | Extended timestamp (`0x5455`) and Info-ZIP Unix UID/GID (`0x7875`) grammars only.            |
| Comments         | Structurally bounded archive and central-entry comments; retained only in the private bytes. |

Local and central records must agree on name, flags, method, and required version. Without a data
descriptor, their size and CRC fields must also match; with one, the local fields must be exact zero
placeholders and the terminal descriptor must match the central record. Directory names, creator
attributes, and the trailing slash must agree, and every directory must be stored with zero sizes
and CRC.

Local records, descriptors, the central directory, and EOCD must meet exactly: gaps, overlaps,
prefix bytes, suffix bytes, ambiguous terminal records, and contradictory offsets fail closed.
Accepted timestamp and Unix identity fields are grammar-checked but are not returned or applied to a
filesystem.

The following are outside the contract and reject rather than degrade:

- ZIP64, split or multi-disk archives, encryption, and unsupported compression methods;
- patching, strong encryption, masked headers, digital signatures, and archive-extra-data records;
- symbolic links, devices, sockets, volume labels, and other special entry types;
- unknown creator systems, unknown flags, and unrecognized or duplicate extra fields; and
- self-extracting prefixes, arbitrary trailing bytes, sparse layouts, or overlapping records.

Unsupported is not malformed: `unsupported` means the archive identifies a feature outside this
reader's contract, while `malformed` means admitted ZIP32 structure is inconsistent or ambiguous.

## Portable path admission

ZIP names are not treated as trustworthy filesystem paths. `Zip.open()` first admits one portable,
unambiguous path tree:

- paths are relative and use `/`; absolute paths, drive prefixes, and backslashes are rejected;
- every component is non-empty and is neither `.` nor `..`;
- names must already be Unicode NFC and contain no C0/C1, line-separator, or format controls;
- Windows-forbidden characters, trailing dots or spaces, and reserved device names are rejected;
- names beginning with the reserved `.sys.rooted` prefix are rejected case-insensitively;
- exact, lowercase, NFC, and NFD aliases may not collide;
- a file may not also be a directory or an ancestor of another entry; and
- implicit parent directories count toward the realized-tree limit.

This policy is designed to map admitted names into the narrower `@sys/fs` Rooted target model, but
`@sys/archive/zip` itself performs no filesystem operation. Path admission prevents ambiguous
archive names; it is not an extraction sandbox or a defense against concurrent filesystem
replacement.

## Work and memory bounds

`Zip.open()` accepts an exact partial `limits` record. Omitted fields use frozen package defaults;
unknown keys, accessors, proxies, non-positive values, unsafe integers, and infinite values are
rejected before archive copying or parsing. A source exceeding `maxSourceBytes` is rejected before
the private archive buffer is allocated.

| Override           | Meaning                                              | Default |
| ------------------ | ---------------------------------------------------- | ------: |
| `maxSourceBytes`   | Bytes copied into the private archive snapshot.      |  64 MiB |
| `maxEntries`       | Central-directory records.                           |   2,048 |
| `maxTreeEntries`   | Files, directories, and unique implicit parents.     |   8,192 |
| `maxPathBytes`     | Raw bytes in one entry name.                         |     512 |
| `maxPathDepth`     | Components in one path.                              |      32 |
| `maxEntryBytes`    | Declared and actual expanded bytes in one file.      | 128 MiB |
| `maxExpandedBytes` | Declared and actual expanded bytes across all files. | 512 MiB |
| `maxErrorChars`    | Characters retained in one public failure message.   |  16,000 |

The source already exists in caller memory; opening adds one exact private copy plus parser
metadata. Payload testing does not retain a complete expanded archive. Stored and DEFLATE work is
admitted in blocks no larger than 64 KiB, and inflater input/output uses explicit backpressure
rather than an unbounded application queue.

Declared expansion is checked during open, before inflation. Actual output is checked during test,
so a false declared size cannot bypass either per-entry or aggregate expansion policy.

### Option snapshots, cancellation, and deadlines

Open options admit only `{ timeout, until?, limits? }`; test options admit only
`{ timeout, until? }`. Both are ordinary own-data records. They and any nested cancellation-array
containers are snapshotted before the first asynchronous boundary, so later caller mutation cannot
change the operation. Accessors, symbols, proxies, cycles, more than 256 lifecycle nodes, or more
than 32 nested array levels are rejected; inherited values are never admitted. Structural lifecycle
leaves retain canonical `UntilInput` behavior.

`timeout` is a non-negative safe-integer millisecond budget. It begins at the public operation
boundary and includes option admission, initial scheduling, and all structure or payload work. A
pre-terminal lifecycle performs no archive copy, parsing, or inflation. Active inflater work is
revoked and awaited before a cancelled or timed-out test settles.

Work is cooperatively bounded:

- parsing yields after at most 32 records or 1 MiB of linear byte work;
- payload input, inflater output, and CRC calls use blocks no larger than 64 KiB; and
- payload processing yields after 1 MiB of compressed input or expanded output.

A timeout is therefore a finite work budget, not a hard real-time interrupt. The fixed source copy
and an individual native operation cannot be preempted once entered; cancellation and the monotonic
deadline are checked before and after those bounded segments.

## Failures

Expected rejection uses frozen, owner-authenticated `ZipError` values:

```ts
try {
  const archive = await Zip.open(bytes, { timeout: 30_000 });
  await archive.test({ timeout: 30_000 });
} catch (error) {
  if (!Zip.Is.failure(error)) throw error;
  console.error(error.operation, error.kind, error.entryIndex);
}
```

`Zip.Is.failure()` recognizes only failures created by this library; structural lookalikes and
proxies are rejected without traversing them. Use these stable fields for control flow:

| Field        | Meaning                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| `operation`  | `open` or `test`.                                                       |
| `kind`       | Stable failure classification.                                          |
| `entryIndex` | Optional zero-based admitted entry responsible for a localized failure. |

Failure kinds are intentionally finite:

| Boundary     | Kinds                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| Input/policy | `invalid-input`, `invalid-options`                                          |
| Lifecycle    | `cancelled`, `timeout`                                                      |
| Limits       | `source-limit`, `entry-limit`, `tree-limit`, `path-limit`, `expanded-limit` |
| ZIP grammar  | `malformed`, `unsupported`, `invalid-name`, `collision`                     |
| Payload test | `deflate-failure`, `size-mismatch`, `crc-mismatch`                          |

Messages are bounded by `maxErrorChars`. Message text and any standard `Error.cause` are diagnostic,
not stable authority; lower causes are not traversed to construct the public classification.

## Verification posture

The conformance suite does not use one ZIP encoder as its sole oracle. It combines hand-assembled
APPNOTE records, independently mutated fields, the canonical `123456789` CRC-32 vector, and pinned
raw-DEFLATE bytes whose SHA-256 is checked before use. Accepted and rejected cases exercise record
boundaries, descriptors, extra fields, creator attributes, path aliases, declared limits, actual
expansion, size, CRC, and exact DEFLATE consumption.

Separate proofs cover caller-byte mutation after opening resolves, hostile object admission, Rooted
path compatibility, parser scheduling, inflater backpressure under a slow consumer, cancellation
settlement, and open/test with every ambient Deno permission denied. These proofs support the narrow
contract documented here; they do not imply interoperability with ZIP features the grammar excludes.

## Security boundary

A passing `archive.test()` proves internal consistency of the private byte snapshot. It does not
establish:

- who produced or delivered the archive;
- a cryptographic digest or signature over the archive bytes;
- malware safety or semantic safety of decoded content;
- filesystem containment, safe extraction, or resistance to concurrent path replacement;
- durability, immutability after external publication, or policy compliance beyond the limits above.

Authenticate the same stable source bytes separately before assigning origin or release identity.
Keep the source unchanged until `Zip.open()` resolves so its private snapshot cannot diverge from
the bytes your caller-owned digest or signature policy admitted.

The narrow boundary is intentional: archive parsing owns archive truth; source acquisition,
cryptographic authentication, extraction, publication, and application trust remain separate owners.
