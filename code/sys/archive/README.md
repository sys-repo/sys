# @sys/archive

`@sys/archive/zip` reads ZIP32 archives with explicit time and size bounds. Inspect metadata, check
integrity, or extract verified contents through a destination writer. ZIP creation is not supported.

## Open, inspect, and verify

```ts
import { Zip } from 'jsr:@sys/archive/zip';

async function examineZip(bytes: Uint8Array) {
  const work = { timeout: 30_000 };
  const archive = await Zip.open(bytes, { ...work, limits: { maxEntries: 500 } });
  const inspection = archive.inspect();
  const integrity = await archive.test(work);

  return { inspection, integrity };
}
```

| Operation                 | What it establishes                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `Zip.open()`              | An owned snapshot with supported ZIP32 structure and an admitted path tree.         |
| `archive.inspect()`       | Cached metadata from that structure, without decoding payloads.                     |
| `archive.test()`          | Complete payload decoding, exact compressed consumption, matching sizes and CRC-32. |
| `archive.extractTo(sink)` | Verified content and complete sink consumption—not filesystem publication.          |

Structural validity is not payload integrity, and integrity is not trust. CRC-32 detects corruption;
an attacker can replace both a payload and its CRC. Authenticate the source separately before
trusting its origin or contents.

Public types are available from `jsr:@sys/archive/t`.

## Execution policy

Each asynchronous operation requires a `timeout` in milliseconds; there is no default. The caller
chooses how long it is willing to wait. Each call starts a fresh budget, even when it reuses the
same options object: opening does not set the archive's lifetime or a shared workflow deadline. The
value must be a non-negative safe integer; zero expires before archive work begins.

Optional `until` accepts a native `AbortSignal` or another supported `UntilInput`: a lifecycle view,
an observable, or nested arrays of these. Zip observes termination without taking ownership of the
input. An already-terminal input prevents copying, parsing, and payload work. A shared signal can
cancel several operations together.

Timeout and cancellation are cooperative: they cannot interrupt synchronous JavaScript or host I/O,
and cleanup may finish after the budget expires. Zip stops delivery and waits for its own payload
work to close, but an external writer may still be running when extraction rejects. Keep filesystem
coordination active until that writer and its cleanup have settled.

## Extraction through a tree sink

Zip verifies the contents; the writer decides where they go. With `@sys/fs` Rooted, files are built
in a private staging directory. You can inspect or reject that tree before publishing it.

This example publishes at `root/unpacked`. The root must be an existing directory whose writers
follow Rooted's coordination rules.

```ts
import { Zip } from 'jsr:@sys/archive/zip';
import { Fs } from 'jsr:@sys/fs';

async function extractZip(bytes: Uint8Array, root: string, until: AbortSignal) {
  const work = { timeout: 30_000, until };
  const archive = await Zip.open(bytes, work);
  const rooted = await Fs.Capability.Rooted.create({ root });
  const { targets: [target] } = await rooted.Target.admit([{
    kind: 'directory',
    path: './unpacked', // Relative to root, not the working directory.
  }]);
  const stage = await rooted.Stage.create();
  let outcome;
  try {
    const result = await archive.extractTo(stage.writer, work);
    const publication = await rooted.Stage.promote(stage, target, { until });
    outcome = { ok: true as const, value: { result, publication } };
  } catch (error) {
    outcome = { ok: false as const, error };
  }

  let cleanup;
  try {
    await rooted.Stage.discard(stage);
    cleanup = { ok: true as const };
  } catch (error) {
    cleanup = { ok: false as const, error };
  }
  return { outcome, cleanup };
}
```

Operation and cleanup have separate outcomes: neither can erase the other. Setup failures still
reject; once stage creation returns a handle, check both `outcome.ok` and `cleanup.ok`.

When `outcome.ok`, inspect `outcome.value.publication`. Its `kind` is `published` if the tree became
visible at the target, or `occupied` if an existing destination was left untouched. Also inspect
`publication.cleanupError`: cleanup, cancellation, or post-publication verification can report a
problem without changing that known outcome.

Failed cleanup may leave private staging residue. An error does not establish rollback; retain the
reported outcome and reconcile filesystem state rather than deleting a possibly published target.

Extraction returns a frozen
`{ kind: 'extracted', fileCount, directoryCount, treeEntryCount, expandedBytes }`. Directory counts
include implicit parents. Byte counts describe verified consumption, not proof of a writer's
external writes. Only content and directory structure are restored—not ownership, modes, timestamps,
ACLs, xattrs, links, or special entries.

### Writing another sink

Implement `Zip.Extract.TreeSink` to send contents somewhere else. Supply a plain object containing
only an own, enumerable `writeTree(entries, options)` method; accessors and proxies are rejected.

Zip calls the method once, **after verifying every payload**, with frozen entries and options.
Directories precede files, parents precede children, and files retain archive order. Directory paths
have no trailing slash. Options supply tree, path, and byte limits, an operation-owned
`AbortSignal`, and the remaining timeout.

Each file carries `path`, `expectedBytes`, and a frozen `content: AsyncIterable<Uint8Array>`.
Consumption runs a second pass with the same [integrity checks](#payload-verification), yielding
fresh chunks of 1–65,536 bytes. Calling `archive.test()` beforehand is unnecessary.

Consume files in order. Acquire each content source once, allow only one unsettled `next()` per
iterator, and read through `done: true`—including empty files. Repeated acquisition, out-of-order or
overlapping demand, and incomplete consumption fail as `sink-protocol`. Catching an explicit
protocol violation inside the sink does not clear it.

Early `return()` joins cleanup, including an interrupted pending demand, but does not complete the
file. If the sink then fulfills, extraction fails as `sink-protocol`; if it rejects, the failure is
`sink-failure` unless an earlier owner failure already won.

Consumption must be complete when Zip observes sink fulfillment. Later consumption cannot repair an
incomplete sink. Settlement revokes retained sources and iterators; calls during cleanup cannot
change the selected outcome.

## Inputs and evidence

### Byte ownership

`Zip.open()` accepts a direct native `Uint8Array` backed by a fixed, non-shared `ArrayBuffer`.
Proxies, subclasses, detached buffers, shared storage, and resizable or growable backing stores are
rejected.

Keep the input unchanged while opening is pending. After opening resolves, the archive owns an
independent copy; caller mutation cannot affect it. That private copy is never exposed to a sink. If
authenticating the source, use the same unchanged bytes for authentication and opening.

The complete snapshot supports bounded random access: ZIP places its central directory at the end
and refers back to local records. Payload delivery is streaming; source acquisition is not.

### Option snapshots

Open accepts `{ timeout, until?, limits? }`; test and extraction accept `{ timeout, until? }`.
Options and limits must be ordinary own-data records without unknown keys, accessors, symbols, or
proxies. They are captured before the first asynchronous boundary.

Cancellation-array containers are also copied and frozen; their signal and lifecycle leaves stay
live. Sparse or decorated arrays, cycles, repeated container identities, more than 256 total nodes,
or more than 32 array levels are rejected. Structural leaves retain `UntilInput` behavior; container
admission does not make arbitrary leaf getters inert.

### Inspection

`archive.inspect()` returns the same frozen `Inspection` on every call. The archive handle,
inspection, usage record, entries array, and entry records are frozen.

| Field                              | Meaning                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------- |
| `sourceBytes`                      | Exact snapshot size.                                                      |
| `fileCount`                        | Explicit regular-file records.                                            |
| `directoryCount`                   | Explicit directory records; unlike extraction, excludes implicit parents. |
| `treeEntryCount`                   | Files, explicit directories, and implicit parents in the admitted tree.   |
| `compressedBytes`, `expandedBytes` | Sizes recorded by the archive, not yet verified.                          |
| `usage`                            | Counts of stored, deflated, UTF-8, and data-descriptor entries.           |
| `entries`                          | Complete metadata in zero-based central and physical order.               |

Each entry reports its path, kind, creator convention, compression method, DEFLATE option bits,
UTF-8 and descriptor use, CRC-32, sizes, and local-header offset. Directory paths retain `/`.
`deflateOption` records header flags, not a measurement of compression behavior. Archive and entry
comments remain private opaque bytes.

### Payload verification

`archive.test()` decodes regular files in archive order and checks:

- Complete decoding within each file's compressed range, with no trailing or concatenated data.
- Actual expanded sizes that match the recorded sizes and stay within file and aggregate limits.
- A matching CRC-32 for every file.

It discards decoded bytes and returns the frozen result
`{ kind: 'passed', filesTested, compressedBytes, expandedBytes }`. Inspection retains the recorded
claims; this result reports verified totals.

## Resource limits

Set partial `limits` at opening; they remain fixed for that archive. Omitted fields use these
defaults. Overrides must be positive safe integers.

| Limit              | Meaning                                                   | Default |
| ------------------ | --------------------------------------------------------- | ------: |
| `maxSourceBytes`   | Source bytes, checked before allocating the private copy. |  64 MiB |
| `maxEntries`       | Central-directory records.                                |   2,048 |
| `maxTreeEntries`   | Files, directories, and unique implicit parents.          |   8,192 |
| `maxPathBytes`     | Raw bytes in one entry name.                              |     512 |
| `maxPathDepth`     | Path components.                                          |      32 |
| `maxEntryBytes`    | Declared and actual expanded bytes per file.              | 128 MiB |
| `maxExpandedBytes` | Declared and actual expanded bytes across all files.      | 512 MiB |
| `maxErrorChars`    | Characters retained in a public failure message.          |  16,000 |

Opening adds one source-sized allocation plus parser metadata. Verification and extraction do not
buffer a complete expanded archive inside Zip; sink retention is the sink's responsibility. Declared
expansion is checked during opening and actual expansion during verification and both extraction
passes.

Zip yields between bounded segments of parsing and payload work, checking cancellation and elapsed
time at those boundaries. Inflater backpressure keeps input from outrunning content consumption.

## Supported ZIP32 grammar

The reader implements a closed subset of
[PKWARE APPNOTE 6.3.10](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT), revised
2022-11-01:

| Dimension        | Accepted                                                                   |
| ---------------- | -------------------------------------------------------------------------- |
| Container        | One contiguous, single-disk ZIP32 archive, including an empty archive.     |
| Layout           | Local records from byte zero, one central directory, one terminal EOCD.    |
| Versions         | Version-needed 1.0 or 2.0, according to the admitted feature.              |
| Compression      | Stored entries and raw DEFLATE.                                            |
| Data descriptors | Exact signed or unsigned ZIP32 descriptors.                                |
| Creators         | MS-DOS (`0`) and Unix (`3`) conventions for regular files and directories. |
| Names            | Canonical UTF-8 when flagged; otherwise printable ASCII only.              |
| Extra fields     | Extended timestamp (`0x5455`) and Info-ZIP Unix UID/GID (`0x7875`).        |
| Comments         | Bounded opaque bytes; not exposed.                                         |

Local and central records must agree on names, flags, method, and required version. Without a data
descriptor, sizes and CRC must match too. With one, local size/CRC fields must be zero and the
terminal descriptor must match the central record. Directory names, creator attributes, and the
trailing slash must agree; directories must be stored with zero sizes and CRC.

Records must meet exactly, without gaps, overlaps, prefixes, suffixes, ambiguous terminal records,
or contradictory offsets. Accepted timestamp and identity fields are grammar-checked, not returned
or applied to the filesystem.

The reader rejects these features rather than attempting partial support:

- ZIP64, split archives, encryption, and unsupported compression methods;
- patching, strong encryption, masked headers, digital signatures, and archive-extra-data records;
- symbolic links, devices, sockets, volume labels, and other special entries;
- unknown creators, flags, and unrecognized or duplicate extra fields;
- self-extracting prefixes, sparse layouts, and overlapping records.

### Portable paths

Archive names must describe one unambiguous relative tree:

- Use `/` between non-empty components. No absolute paths, drive prefixes, backslashes, `.` or `..`.
- Names must already be Unicode NFC, without C0/C1, line-separator, or format controls.
- No Windows-forbidden characters, trailing dots or spaces, or reserved device names.
- `.sys.rooted` component prefixes are reserved case-insensitively.
- Exact, lowercase, NFC, and NFD aliases may not collide.
- A file cannot also be a directory or an ancestor of another entry.
- Implicit parents count toward `maxTreeEntries`.

These rules align with Rooted target admission. They prevent ambiguous names, not concurrent
filesystem replacement. The concrete sink still needs a cooperative-filesystem contract; this is not
hostile-filesystem confinement or a durability guarantee.

## Failures

Expected failures reject with frozen `ZipError` values. Use `Zip.Is.failure()` to authenticate them,
not their name or message:

```ts
import { Zip } from 'jsr:@sys/archive/zip';

async function verifyZip(bytes: Uint8Array) {
  const work = { timeout: 30_000 };
  try {
    const archive = await Zip.open(bytes, work);
    return await archive.test(work);
  } catch (error) {
    if (!Zip.Is.failure(error)) throw error;
    console.error(error.operation, error.kind, error.entryIndex);
    throw error;
  }
}
```

`operation` identifies `open`, `test`, or `extract`; `kind` is the stable classification.
`entryIndex`, when present, identifies the zero-based entry responsible for a localized failure.

| Boundary   | Kinds                                                                       |
| ---------- | --------------------------------------------------------------------------- |
| Input      | `invalid-input`, `invalid-options`                                          |
| Lifecycle  | `cancelled`, `timeout`                                                      |
| Limits     | `source-limit`, `entry-limit`, `tree-limit`, `path-limit`, `expanded-limit` |
| Grammar    | `malformed`, `unsupported`, `invalid-name`, `collision`                     |
| Payload    | `deflate-failure`, `size-mismatch`, `crc-mismatch`                          |
| Extraction | `invalid-sink`, `sink-protocol`, `sink-failure`                             |

`unsupported` identifies an excluded feature; `malformed` identifies inconsistent or ambiguous
structure. Lookalikes and proxies do not pass `Zip.Is.failure()`. Messages are capped by
`maxErrorChars`; messages and `Error.cause` are diagnostics, not control-flow authority.

## Verification

The [tests](./src/m.Zip/-test/) use independently constructed ZIP records and corrupted payloads.
They cover strict grammar, byte ownership, resource bounds, extraction settlement, Rooted
interoperability, and execution with all ambient Deno permissions denied.
