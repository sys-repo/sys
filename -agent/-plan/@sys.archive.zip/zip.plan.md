zip.plan.md
- [x] e3cd77745 chore(archive): establish minimal package baseline
- [ ] feat(zip): add strict bounded ZIP32 inspection and integrity
- [ ] feat(fs): add bounded stable file snapshots
- [ ] feat(driver-pi): expose bounded ZIP inspection and integrity tools
- [ ] GATE human accepts the cooperative-filesystem ZIP extraction threat model
- [ ] feat(fs): add owned streaming tree construction to Rooted stages
- [ ] feat(zip): add bounded ZIP extraction through a tree sink
- [ ] feat(driver-pi): expose ZIP extraction under a cooperative-filesystem contract

## Purpose

Establish strict ZIP reading under `@sys/archive/zip` and let Driver Pi consume it through narrow
wrapper-owned tools:

```text
hostile ZIP bytes → strict ZIP32 structure → inspect → test integrity → optionally realize one new tree
```

The `@sys/archive` package owns archive-format composition, while its `/zip` module owns exact ZIP
protocol semantics. Neither is a filesystem namespace, shell façade, executable wrapper, or generic
cross-format runtime framework. The plan adds no Bash exception, external archive executable,
subprocess, runtime package resolution, ZIP creation, or implementation of another archive format.

Planning, review, and readiness do not authorize implementation or Git mutation.

## DMIND package and subpath decision

Use `@sys/archive/zip`.

- `archive` names the established domain of formats that collect named entries and metadata into one
  byte representation.
- `/zip` names the exact protocol and remains clear at imports such as
  `import { Zip } from '@sys/archive/zip'`.
- The archive namespace establishes taxonomy, not a format-neutral `Archive.open()` API, adapter
  registry, shared entry contract, or format detection.
- `compress` would be false: ZIP is a container format with paths, records, metadata, CRC, and
  stored entries that use no compression.
- `zip32` would freeze module identity to the first admitted grammar instead of expressing that ZIP64
  is currently unsupported policy.
- `fs/zip` would put serialization, record parsing, DEFLATE, and CRC under the filesystem owner.

`@sys/archive` is reserved on JSR and its canonical baseline exists at `code/sys/archive`. The
package exports root and type surfaces plus a behavior-free frozen `Zip` library stub from
`@sys/archive/zip`; the subpath import is covered by a direct dynamic-import test. Its README and JSR
description are `Read and write archives (ZIP).`

That description names the durable package domain. This plan implements ZIP reading, integrity
testing, and gated extraction only; ZIP creation and update remain outside this arc.

Do not create `@sys/compress`, an `Fs.Zip` namespace, compatibility aliases, or format-generic Driver
Pi tool names in this plan. Driver Pi names the exact protocol directly as `tools.zip` and `zip_*`.

## TMIND review outcome

The adversarial ownership review changed the earlier Driver Pi-local design:

- a security-sensitive ZIP parser is a reusable protocol primitive and must not be generated as a
  second local implementation inside Driver Pi;
- ZIP is neither a filesystem method nor a generic cross-format API: `@sys/archive` owns the stable
  archive-format domain and `@sys/archive/zip` owns exact ZIP protocol semantics;
- canonical filesystem policy requires stable source snapshotting and destination realization to be
  implemented in `@sys/fs`, then bundled from that owner rather than re-created in an extension;
- direct destination construction leaves visible partial trees and bespoke cleanup, while an owned
  Rooted stage keeps construction private and publishes one complete no-replace target;
- format-generic `archive_*` tool names would contradict the ZIP-only contract, so Driver Pi exposes
  `zip_*` names and `tools.zip` profile policy;
- an abort timer cannot fire within a synchronous parser quantum, so parsing is asynchronous with
  fixed cooperative yields and every CPU loop also checks finite remaining time against a monotonic
  clock; and
- Deno 2.9.6's built-in `node:zlib` provides both strict inflater settlement evidence and
  incremental CRC-32, avoiding `DecompressionStream`, a hand-written checksum, and an external
  dependency.

The remaining hard boundary is unchanged: path-based Deno filesystem APIs cannot defend extraction
against hostile concurrent ancestry replacement. Extraction therefore remains behind the explicit
cooperative-filesystem gate.

## Normative ZIP basis and fixture provenance

Pin V1 protocol semantics to PKWARE's `APPNOTE.TXT - .ZIP File Format Specification`, version
`6.3.10`, status `FINAL`, revised `2022-11-01`:

```text
https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
```

That document defines field layout and meaning; this plan intentionally accepts a strict subset.
Later APPNOTE revisions do not silently widen or reinterpret V1. Any semantic discrepancy discovered
against 6.3.10 is a plan blocker, and adopting another revision requires explicit review.

For creator system `3` only, pin the interoperable upper-word convention to Info-ZIP UnZip `6.0`,
release member `unix/unix.c`, function `mapattr()`, which maps `external_file_attributes >> 16` to
Unix mode bits:

```text
release: https://downloads.sourceforge.net/project/infozip/UnZip%206.x%20%28latest%29/UnZip%206.0/unzip60.tar.gz
readable source mirror: https://sources.debian.org/data/main/u/unzip/6.0-28/unix/unix.c
```

This secondary source governs only that encoding convention; it does not widen APPNOTE grammar or
authorize metadata restoration. The exact accepted masks and precedence are restated below so
runtime behavior does not depend on fetching or executing Info-ZIP.

Each checked-in fixture or deterministic fixture constructor records its provenance, relevant
APPNOTE sections/field values, the pinned Info-ZIP `mapattr()` convention when creator OS `3` is
involved, expected result, and an `@sys/crypto` checksum when bytes are stored. Use independently
hand-assembled empty/stored records, pinned raw-DEFLATE bytes produced by the Deno 2.9.6 built-in,
and mutation-derived hostile cases. Do not depend on one encoder, an external ZIP executable,
runtime network access, or undocumented corpus bytes. Cross-host tests may establish only the
operating systems they actually run; unsupported host behavior fails closed rather than being
inferred.

## Ownership boundary

### `@sys/archive/zip`

The `@sys/archive` package owns the archive-format domain without imposing a shared cross-format
runtime abstraction. Its `/zip` module owns only ZIP-format semantics:

- immutable ownership of caller-supplied archive bytes;
- exact ZIP32 parsing and structural validation;
- entry-name decoding, portable path validation, and collision analysis;
- raw-DEFLATE completion and exact-input-consumption checks;
- ZIP CRC-32 and actual expanded-byte accounting;
- inspection and integrity result contracts;
- verified entry streaming; and
- extraction orchestration against a narrow owned-tree sink.

`@sys/archive/zip` must not resolve filesystem paths, open source files, create arbitrary destination
paths, know Pi profiles, import Pi, or invoke a subprocess.

### `@sys/fs`

Own the two filesystem primitives exposed by the concrete ZIP consumer:

1. a bounded one-handle file snapshot with honest observed-drift evidence; and
2. streaming construction of files and directories inside a private active `Rooted` stage.

These are general filesystem operations, not ZIP methods. `@sys/fs` remains the only source owner of
platform filesystem calls. Do not duplicate its path, handle, identity, staging, publication, or
cleanup semantics inside `@sys/archive/zip` or Driver Pi.

### Driver Pi

Own only the agent-facing policy boundary:

- profile schema and disabled defaults;
- configured read/write roots and protected control/runtime roots;
- fixed wrapper limits and argument admission;
- generated extension materialization and prompt/runtime contracts;
- Pi host-ABI compatibility and shared mutation-queue participation;
- tool schemas, text formatting, and thrown Agent failures; and
- exact runtime registration under the active profile.

The generated extension is a deterministic artifact. It bundles the approved `@sys/archive/zip` and
`@sys/fs` owner modules needed by the enabled tools; it does not become a second implementation or
policy owner.

## Package and API shape

Implement the canonical `m.Zip` module already exposed from `code/sys/archive` as
`@sys/archive/zip`. Keep the first behavioral surface narrow:

```ts
import { Zip } from '@sys/archive/zip';

const archive = await Zip.open(bytes, { limits, until, timeout });
const inspection = archive.inspect();
const tested = await archive.test({ until, timeout });
```

The extraction item later adds:

```ts
await archive.extractTo(stage.writer, { until, timeout });
```

Contract:

- `Zip.open` is asynchronous. Before copying input it snapshots and validates arguments, attaches a
  canonical abortable lifecycle, awaits `Schedule.tick()` so pre-terminal and synchronously emitting
  `UntilInput` values settle, and rejects observed cancellation. It then copies the `Uint8Array`,
  rechecks cancellation/timeout, parses once with fixed cooperative yield points, and returns an
  object whose internal bytes cannot be mutated by the caller. The open lifecycle is operation
  scoped and disposed before promise settlement.
- `inspect` is synchronous after open, performs no payload inflation, exposes no payload bytes or
  mutable internal buffers, and returns frozen structured metadata.
- `test` processes every regular-file payload in physical order and returns only integrity counts
  and evidence.
- `extractTo` accepts only the narrow `Zip.Extract.TreeSink` contract. It receives no path string or
  ambient filesystem object. Driver Pi supplies an active `@sys/fs` private-stage writer as that
  sink.
- Every public result and entry record is frozen. Names are strings decoded under the contract
  below; raw mutable name buffers are not exposed.
- The API uses caller-supplied, validated finite limits. There is no unbounded overload.
- Cancellation is explicit through canonical `UntilInput`. `Zip.open` yields after at most 32 parsed
  records or 1 MiB of linear byte work, whichever comes first, using `Schedule.tick()` before
  rechecking lifecycle state. Finite `timeout` is the remaining work budget at each call boundary
  and is also checked against a monotonic clock. Neither mechanism retroactively cancels a completed
  return.
- Expected invalid archives, unsupported features, limit breaches, cancellation, and inflater
  failures reject with the exact typed failure ABI below. Error text safely escapes hostile names
  and is bounded by caller policy.

Item 1 lands this exact read-only public ABI, with namespace aliases under `t.Zip`:

```ts
type Format = 'zip32';
type EntryKind = 'file' | 'directory';
type CreatorSystem = 'ms-dos' | 'unix';
type Compression = 'stored' | 'deflate';
type DeflateOption = 'none' | 'normal' | 'maximum' | 'fast' | 'super-fast';

type WorkOptions = {
  readonly until?: t.UntilInput;
  readonly timeout: t.Msecs;
};

type OpenOptions = WorkOptions & {
  readonly limits: Limits;
};

type Entry = {
  readonly index: number;
  readonly path: string;
  readonly kind: EntryKind;
  readonly creatorSystem: CreatorSystem;
  readonly compression: Compression;
  readonly deflateOption: DeflateOption;
  readonly utf8: boolean;
  readonly dataDescriptor: boolean;
  readonly crc32: number;
  readonly compressedBytes: number;
  readonly expandedBytes: number;
  readonly localHeaderOffset: number;
};

type Usage = {
  readonly storedEntries: number;
  readonly deflatedEntries: number;
  readonly utf8Entries: number;
  readonly descriptorEntries: number;
};

type Inspection = {
  readonly format: Format;
  readonly sourceBytes: number;
  readonly fileCount: number;
  readonly directoryCount: number;
  readonly treeEntryCount: number;
  readonly compressedBytes: number;
  readonly expandedBytes: number;
  readonly usage: Usage;
  readonly entries: readonly Entry[];
};

type TestResult = {
  readonly kind: 'passed';
  readonly filesTested: number;
  readonly compressedBytes: number;
  readonly expandedBytes: number;
};

type Archive = {
  readonly inspect: () => Inspection;
  readonly test: (options: WorkOptions) => Promise<TestResult>;
};

type Operation = 'open' | 'test';
type FailureKind =
  | 'invalid-input'
  | 'invalid-options'
  | 'cancelled'
  | 'timeout'
  | 'source-limit'
  | 'entry-limit'
  | 'tree-limit'
  | 'path-limit'
  | 'expanded-limit'
  | 'malformed'
  | 'unsupported'
  | 'invalid-name'
  | 'collision'
  | 'deflate-failure'
  | 'size-mismatch'
  | 'crc-mismatch';

type Failure = Error & {
  readonly name: 'ZipError';
  readonly operation: Operation;
  readonly kind: FailureKind;
  readonly entryIndex?: number;
};

type Lib = {
  readonly Is: {
    readonly failure: (input: unknown) => input is Failure;
  };
  readonly open: (bytes: Uint8Array, options: OpenOptions) => Promise<Archive>;
};
```

Every count, byte length, and offset is a non-negative safe integer; `crc32` is an unsigned 32-bit
number; `index` is zero-based central/physical order; and directory `path` retains its one trailing
slash. `fileCount` and `directoryCount` count explicit central records, while `treeEntryCount` also
counts unique implicit directories. `deflateOption` is `none` only for stored entries; deflate flag
bits `00`, `01`, `10`, and `11` map respectively to `normal`, `maximum`, `fast`, and `super-fast`.
`inspect()` returns the same cached frozen `Inspection` identity on every call. Freeze `Archive`,
`Inspection`, `Usage`, every `Entry`, the entry array, every `TestResult`, and every `Failure` with
exact own public properties and no emitted `undefined` keys. A failure's optional `entryIndex`
appears only when one admitted central entry is responsible; `cause` is non-authoritative and never
traversed for formatting.

`Zip.Is.failure` is trap-free for arbitrary input, rejects proxies/accessors and structural
lookalikes, and recognizes only package-created branded failures with one listed operation/kind.
Consumer type fixtures for the future Driver read surface compile without casts and exact-shape
runtime tests assert every own field. Item 6 deliberately extends this ABI with extraction-specific
members listed in its section; no other item guesses field names.

Do not expose local-header scanners, inflater handles, unchecked entry constructors, writable
archive state, format-generic adapters, or dependency-specific zlib types.

## Fixed Driver Pi policy

Driver Pi freezes these v1 values into its generated runtime policy:

| Limit                                     |             Value |
| ----------------------------------------- | ----------------: |
| Tool source/destination argument          |  4,096 characters |
| Source file snapshot                      |            64 MiB |
| Central-directory entries                 |             2,048 |
| Realized files/directories                |             8,192 |
| Raw UTF-8/ASCII entry path                |         512 bytes |
| Entry path depth                          |     32 components |
| Expanded bytes per file                   |           128 MiB |
| Expanded bytes per archive                |           512 MiB |
| Human-facing inspection text              | 60,000 characters |
| Failure message text                      | 16,000 characters |
| Guard/open/parse/test/extract work budget |        120,000 ms |

The required `Zip.Limits` shape is exact:

```ts
type Limits = {
  readonly maxSourceBytes: number;
  readonly maxEntries: number;
  readonly maxTreeEntries: number;
  readonly maxPathBytes: number;
  readonly maxPathDepth: number;
  readonly maxEntryBytes: number;
  readonly maxExpandedBytes: number;
  readonly maxErrorChars: number;
};
```

Every field is a positive safe integer. Unknown/missing fields, accessors, proxies, and unsafe or
infinite values reject before input copying or parsing. Human-facing text and tool-argument limits
remain Driver Pi concerns rather than ZIP parser fields.

`@sys/archive/zip` validates safe-integer limit values and enforces the supplied policy. It does not
silently replace caller limits with Driver Pi values. Driver Pi owns these product limits and may
not widen them through profile YAML in v1.

Before copying, use canonical `Is.Native.proxy`, `Is.Native.uint8Array`, and
`Is.Native.sharedArrayBuffer` checks to require a host-native, non-proxy `Uint8Array` whose direct
prototype is exactly `Uint8Array.prototype`. Read its byte length and backing buffer only through
module-captured typed array intrinsic getters, and apply shared-buffer classification to that
captured backing; never consult shadowable instance properties, iterators, species, constructors,
`slice`, `subarray`, or `buffer`. Use captured backing-store state getters to reject detached
backing, every `SharedArrayBuffer`, and every resizable/growable backing store. Check the intrinsic
length against `maxSourceBytes`, allocate one plain fixed `Uint8Array` of exactly that length
through a module-captured constructor, copy through a captured intrinsic `TypedArray.prototype.set`,
then recheck source and copied intrinsic lengths. No failed source-limit check allocates archive
storage, and no user code runs between validation and copy.

The `@sys/fs` snapshot and `Zip.open` copy may briefly coexist, so v1 has a bounded peak of two
source buffers plus parser metadata; Driver Pi releases its snapshot reference immediately after
open.

Read source bytes with cap-plus-one logic; never trust metadata or a pre-read size to constrain
allocation. Reject declared entry and aggregate expanded sizes over policy before inflation, then
enforce actual output limits while streaming. Use checked safe-integer arithmetic for every offset,
length, count, and aggregate.

For read tools, the work deadline starts before source guarding; for extraction, it starts before
host-queue admission and therefore before source guarding. Track it with a monotonic clock and pass
the finite remaining timeout into each `@sys/fs` and `@sys/archive/zip` call; an
`AbortSignal.timeout()` alone cannot interrupt the bounded native byte copy or CPU work between
cooperative parse yields. On expiry, stop new work, terminate and await active inflaters and file
operations, then await owned cleanup. Deno filesystem calls are not preemptible, so cleanup may
extend beyond the work budget; do
not claim a hard wall-clock termination guarantee.

## Lifecycle settlement and work quanta

Every new public asynchronous operation in this arc—`Zip.open`, `archive.test`, `Fs.Snapshot.file`,
`stage.writer.writeTree`, and later `archive.extractTo`—must snapshot exact options, attach one
operation-scoped canonical abortable lifecycle, await `Schedule.tick()`, and recheck cancellation
and monotonic remaining time before copying bytes, processing payload, invoking a producer/sink, or
performing filesystem I/O. Pre-aborted signals, disposed lifecycle views, and synchronously emitting
observables therefore perform zero byte, inflater, producer, sink, or filesystem work. Dispose
lifecycle bridges before promise settlement.

Use these exact maximum synchronous/native segments:

- ZIP structure parsing yields through `Schedule.tick()` after 32 records or 1 MiB of linear byte
  work, whichever occurs first;
- stored and compressed input is presented in blocks no larger than 64 KiB;
- each native CRC call receives no more than 64 KiB;
- each inflater write receives no more than 64 KiB, and `createInflateRaw` is configured so each
  emitted output chunk is no larger than 64 KiB;
- payload processing checks cancellation/deadline before and after every input, CRC, inflater, and
  output segment, then uses `Schedule.tick()` after 1 MiB of compressed input or expanded output,
  whichever occurs first;
- `Fs.Snapshot.file` requests at most 64 KiB per handle read; and
- the stage writer copies and submits at most 64 KiB per write segment, regardless of producer chunk
  size.

The one fixed-source copy in `Zip.open` is the only unchunked native byte segment and remains
bounded by `maxSourceBytes`. A native segment or filesystem promise is not preemptible; checks bound
entry into and continuation after it rather than claiming hard interruption.

Each generated tool owns the same initial settlement before filesystem or host-queue authority. It
passes only that already-settled live signal to existing Rooted calls and rechecks immediately
before each call; it never forwards the caller's raw `UntilInput` independently to nested owners.

## Bounded stable file snapshot

Add one `@sys/fs` operation with this semantic shape:

```ts
const snapshot = await Fs.Snapshot.file({
  root,
  path,
  maxBytes,
  until,
  timeout,
});
```

Use this exact namespace and method name. Its types follow the existing namespace/type grammar and
must preserve these semantics:

1. Snapshot and validate every option before the first filesystem await.
2. Require an absolute configured root path and a selected absolute path lexically beneath it under
   canonical `@sys/fs` path semantics.
3. `lstat` the selected root as a real directory; reject a symlink root, every observed intermediate
   symlink, a final symlink, and a final non-file.
4. Open one read handle, `fstat` it, compare it with a post-open path `lstat`, and reject observed
   type or identity drift. Use `dev`/`ino` only where the host supplies safe-integer values; report
   metadata fallback as observed drift checking, never stable identity.
5. Read from that handle exactly once with cap-plus-one allocation behavior, checking cancellation
   and deadline between reads. Never reopen by path.
6. `fstat` again and reject observed identity and size drift plus mtime/ctime drift wherever those
   fields are available on both observations.
7. Close the handle on every path and settle closure before returning or rejecting.
8. Return the canonical absolute path, byte count, truthful evidence kind, and an owned plain fixed
   `Uint8Array` with direct `Uint8Array.prototype`, ordinary non-resizable `ArrayBuffer` backing,
   and no shared alias. Do not claim that the bytes authenticate their source or that the path
   stayed stable after return.

The operation narrows ordinary drift and creates one internally consistent byte snapshot. Because
Deno 2.9.6 exposes no directory-handle-relative `openat` traversal, it cannot remove the path-open
race under hostile concurrent ancestry replacement. That limitation belongs in the public contract.

## Exact ZIP32 grammar

V1 accepts one deliberately narrow grammar:

- little-endian, single-disk ZIP32;
- stored (`method 0`) and raw-deflated (`method 8`) entries only;
- one physically contiguous sequence of local records beginning at byte zero;
- one physically contiguous central directory immediately after the local records; and
- one EOCD, including its zero-to-65,535-byte comment, ending at the final source byte.

Locate EOCD candidates only in the final `22 + 65,535` bytes. A candidate is valid only when its
comment length lands exactly at EOF. Require exactly one candidate whose disk fields, entry counts,
central size, and central offset are internally consistent. Admit the selected EOCD comment as an
opaque byte string bounded by its unsigned 16-bit length and the source limit; do not decode,
expose, copy separately, or assign semantics to its bytes. Reject prepended data, trailing data,
gaps, archive-extra-data records, central-directory signatures, ambiguous EOCD candidates, and all
ZIP64 sentinel values, records, and extras.

Parse exactly the EOCD entry count of central headers and consume exactly the declared central
range. For each central entry:

- require disk-start zero and non-sentinel ZIP32 local offset, compressed size, and expanded size;
- accept version-needed raw value `10` or `20` only: stored entries without descriptors permit
  either, while every deflated or descriptor-bearing entry requires exactly `20`;
- reject encryption, strong encryption, patched data, enhanced deflate, masked headers, reserved
  flags, and every unsupported general-purpose bit;
- allow only deflate option bits, the data-descriptor bit, and the UTF-8-name bit where meaningful;
- parse each local and central extra area as exact length-delimited TLV data with no duplicate ID;
  permit only extended timestamp `0x5455` and Info-ZIP new Unix UID/GID `0x7875`, validate their
  complete field bodies, and ignore their admitted values; `0x5455` permits only defined low-three
  flag bits and exact present 32-bit timestamp words, with central form restricted to optional
  modification time; `0x7875` requires version `1`, one-to-eight-byte little-endian UID and GID
  fields, and exact exhaustion; reject every other extra ID as `unsupported`, including Unix
  `0x000d`, ZIP64, AES/strong-encryption, and alternate Unicode path/comment fields;
- consume each central file comment at its exact unsigned 16-bit declared length within the central
  range; admit its bytes as opaque bounded metadata, and never decode, expose, compare, copy
  separately, or let them affect entry identity or any result;
- accept only creator OS `0` (MS-DOS/FAT) and `3` (Unix), treating external attributes as one
  unsigned 32-bit value; reject the DOS volume-label bit `0x08`, and require DOS directory bit
  `0x10` to be set exactly when the authoritative name ends in `/`;
- for creator OS `0`, reject any non-zero upper-word type mask `(attributes >>> 16) & 0o170000`
  rather than interpreting host-dependent evidence; and
- for creator OS `3`, interpret that upper-word mask only under the pinned Info-ZIP convention:
  permit `0`, regular `0o100000`, or directory `0o040000`; require every non-zero type to agree with
  the DOS bit and trailing slash; and reject symlink `0o120000`, socket `0o140000`, device, FIFO,
  and every other type.

Require central entries to point to strictly increasing local offsets in the same order. Parse each
local fixed header and variable field at that exact offset. Central and local raw name bytes,
version-needed, flags, method, CRC, and sizes must agree, except that descriptor-mode local
CRC/sizes must use the permitted zero placeholders. Comments, timestamps, and ignored metadata
extras cannot affect identity.

A local record spans exactly:

```text
local header + name + extra + compressed payload + optional data descriptor
```

Its end must equal the next local offset or the central-directory offset for the final record. No
overlap, gap, scan, or payload-signature search is permitted. For descriptor mode, evaluate only the
12-byte unsigned and 16-byte signed ZIP32 layouts at the computed payload end. Accept exactly one
candidate whose CRC and sizes match the central header and whose end matches the next record
boundary. Reject zero or ambiguous matches.

Stored files require `compressedSize === expandedSize`. Directory entries require a stored empty
payload, zero sizes/CRC, and no descriptor. Declared per-entry and aggregate expanded sizes must fit
policy before any payload is processed.

## Portable entry-name contract

The central raw name is authoritative and must match the local raw name byte-for-byte.

- With the UTF-8 flag, decode with a fatal UTF-8 decoder.
- Without it, permit printable 7-bit ASCII only; reject CP437 and every other implicit encoding.
- Require non-empty NFC text and reject backslashes rather than translating them.
- Reject leading `/`, drive prefixes, UNC forms, empty components, `.`, `..`, NUL, C0/C1 controls,
  DEL, Unicode format controls, line/paragraph separators, and terminal escapes.
- Reject Windows-forbidden characters, trailing dot/space, and every case-insensitive device name
  refused by Rooted: `CON`, `PRN`, `AUX`, `NUL`, `CLOCK$`, `CONIN$`, `CONOUT$`, `COM1`…`COM9`,
  `LPT1`…`LPT9`, and `COM`/`LPT` with superscript `¹`, `²`, or `³`, including extensions.
- Reject any component whose lowercase form starts with Rooted's reserved `.sys.rooted` prefix.
- Enforce raw-byte and component-depth limits.
- Require directories to end in exactly one `/`; files must not end in `/`.

Build collision keys from exact NFC, NFD, and lowercase NFC/NFD component forms. Reject duplicate
keys, file/directory aliases, and file-as-parent prefix conflicts before exposing an archive. Build
one checked path trie containing every explicit file/directory and unique implicit parent, excluding
the sink root itself; reject before exposure when its unique node count exceeds `maxTreeEntries`,
and report the accepted count as `Inspection.treeEntryCount`. Runtime no-replace creation remains
the final platform collision check; do not claim that JavaScript lowercase mapping models every
filesystem's native case folding.

V1 deliberately makes every inspected ZIP entry satisfy Rooted's portable lexical target grammar; an
archive outside that subset fails `Zip.open` rather than becoming “inspectable but not extractable.”
Differential mutation/property tests against live Rooted admission prevent the two owners from
drifting.

Do not silently strip `__MACOSX`, `.DS_Store`, leading directories, or any other valid entry.
Inspection preserves the authoritative ZIP directory name with its trailing `/`. The extraction sink
batch removes that one type marker and supplies canonical root-relative directory paths without a
trailing slash; it performs no other name rewrite.

## Raw-DEFLATE and CRC contract

Use streaming `createInflateRaw()` from `node:zlib` with normal finish behavior. Use the runtime's
incremental `node:zlib.crc32()` for ZIP CRC-32 and normalize each result to an unsigned 32-bit
value; do not add a hand-written checksum table or mislabel CRC as cryptographic integrity.
`node:zlib` is Deno's built-in Node-compatible binding, not a subprocess or runtime
package-resolution path.

For every compressed member:

- feed only the exact central-directory compressed subrange;
- await successful `end`, not merely emitted output or `close`;
- reject every inflater error, including `unexpected end of file`;
- require `inflater.bytesWritten` to equal the exact compressed size so an early final block,
  concatenated member, or trailing compressed garbage cannot pass;
- count actual output before forwarding each chunk and stop above per-entry or aggregate limits;
- update CRC-32 and expanded-byte count incrementally;
- check cancellation and deadline throughout; and
- destroy and fully await stream settlement before returning or cleanup.

After completion, require actual expanded size and CRC-32 to equal the central values. A stream that
emits all declared bytes and matching CRC but never reaches a final DEFLATE block is still an error.
Stored entries pass through the same counting, CRC, cancellation, and deadline sink without an
inflater.

Do not use `DecompressionStream`, synchronous whole-output inflate APIs, an external package, or a
hand-written DEFLATE decoder.

## Inspection and integrity contracts

`archive.inspect()` returns:

- format (`zip32`) and source byte count;
- the complete policy-bounded entry list;
- regular-file and directory counts;
- compressed and declared-expanded totals; and
- methods and UTF-8/descriptor usage.

It never processes payload bytes. A limit breach rejects; it never returns an incomplete archive
claim.

`archive.test()` processes every regular-file payload in physical order into a byte-counting/CRC
sink and returns no payload bytes. Success means only that supported ZIP structure, exact DEFLATE
completion and consumption, actual and declared sizes, and CRC values passed under current limits.
It is not malware scanning, authenticity, provenance, signature verification, or content-safety
certification.

## Extraction gate contract

Gate-creation provenance (`2026-09-02`): the human architecture owner explicitly instructed this
planning work to keep extraction blocked until that owner accepts the cooperative-filesystem threat
model. This is a finite product-admission decision for mutating extraction, not a cautionary review
gate. The human architecture owner is the decision authority. The gate blocks these exact downstream
items:

- `feat(fs): add owned streaming tree construction to Rooted stages`;
- `feat(zip): add bounded ZIP extraction through a tree sink`; and
- `feat(driver-pi): expose ZIP extraction under a cooperative-filesystem contract`.

The pass condition is an explicit human decision equivalent to:

> I accept cooperative-filesystem ZIP extraction for isolated or hygienic single-user launches.
> Adversarial concurrent mutation of destination ancestry, Rooted metadata or stage state, and the
> published extraction tree is out of scope.

Before checking the gate, record the authority's exact decision wording and decision date in this
section. A question, design discussion, readiness assessment, or acknowledgement is not acceptance.

If the authority rejects this boundary or requires adversarial-concurrency resistance, remove the
gate and all three downstream extraction items from the live arc. Finish with `@sys/archive/zip`
inspection/testing, bounded `@sys/fs` snapshots, and Driver Pi read-only tools. A native
cross-platform directory-handle broker requires another reviewed plan.

## Cooperative-filesystem threat model

For every source snapshot, source-path topology is cooperative during guard/open: no adversary may
concurrently replace the selected path or its ancestry. This observed-identity limitation is an
explicit non-provenance contract of the read-only snapshot items, not part of the later
extraction-acceptance gate. The governing human brief expressly orders read-only snapshot and ZIP
tools before that mutation gate. Existing Deno read capability is the runtime admission authority:
the operation may read only within that granted scope and claims internally consistent bytes, not
stable path identity or caller-intended provenance. The process-level Deno read scope remains the
hard outer authority.

Once copied into `Zip.open`, treat the complete byte stream, records, metadata, names, sizes,
offsets, and payloads as hostile. Parser, inflater, counters, outputs, and errors must remain safe
for malicious ZIP input.

Extraction adds this assumption for the complete operation: no untrusted process or same-user actor
may concurrently replace or rename the destination root, `Rooted` metadata, private stage, target
ancestry, or published tree. `Rooted` leases coordinate only cooperating `Rooted` callers. Pi's
mutation queue serializes only the exact destination key, while sequential execution covers sibling
calls in one Agent batch. Neither mechanism creates subtree confinement, an OS sandbox, or defense
against a hostile peer with the same filesystem authority.

Suitable launches are isolated containers or hygienic single-user workspaces without concurrent
untrusted path mutation. A bind mount is not suitable when a host process can mutate it
concurrently. If the assumption cannot be made, extraction remains disabled.

## Owned streaming tree construction

Extend `Fs.Capability.Rooted.Stage` with a writer bound to that private active stage:

```ts
await stage.writer.writeTree(entries, {
  maxEntries,
  maxPathBytes,
  maxPathDepth,
  maxBytes,
  until,
  timeout,
});
```

Item 5 adds structurally compatible owner types under `t.FsRooted` without importing
`@sys/archive/zip`:

```ts
type TreeDirectory = { readonly kind: 'directory'; readonly path: t.StringPath };
type TreeFile = {
  readonly kind: 'file';
  readonly path: t.StringPath;
  readonly expectedBytes: number;
  readonly maxBytes: number;
  readonly stream: AsyncIterable<Uint8Array>;
};
type TreeEntry = TreeDirectory | TreeFile;
type TreeWriteOptions = {
  readonly maxEntries: number;
  readonly maxPathBytes: number;
  readonly maxPathDepth: number;
  readonly maxBytes: number;
  readonly until?: t.UntilInput;
  readonly timeout: t.Msecs;
};
type StageWriter = {
  readonly writeTree: (
    entries: readonly TreeEntry[],
    options: TreeWriteOptions,
  ) => Promise<void>;
};
```

`Stage` gains one frozen `readonly writer: StageWriter`; `t.FsRooted.Operation` adds `write-tree`,
and `t.FsRooted.FailureKind` adds `timeout`, `limit-exceeded`, and `producer-failure`. A write-tree
failure has `committed: false` before its first private mutation and `committed: true` afterward;
that flag reports private-stage reconciliation, never destination publication. `entries` is one
snapshotted declarative batch of root-relative directories and files. Use this exact runtime shape
under the existing namespace grammar and preserve:

- it works only while the creating stage is active and privately owned;
- it snapshots and validates the complete entry batch before invoking a byte source or mutating;
- batch admission rejects malformed paths, duplicate paths, file-as-parent conflicts, unknown keys,
  accessors, proxies, non-positive/unsafe limits, and non-finite byte bounds; it enforces exact
  entry, UTF-8 path-byte, depth, per-file, checked aggregate expected-byte, and actual
  aggregate-byte limits before or during mutation as applicable;
- directories are created non-recursively in deterministic parent-first order;
- files use create-new semantics and consume their streams sequentially in supplied order with
  backpressure;
- writes loop until every supplied byte is written, count before writing, enforce expected and
  maximum bytes, sync, close, and recheck descriptor identity and size;
- reject empty chunks; every yielded chunk passes the same native, non-proxy, fixed ordinary
  `Uint8Array` admission as ZIP input, and is copied through captured intrinsics in segments of at
  most 64 KiB before each subsequent await, preventing producer mutation from changing bytes in
  flight;
- symlinks, special files, multiply linked files, missing parents, collisions, foreign entries, and
  identity drift fail closed;
- cancellation stops new work and awaits active handle closure;
- no method overwrites, follows a link, recursively deletes, or mutates outside the stage; and
- after failure, the caller uses existing `discardStage`; cleanup refuses ownership loss and may
  leave private residue rather than delete an unproved path.

Item 5 also adds one stage-wide activity barrier. Every filesystem operation through `stage.files`
and every writer call acquires a parent-stage borrow before I/O and releases it only after handles
settle. A promotion atomically changes an active stage to `promoting` only when no borrow is live,
then blocks new borrows; otherwise it rejects `invalid-state` without renaming. Discard atomically
blocks new borrows, aborts an active writer through a stage-owned controller, and awaits all
borrowed operations before validation/removal. No stage mutation may continue after publication or
removal.

The writer itself is single-use with internal state `unclaimed | writing | complete | failed`. Its
first call atomically claims writer ownership; concurrent/repeated calls and every `stage.files`
operation after that claim reject. Success becomes `complete` only after every stream, write, sync,
identity check, and handle closure settles. Failure becomes `failed`; a writer-claimed stage
promotes only from `complete`, while `writing` or `failed` can only be discarded. An unclaimed stage
retains existing manually constructed-stage behavior, subject to the same zero-borrow promotion
barrier.

Paths, counts, and yielded bytes are untrusted data; executable `AsyncIterable` producer behavior is
a cooperative caller boundary. Race each `next()` against lifecycle expiry, observe late rejection,
and revoke its writer token so a late yield cannot write. A producer whose `next()` never settles
cannot be preempted by JavaScript. The stage writer closes owned file handles and revokes further
writes on timeout, but claims timely producer settlement only for conforming producers. Driver Pi
supplies only `@sys/archive/zip`-owned producers whose timeout/abort settlement is independently
proved.

This primitive constructs an unpublished tree. Publication still uses existing no-replace
`promoteStage()`. No partially constructed destination becomes visible. A published result followed
by a Rooted cleanup error is a committed failure: the complete destination may exist and must not be
deleted speculatively.

## Cooperative ZIP extraction

Item 6 adds the `Tree*` contracts under `t.Zip.Extract`, adds `ExtractResult` under `t.Zip`, and
extends the public ABI exactly:

```ts
type TreeDirectory = {
  readonly kind: 'directory';
  readonly path: string;
};

type TreeFile = {
  readonly kind: 'file';
  readonly path: string;
  readonly expectedBytes: number;
  readonly maxBytes: number;
  readonly stream: AsyncIterable<Uint8Array>;
};

type TreeEntry = TreeDirectory | TreeFile;
type TreeSinkOptions = {
  readonly maxEntries: number;
  readonly maxPathBytes: number;
  readonly maxPathDepth: number;
  readonly maxBytes: number;
  readonly until: AbortSignal;
  readonly timeout: t.Msecs;
};

type TreeSink = {
  readonly writeTree: (
    entries: readonly TreeEntry[],
    options: TreeSinkOptions,
  ) => Promise<void>;
};

type ExtractResult = {
  readonly kind: 'extracted';
  readonly fileCount: number;
  readonly directoryCount: number;
  readonly treeEntryCount: number;
  readonly expandedBytes: number;
};
```

It adds `extract` to `t.Zip.Operation`, adds `invalid-sink | sink-protocol | sink-failure` to
`t.Zip.FailureKind`, and adds
`extractTo(sink: TreeSink, options: WorkOptions): Promise<ExtractResult>` to `Archive`.
`directoryCount` includes explicit and implicit realized directories, `treeEntryCount` is exactly
`fileCount + directoryCount`, and `expandedBytes` is the actual written file-byte total. Freeze
every batch, entry, options record, and result with the same exact-shape rules as item 1.

`archive.extractTo(sink, { until, timeout })` performs:

1. strict snapshotting and validation of sink/options without invoking getters, proxies, or sink
   methods;
2. a complete integrity pass over the archive's private snapshot before invoking the sink;
3. construction of one deterministic directory/file batch, including implicit parents;
4. one sink call with directories in parent-first order and one-use file streams in physical archive
   order, passing exact `maxTreeEntries`, `maxPathBytes`, `maxPathDepth`, and `maxExpandedBytes`
   values as the sink's four bounds;
5. a second payload pass whose streams enforce the same DEFLATE completion, exact-input-consumption,
   size, CRC, cancellation, and deadline checks, yielding only fresh plain fixed `Uint8Array` chunks
   of at most 64 KiB; stored chunks are copied from archive-private bytes, and deflate output is
   copied from Node-owned buffers before exposure;
6. verification that the sink consumed every file stream exactly once, fully, sequentially, and
   settled before success; and
7. unconditional revocation in `finally`: every iterator method checks an operation token, active
   `next()` work is aborted, its inflater is destroyed and awaited, and every retained iterator
   rejects after settlement without reading archive bytes.

The extraction batch realizes exactly the path trie admitted by `Zip.open`; it creates no additional
node, and `treeEntryCount <= maxTreeEntries` is rechecked before the sink call. Thus implicit-parent
amplification is an explicit 8,192-node product bound, not `maxEntries × maxPathDepth` hidden work.

The extraction API receives no destination root or ambient filesystem object. The sink contract can
only consume the validated tree batch. Race the single sink promise against lifecycle expiry and
attach a late-rejection observer before returning a timeout failure. Sink implementation code is a
cooperative caller boundary: JavaScript cannot force an arbitrary never-settling sink promise to
finish. Timeout revokes all ZIP stream authority, but timely full sink settlement is claimed only
for conforming sinks. Driver Pi supplies the independently proved active `@sys/fs` stage writer,
retains ownership of discard/promotion, and keeps destination coordination active until one settles.

Do not preserve ownership, ACLs, xattrs, executable bits, DOS attributes, timestamps, or archive
permissions. Do not create links or special entries. Running `archive.test()` first is neither
required nor an authority token; extraction performs its own preflight from the archive object's
private bytes.

## Driver Pi read-only integration

The read-only Driver Pi item adds this dormant profile family:

```yaml
tools:
  zip:
    enabled: false
```

`enabled: true` registers:

```text
zip_inspect({ path })
zip_test({ path })
```

Register both with `executionMode: 'sequential'`. In Pi 0.84.4, the presence of either in one Agent
batch serializes every sibling call in that batch, bounding one active ZIP snapshot/inflater per
Agent loop. Do not claim process-global or cross-process serialization.

Omission and `enabled: false` register nothing. At this arc point, `extract` is an unknown key and
must be rejected. No existing profile is migrated or silently enabled.

Item 3 establishes one Driver-owned protected-path guard shared by read and later extraction code;
generated entrypoints bundle that owner and do not copy its logic. For every path component, compare
conservative ASCII-lowercase plus NFC/NFD forms and reject `.git`, `.pi`, and every name whose
folded form starts `.sys.rooted`. Normalize Windows drive-letter case. Resolve configured operation
and protected roots once at launch into lexical folded forms and, where they exist, canonical real
paths plus safe `dev`/`ino` evidence. Existing sources must remain beneath an allowed canonical read
root and outside every protected canonical/folded root; destinations use the canonical existing
parent, folded absent basename, and containment checks in both directions. Over-rejection on a
case-sensitive filesystem is acceptable; do not claim JavaScript folding models every native alias.
Observed path identity remains subject to the cooperative source/destination topology boundary.

Driver Pi:

1. enforces the argument cap and rejects empty, glob-shaped, `~`-prefixed, `..`-segment, NUL,
   control, newline, or terminal-escape-bearing requests;
2. resolves the exact path against `ctx.cwd`, permits it only inside configured read roots, and
   refuses protected control/runtime paths including `.git`, `.pi`, `.sys.rooted*`, and legacy
   runtime roots;
3. requires an ASCII-case-insensitive `.zip` suffix;
4. obtains one `Fs.Snapshot.file` result under the shared work deadline;
5. opens the owned bytes through `Zip.open` with the frozen policy, then releases the caller
   snapshot reference; and
6. formats bounded human text separately from complete structured details.

`zip_inspect` reports requested/resolved source path, source bytes, ZIP32 format, complete entry
metadata, counts/totals, method/flag usage, and whether display text truncated. `zip_test` creates
no files and returns no payload bytes.

Generate and load only:

```text
.pi/@sys/extensions/zip/mod.read.ts
```

Materialize it from owner source with pinned Deno `2.9.6` single-file bundling: inline relative
modules, disable code splitting and source maps, and externalize only the approved host built-ins.
The read artifact has no residual relative or dynamic import and exactly two permitted external
specifier values: `node:zlib` and `node:util`. The mutating artifact later has no residual relative
or dynamic import and permits exactly `node:zlib`, `node:util`, `node:fs`, `node:fs/promises`, and
bare `@earendil-works/pi-coding-agent`. Every other `node:`, bare, `npm:`, `jsr:`, `http:`, or
`https:` specifier is a generation failure; allowlists never widen automatically.

Build twice from separate clean temporary roots and require byte-identical output and identical
`@sys/crypto` SHA-256 values. Use syntax-aware pinned-Deno module-graph inspection—not regular
expressions—to enumerate all static imports/exports and reject every dynamic import,
`import.meta.resolve`, `eval`, and `Function` construction form before materialization. Build and
validate the complete enabled artifact set in a private generated directory, atomically replace each
owned entrypoint, remove stale ZIP-owned read/extract artifacts from prior profile states, assert
the exact final file set, and only then emit loader arguments. A fresh directory and every
disabled/read/extract state transition must converge to that same exact set; no missing or stale
sidecar can participate in loading.

The read entrypoint adds no run, net, env, FFI, subprocess, or write permission and uses only
already resolved user-data read roots. The later mutating entrypoint adds only configured
destination-write roots; it still adds no run, net, env, FFI, or subprocess authority. Built-in
imports grant no such authority. Neither entrypoint introduces an executable dependency or startup
preflight.

## Driver Pi extraction integration

After the gate and both lower-owner extraction items land, extend the profile with one literal mode:

```yaml
tools:
  zip:
    enabled: true
    extract: cooperative
```

The strict schema permits `extract: cooperative` only with `enabled: true`. It rejects booleans,
unknown modes, omission/false beside `extract`, and unknown keys. There are no overwrite flags,
selectors, passwords, format arrays, or profile-level limits in v1.

Generate and load a separate mutating entrypoint only in that state:

```text
.pi/@sys/extensions/zip/mod.extract.ts
```

`zip_extract` accepts only `{ path, to }`. Register it with `executionMode: 'sequential'`. Resolve
and admit the absolute destination queue key through the shared lexical/protected-root guard and
canonical existing parent, without allocating source bytes, then wrap source snapshotting plus the
complete destination guard, Rooted stage construction, promotion, cleanup, and settlement window in
the exact running Pi host's `withFileMutationQueue(absoluteDestination, fn)`.

The pinned Pi `0.84.4` queue first serializes every caller through one process-global,
non-cancellable registration chain while deriving a key: an existing path uses `realpath`, while an
`ENOENT`/`ENOTDIR` path uses its lexical absolute form. Only after registration does callback mutual
exclusion apply to that exact derived key. A blocked `realpath` therefore blocks registration for
unrelated destinations, and existence races can change key form. The queue does not coordinate
descendants or the Rooted metadata tree; it is cooperative coordination, not subtree confinement. Do
not claim that different-destination admission or any registration wait is independently bounded.

Pi 0.84.4's registration and same-key callback waits are not cancellation-aware. Queue contention or
key resolution is therefore a cooperative external wait that may delay tool settlement beyond the
120-second work budget. When the callback eventually starts, it must recheck cancellation and the
monotonic deadline before source allocation or filesystem mutation, throw without mutation if either
expired, and release its queue position. Do not claim bounded wall-clock settlement while another
caller holds the host queue indefinitely.

Import the queue through bare `@earendil-works/pi-coding-agent` only in the mutating entrypoint
module. Pi's extension loader must alias it to the running host module and shared singleton. Before
adding prompt text or launch args, reject an unresolved, local, overridden, or otherwise unproven
host specifier. V1 supports only the exact pinned Pi `0.84.4` ABI established by owner tests.

Extraction flow:

1. validate arguments and derive/admit the absolute destination queue key without reading the
   source, then repeat the complete guard inside the callback;
2. enter the host mutation queue with no archive buffer, stage, file handle, or Rooted lease held;
3. on callback entry, reject expired cancellation/deadline before mutation;
4. snapshot and open the source under the same read policy as inspect/test, then run complete
   `@sys/archive/zip` integrity preflight before creating a stage;
5. fully guard `to` within a configured write root and outside protected/operation roots, including
   every `.sys.rooted*` internal path;
6. reject an existing destination, missing/non-directory parent, symlink parent chain, and observed
   parent drift;
7. bind `Rooted` to the configured write root, admit the destination, and acquire the required
   exclusive cooperative lease;
8. create one private stage, extract through its writer, and promote the complete stage with
   no-replace semantics;
9. discard only an unpublished owned stage on failure, preserving any ownership-loss residue and
   reporting cleanup separately; and
10. settle queue, lease, inflater, file, and cleanup resources before success or thrown failure.

A prepublication failure exposes no destination. `occupied` leaves the existing target untouched. A
post-publication cleanup failure reports that the complete destination may exist; it never claims
rollback and never removes the published tree speculatively.

The Runtime Tool Contract, prompt, and `dsl tools zip` state exact limits, restart semantics,
live-callability boundaries, untrusted-data status, cooperative threat model, the queue-contention
settlement caveat, and the absence of Bash, helper-runtime, ad hoc-script, external executable, or
subprocess fallbacks.

## Tool failure ABI

Generated tool `execute()` functions return `AgentToolResult` only on success. Every guard refusal,
malformed archive, unsupported feature, limit, timeout, cancellation, inflater failure, filesystem
failure, and cleanup-bearing extraction failure throws an `Error` with actionable text capped at
16,000 characters.

Escape hostile path/name text before interpolation. For truncated aggregate failures, include the
exact omitted count. Never return or type an `isError` field. Direct unit tests are insufficient:
prove failure through the pinned real Agent loop and assert both
`tool_execution_end.isError === true` and the transcript result's `isError === true`.

## Runtime matrix

Before the extraction item, only these states exist:

| Profile state                   | Generated/loaded entrypoints | Prompt/runtime tools      |
| ------------------------------- | ---------------------------- | ------------------------- |
| ZIP omitted or `enabled: false` | none                         | none                      |
| `enabled: true`                 | `mod.read.ts`                | `zip_inspect`, `zip_test` |
| any `extract` key               | schema rejected              | none                      |

After the gated extraction item:

| Profile state                                                   | Generated/loaded entrypoints       | Prompt/runtime tools                     |
| --------------------------------------------------------------- | ---------------------------------- | ---------------------------------------- |
| ZIP omitted or `enabled: false`                                 | none                               | none                                     |
| `enabled: true`, extract omitted                                | `mod.read.ts`                      | `zip_inspect`, `zip_test`                |
| `enabled: true`, `extract: cooperative` with supported host ABI | read + extract                     | all three tools plus cooperative warning |
| extract requested with unproven host ABI                        | launch rejected before prompt/args | none                                     |
| invalid extract shape or mode                                   | schema rejected                    | none                                     |

## Proof — strict ZIP32 inspection and integrity

Owner tests in `@sys/archive/zip` prove:

- canonical package/type/export shape and no filesystem, subprocess, network, or runtime-resolution
  dependency;
- the exact read ABI, field encodings, own-key/deep-freeze boundaries, branded `Zip.Is.failure`
  behavior, and a future-Driver consumer fixture compile without casts;
- proxies and subclasses are rejected; shadowed typed-array properties are never invoked; detached,
  resizable, fixed shared, and growable shared backing stores fail before archive allocation;
- intrinsic source length passes exactly at the cap and cap-plus-one fails with an injected
  allocator proving no oversized copy; concurrent shared mutation cannot enter the copy path;
- async `Zip.open` and `archive.test` reject pre-aborted signals, disposed lifecycle views, and
  synchronously emitting observables with zero copy/parser/payload/inflater work;
- cancellation and finite timeout during parsing and payload processing stop at each declared
  64-KiB/1-MiB/record quantum; only the bounded source copy is unchunked, and every lifecycle
  listener is disposed before settlement;
- exact empty, stored, deflated, mixed file/directory, descriptor, ASCII, and UTF-8 fixtures;
- zero-length, ordinary, and unsigned-16-bit-boundary EOCD and central file comments pass as opaque
  metadata and never appear in public results; malformed comment lengths, comment range overruns,
  EOCD ambiguity induced by candidate bytes inside a comment, truncation, bad offsets, gaps,
  overlap, central/local contradiction, malformed extras/descriptors, and prepended/trailing bytes
  fail;
- encryption, unsupported flags/methods, ZIP64, split disks, unsupported creator OS values, links,
  special types, contradictory DOS/Unix type evidence, and alternate-name extras fail closed;
- exact version-needed `10`/`20` combinations, every DOS/Unix type mask, Info-ZIP upper-word
  convention, `0x000d`, allowed `0x5455`/`0x7875` bodies, and every unlisted extra ID pass or fail
  at their declared boundaries;
- traversal, absolute, drive, UNC, backslash, control/format characters, invalid UTF-8, CP437,
  Rooted-reserved prefixes and device names, duplicates, normalization/case collisions, and prefix
  conflicts fail;
- differential mutation/property fixtures prove every ZIP-admitted extraction path passes live
  Rooted lexical admission and detect policy drift;
- path-trie fixtures pass at exactly `maxTreeEntries`, fail at plus one before exposure, and prove
  checked unique implicit-parent accounting rather than entry-depth multiplication;
- every supplied limit and finite timeout passes exactly at its boundary and fails at boundary plus
  one, including timeout checks between bounded parse/payload quanta;
- final-block clearing, truncated streams that emit bytes before error, malformed codes, early-final
  streams with trailing bytes, concatenated streams, declared-size mismatch, and bad CRC fail;
- incremental `node:zlib.crc32` matches canonical ZIP vectors and chunk-boundary permutations;
- every valid/hostile fixture records APPNOTE 6.3.10 section provenance, Info-ZIP 6.0 `mapattr()`
  provenance where applicable, and expected field semantics, while stored bytes carry canonical
  checksums;
- cancellation/deadline destroys and awaits each inflater;
- inspect invokes no payload processor, test emits no payload bytes, and all results are frozen; and
- a deterministic malformed-record/stream mutation corpus supplements happy-path encoder fixtures.

Run package `deno task check`, `deno task test`, dry publication, and the relevant workspace graph
check for the new package.

## Proof — bounded stable snapshots

Owner tests in `@sys/fs` prove:

- strict option snapshotting and root/path admission;
- pre-aborted, disposed, and synchronously emitting lifecycle inputs settle before any filesystem
  invocation, with lifecycle disposal on every result;
- exact cap and cap-plus-one behavior without trusting metadata size, using reads of at most 64 KiB;
- returned bytes have exact plain fixed non-shared `Uint8Array` ownership accepted directly by
  `Zip.open`;
- one handle, no path reopen, descriptor reads, and complete closure on every path;
- root/intermediate/final symlink refusal and final regular-file requirement;
- observed open/path identity mismatch and during-read size/time/identity drift refusal;
- honest evidence fallback where stable identity is unavailable;
- cancellation and monotonic finite-timeout checks between reads; and
- direct execution with only exact fixture-read permission while write, run, net, and FFI are
  denied.

Run `@sys/fs` check/unit/process proof and broader workspace checks affected by its public type
surface.

## Proof — Driver Pi read tools

Owner tests prove:

- strict read-only schema, disabled defaults, policy roots, protected roots, and the pre-extraction
  runtime matrix;
- shared path guarding rejects ASCII-case, drive-case, NFC/NFD, canonical-realpath, and
  safe-identity aliases of `.git`, `.pi`, `.sys.rooted*`, and configured protected roots under
  injected case-insensitive semantics and each real supported host;
- a fresh output and every prior profile transition leave exactly one atomically written
  `mod.read.ts`, no sidecar/stale extraction artifact, and unchanged launcher permission scope;
- two clean pinned-Deno builds are byte/hash identical; syntax-aware graph inspection finds no
  relative or dynamic import and exactly `node:zlib` plus `node:util` as external specifiers;
- read entrypoint loading through the pinned real Pi extension loader;
- direct generated execution with only extension/fixture read permission while write, run, net, and
  FFI are denied;
- generated execute lifecycle settlement makes a pre-aborted execution signal perform zero
  filesystem or ZIP work;
- a real Agent batch containing many inspect/test calls executes with at most one active ZIP source
  snapshot or inflater and preserves ordered settlement;
- source guarding delegates one-handle bounded snapshot behavior to `@sys/fs` and parsing/integrity
  to `@sys/archive/zip` without local reimplementation;
- inspect text escaping/truncation preserves complete bounded structured details;
- inspect performs no payload work and test performs no filesystem write; and
- thrown failures produce failed events/transcript results through the pinned real Agent loop.

Run narrow archive/extension/profile tests, Driver Pi `deno task check`, and `deno task test:unit`.

## Proof — owned streaming Rooted stages

Owner tests in `@sys/fs` prove:

- only active creating stages accept one writer call, and pre-aborted/disposed/synchronous lifecycle
  input performs zero producer or filesystem work;
- complete-batch snapshotting rejects malformed inputs, collisions, prefix conflicts, accessors, and
  proxies before invoking byte sources or writing, with exact entry/path/depth/aggregate boundaries
  and checked arithmetic;
- deterministic non-recursive directory creation and create-new streaming file writes;
- short writes, strict producer-chunk admission, at-most-64-KiB copying/writes, mutation after
  yield, per-file and actual aggregate byte boundaries, finite timeout, sync, close, and descriptor
  recheck;
- symlink, special-file, multiply-linked, missing-parent, collision, and identity-drift refusal;
- cancellation and injected write/sync/close failures settle handles before discard;
- timeout races a delayed/non-settling `next()`, closes the handle, observes late rejection, and
  prevents a late yield from writing;
- stage activity borrows reject concurrent promotion and second/repeated writers, block every child
  operation after writer claim or promotion/discard begins, and permit writer-owned promotion only
  after `complete`;
- discard during delayed write/sync/close aborts and awaits the writer plus every stage borrow
  before removal, while failed writers can never promote;
- failed discard leaves unproved objects rather than recursively deleting them;
- no target destination is visible before `promoteStage`, and no descriptor writes after
  publication; and
- occupied, published, committed-cleanup, and ownership-loss outcomes preserve existing Rooted
  contracts.

Run all Rooted unit/process proofs, package check, and affected workspace tests.

## Proof — cooperative ZIP extraction

Owner tests in `@sys/archive/zip` prove:

- extraction adds exactly the declared `Archive`, sink, result, operation, and failure-kind ABI with
  no path or ambient `Fs`;
- malformed sink inputs and pre-aborted/disposed/synchronous lifecycle inputs are rejected without
  getter/method/payload invocation, and corrupt archives fail complete preflight without invoking
  the sink;
- exact stored/deflated bytes, implicit directories, and UTF-8 paths stream through one
  deterministic snapshotted sink batch with all four exact archive bounds passed to the sink;
- skipped, repeated, concurrent, partial, and out-of-order stream consumption reject, while the
  write-pass DEFLATE completion, exact consumption, actual size, and CRC are reverified;
- retained iterators after success, failure, early sink return, sink throw, timeout, or partial
  consumption are revoked; active `next()` and inflater work settles, and later calls expose no
  bytes;
- timeout can reject around a deliberately non-settling sink, observes a later sink rejection, and
  leaves every ZIP iterator revoked;
- cooperative sink/producer limits are explicit, and conforming test sinks settle under every
  injected timeout/failure;
- hostile sinks retain and mutate every stored/deflate chunk across success, failure, and timeout;
  chunks are fresh plain fixed arrays, and repeated inspection/integrity results remain unchanged;
- no metadata, links, ownership, modes, ACLs, xattrs, or timestamps are restored;
- actual expansion limits, cancellation, timeout, and sink failures settle each inflater; and
- no source bytes are reread or exposed after `Zip.open`.

Rerun every inspection/integrity proof plus package check and dry publication.

## Proof — Driver Pi extraction tool

Owner tests prove:

- only `extract: cooperative` plus the supported host ABI controls schema, bundle args, prompt text,
  and live registration;
- the mutating entrypoint resolves the bare queue import to the pinned real host singleton;
- pinned source-contract tests distinguish global non-cancellable registration, existence-sensitive
  realpath/lexical keying, and exact-key callback exclusion;
- same-key, different-key, blocked-realpath, existing/missing-key, cancelled-waiter, and
  registration-failure-recovery probes retain no source bytes before callback entry; after eventual
  release an expired callback performs no mutation and both global/key queues remain usable;
- a real Agent batch containing extraction executes sibling tools sequentially;
- direct extraction works with exact source-read/destination-write permission while run, net, and
  FFI are denied;
- corrupt input creates neither stage nor destination;
- existing destination, missing parent, operation/protected roots, case/normalization/realpath
  aliases, symlink parents, and no-replace races are refused through the item-3 shared guard;
- successful extraction publishes one complete destination through Rooted;
- cross-owner integration proves the concrete Rooted writer plus ZIP producer pair settles and
  revokes stream authority under every injected timeout/failure;
- every prepublication injected failure discards only its owned stage, with primary and cleanup
  errors separated and bounded;
- ownership loss leaves private residue visible in the cleanup report;
- post-publication cleanup failure reports a possibly present complete destination and does not
  delete it;
- no partial destination is success, and no source path is reopened after snapshot; and
- clean deterministic generation leaves exactly the two declared single-file entrypoints; the
  extraction artifact has no relative/dynamic import and retains exactly `node:zlib`, `node:util`,
  `node:fs`, `node:fs/promises`, and the proven bare host queue import; and
- no Bash, external archive executable, subprocess, runtime package resolution, or unapproved import
  is reachable.

Rerun all lower-owner proof, Driver Pi `deno task check`, `deno task test:unit`, and the broader
workspace verification appropriate to the final diff.

## Non-goals

- no Bash exemption or Pi use of a ZIP CLI;
- no adversarial same-user concurrent-filesystem guarantee;
- no native broker, direct FFI, subprocess, or external archive executable;
- no `DecompressionStream` integrity use or hand-written DEFLATE/CRC implementation;
- no ZIP creation, update, overwrite, merge, or selective extraction;
- no passwords or encrypted archives;
- no ZIP64, split archives, self-extracting prefixes, central signatures, or nested recursion;
- no TAR, GZIP, BZIP2, XZ, Zstandard, 7z, or RAR;
- no generic cross-format archive API, compression package, adapter registry, or format
  negotiation;
- no profile-level limit tuning in Driver Pi v1; and
- no claim that CRC, integrity testing, staging, sealing, or extraction establishes provenance,
  authenticity, malware safety, content trust, or future filesystem state.
