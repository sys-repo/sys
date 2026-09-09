zip.plan.md
- [x] e3cd77745 chore(archive): establish minimal package baseline
- [x] ebca1f132 feat(zip): add strict bounded ZIP32 inspection and integrity
- [x] a121f91d6 test(zip): prove direct Fs snapshot interoperability
- [x] 3ca35dc7c fix(zip): enforce cancellation fan-in bounds
- [x] 6b2098dbd feat(fs): add bounded stable file snapshots
- [x] c88540147 docs(fs): clarify stable snapshot evidence and limits
- [x] ac9ce8579 refactor(fs): establish standalone Snapshot module
- [x] 063bdfb51 feat(fs): expose lstat and realPath through a narrow observation entry
- [x] b6d5762f0 refactor(fs): narrow observation dependencies and verify public imports
- [x] 973a448f2 refactor(driver-pi): factor profile tool schemas
- [x] 62daa0c38 feat(driver-pi): add bounded read-only ZIP extension
- [x] 1dbe61766 feat(driver-pi): enable ZIP inspection in profiles
- [x] 08956e1b0 refactor(driver-pi): nest filesystem extension under sandbox
- [x] [rooted-streaming-tree.plan.md](../@sys.fs/rooted-streaming-tree.plan.md)
- [x] 2487b8b62 feat(zip): add bounded ZIP extraction through a tree sink
- [x] [pi-dependency-metadata.plan.md](../@sys.driver-pi/pi-dependency-metadata.plan.md)
- [x] 8294315b9 fix(fs): preserve Rooted publication and cleanup failure evidence
- [x] 951a682ec feat(driver-pi): expose ZIP extraction under a cooperative-filesystem contract
- [x] [dispose-until-snapshot.plan.md](../@sys.std/dispose-until-snapshot.plan.md)
- [x] 431d5a769 fix(driver-pi): restore browser proof environment ordering

## Completion

The ZIP feature and final corrective item are landed. The implementation arc is complete;
this plan is ready for separate retirement.
Every checked local item reconciles to reachable history, and the three prerequisite plans have
completed opening arcs. The human's cooperative-filesystem admission is recorded in the Rooted
prerequisite. This file retains the implementation, decisions, proof, and limits.

The extraction landing received a focused independent GO with no material target findings. The
accepted artifact hashes, selected-host proof, and four independent native-I/O probes are recorded
below. Archive fixture maintenance has separate owner-test evidence; it was outside the independent
reviewer's stated approval scope. No additional ZIP behavior or architectural review is required;
the final correction resolved the browser-task mismatch carried by the feature commit.

The subsequent GUI test-rollup cleanup landed in `7d5257552`; its grouped task passed **4 suites /
46 steps**. That commit also reordered ZIP test-common exports. These are adjacent test maintenance,
not another ZIP feature item, and do not change the production extraction or artifact contract.

Completion is scoped, not a claim of a green repository-wide suite. The extraction commit also
carried the unrelated `test-browser-frozen.env` ordering change that had been excluded from ZIP
review. A post-landing focused run reproduced the assertion failure at
`code/sys.driver/driver-pi/-scripts/-test/-task.start.gui.release.local.test.ts:90`.
The correction landed in `431d5a769`, restoring the original `test-browser-frozen.env` order in
`code/sys.driver/driver-pi/deno.json`. At the human's request, the test now checks exact environment
allowlist membership without order; the remaining permission object retains exact equality.
Missing or extra grants still fail. No permission expansion or ZIP production/artifact change occurred.

The final assertion passed the focused browser-task contract test (**1 suite / 5 steps**), formatting,
lint, and whitespace checks. After landing, `deno task --cwd code/sys.driver/driver-pi test:unit --quiet`
passed **73 suites / 486 steps, 0 failures**, closing the recorded unit-suite failure. The broader
`deno task test` chain was not run for this closeout; no process, real-preview, or browser-release
acceptance is inferred from the unit result. Earlier review-time failures below remain historical
evidence, not current blockers.

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
- `zip32` would freeze module identity to the first admitted grammar instead of expressing that
  ZIP64 is currently unsupported policy.
- `fs/zip` would put serialization, record parsing, DEFLATE, and CRC under the filesystem owner.

`@sys/archive` has its canonical package at `code/sys/archive`. The baseline established the root,
type, and ZIP subpath surfaces; the ZIP owner implementation supplies the frozen `Zip` library with
`Is` and `open`, followed by inspection and integrity methods on an opened archive. The package-domain
description is `Read and write archives (ZIP).` It does not attest to implemented ZIP creation.

That description names the durable package domain. This plan implements ZIP reading, integrity
testing, and gated extraction only; ZIP creation and update remain outside this arc.

Do not create `@sys/compress`, an `Fs.Zip` namespace, compatibility aliases, or format-generic
Driver Pi tool names in this plan. Driver Pi names the exact protocol directly as `tools.zip` and
`zip_*`.

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
  dependency;
- a 64-KiB chunk cap does not by itself bound a duplex transform, so the inflater must use fixed
  readable/writable high-water marks, one-at-a-time input admission, pull-mode output, and explicit
  write backpressure rather than an application-level output queue; and
- `AsyncIterable` is the one narrow owner-to-owner content seam: each source is lazy, pull-driven,
  single-use, and operation-scoped, with exact iterator acquisition, early-return, revocation, and
  settlement rules; and
- the tree writer rejects empty or oversized producer chunks and snapshots each complete admitted
  chunk before its first await, closing the mutation window rather than pretending that segmented
  copying stabilizes a larger caller-owned view. Do not add a second public payload-stream
  abstraction before a demonstrated consumer requires one.

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

`@sys/archive/zip` must not resolve filesystem paths, open source files, create arbitrary
destination paths, know Pi profiles, import Pi, or invoke a subprocess.

### `@sys/fs`

Own the two filesystem primitives exposed by the concrete ZIP consumer:

1. a bounded one-handle file snapshot with honest observed-drift evidence; and
2. streaming construction of files and directories inside a private active `Rooted` stage.

These are general filesystem operations, not ZIP methods. Launch-time and pre-snapshot metadata
observations use the existing `lstat` and `realPath` functions through explicit named exports at
`@sys/fs/observe`; they preserve identity with `Fs.lstat` and `Fs.realPath`. This entry is not a
second observation implementation, a stable-identity capability, or filesystem confinement.

`@sys/fs` remains the only source owner of platform filesystem calls. Do not duplicate its path,
handle, identity, staging, publication, or cleanup semantics inside `@sys/archive/zip` or Driver Pi.

### Driver Pi

Own only the agent-facing policy boundary:

- profile schema and default-on read-only ZIP policy with explicit opt-out;
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

const archive = await Zip.open(bytes, { limits: { maxEntries: 500 }, until, timeout });
const inspection = archive.inspect();
const tested = await archive.test({ until, timeout });
```

The extraction item later adds:

```ts
await archive.extractTo(stage.writer, { until, timeout });
```

The ZIP inspection/integrity item deliberately exposes no standalone entry-content stream. `test` owns and drains its payload
work internally. A public `read()`, `ReadableStream`, or disposable reader would add another
lifecycle and partial-consumption contract without a current consumer. The ZIP extraction item
introduces the first content seam only inside the bounded lifetime of `extractTo`: a standard pull-based `AsyncIterable`
connects one ZIP-owned file source to one tree sink, while `extractTo` owns ordering, cancellation,
integrity preflight, and final revocation. This keeps the ordinary API simple and leaves deeper
composition available through a deliberately supplied sink. `AsyncIterable` is the smallest standard
protocol that expresses this ownership: one `next()` is one unit of demand and `return()` is the
cleanup path. `ReadableStream` would add controller queues, locking, teeing, and adapter semantics;
a chunk callback would invert control into a bespoke push protocol.

`Zip.open` likewise does not accept a forward-only archive stream. ZIP locates its authoritative
central directory at the end and then requires validated random access to local records. A forward
source therefore needs a separate bounded spool or seekable-source owner; disguising that storage as
simple streaming would add authority and failure modes. V1's finite owned `Uint8Array` snapshot is
the explicit, sufficient source contract.

Contract:

- `Zip.open` is asynchronous. Before copying input it snapshots and validates arguments, attaches a
  canonical abortable lifecycle, awaits `Schedule.tick()` so pre-terminal and synchronously emitting
  `UntilInput` values settle, and rejects observed cancellation. It then copies the `Uint8Array`,
  rechecks cancellation/timeout, parses once with fixed cooperative yield points, and returns an
  object whose internal bytes cannot be mutated by the caller. The open lifecycle is operation
  scoped and disposed before promise settlement.
- `Zip.open` and `archive.test` snapshot cancellation-array containers before byte work. Count every
  input/array node, including `undefined` placeholders, against one exact 256-node budget and admit
  at most 32 nested array levels. Bound each array length against the remaining node budget before
  bulk descriptor/key collection, reject direct or prototype-chain proxies without invoking traps,
  and retain canonical getter-bearing structural lifecycle-leaf behavior.
- `inspect` is synchronous after open, performs no payload inflation, exposes no payload bytes or
  mutable internal buffers, and returns frozen structured metadata.
- `test` processes every regular-file payload in physical order and returns only integrity counts
  and evidence.
- `extractTo` accepts only the narrow `Zip.Extract.TreeSink` contract. It receives no path string or
  ambient filesystem object. Driver Pi supplies an active `@sys/fs` private-stage writer as that
  sink.
- Every public result and entry record is frozen. Names are strings decoded under the contract
  below; raw mutable name buffers are not exposed.
- `Zip.open` merges optional caller limit overrides into finite package defaults before work. There
  is no unbounded overload.
- Cancellation is explicit through canonical `UntilInput`. `Zip.open` yields after at most 32 parsed
  records or 1 MiB of linear byte work, whichever comes first, using `Schedule.tick()` before
  rechecking lifecycle state. Finite `timeout` is the remaining work budget at each call boundary
  and is also checked against a monotonic clock. Neither mechanism retroactively cancels a completed
  return.
- Expected invalid archives, unsupported features, limit breaches, cancellation, and inflater
  failures reject with the exact typed failure ABI below. Error text safely escapes hostile names
  and is bounded by caller policy.

The ZIP inspection/integrity item defines this exact read-only public ABI under `t.Zip`:

```ts
type Format = 'zip32';
type EntryKind = 'file' | 'directory';
type CreatorSystem = 'ms-dos' | 'unix';
type Compression = 'stored' | 'deflate';
type DeflateOption = 'none' | 'normal' | 'maximum' | 'fast' | 'super-fast';

type WorkOptions = {
  until?: t.UntilInput;
  timeout: t.Msecs;
};

type OpenOptions = WorkOptions & {
  limits?: Partial<Limits>;
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

namespace Failure {
  type Error = globalThis.Error & {
    readonly name: 'ZipError';
    readonly operation: Operation;
    readonly kind: Kind;
    readonly entryIndex?: number;
  };

  type Kind =
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
}

namespace Is {
  type Lib = {
    failure(input: unknown): input is Failure.Error;
  };
}

type Lib = {
  readonly Is: Is.Lib;
  readonly open: (bytes: Uint8Array, options: OpenOptions) => Promise<Archive>;
};
```

Every count, byte length, and offset is a non-negative safe integer; `crc32` is an unsigned 32-bit
number; `index` is zero-based central/physical order; and directory `path` retains its one trailing
slash. `fileCount` and `directoryCount` count explicit central records, while `treeEntryCount` also
counts unique implicit directories. `deflateOption` is `none` only for stored entries; deflate flag
bits `00`, `01`, `10`, and `11` map respectively to `normal`, `maximum`, `fast`, and `super-fast`.
`inspect()` returns the same cached frozen `Inspection` identity on every call. Freeze `Archive`,
`Inspection`, `Usage`, every `Entry`, the entry array, every `TestResult`, and every `Failure.Error`
with exact own public properties and no emitted `undefined` keys. A failure's optional `entryIndex`
appears only when one admitted central entry is responsible; `cause` is non-authoritative and never
traversed for formatting.

`Zip.Is.failure` is trap-free for arbitrary input, rejects proxies/accessors and structural
lookalikes, and recognizes only package-created branded failures with one listed operation/kind.
Consumer type fixtures for the future Driver read surface compile without casts and exact-shape
runtime tests assert every own field. The ZIP extraction item deliberately extends this ABI with
extraction-specific members listed in its section; no other item guesses field names.

Do not expose local-header scanners, inflater handles, unchecked entry constructors, writable
archive state, standalone entry readers, Web/Node stream objects, format-generic adapters, or
dependency-specific zlib types.

## Fixed Driver Pi policy

`@sys/archive/zip` uses the ZIP parser values below as bounded defaults. Driver Pi freezes the same
v1 parser values into its generated runtime policy and supplies them explicitly, so wrapper policy
does not depend on package-default drift:

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

The complete mutable input field set is:

```ts
type Limits = {
  maxSourceBytes: number;
  maxEntries: number;
  maxTreeEntries: number;
  maxPathBytes: number;
  maxPathDepth: number;
  maxEntryBytes: number;
  maxExpandedBytes: number;
  maxErrorChars: number;
};
```

Every supplied field is a positive safe integer. `OpenOptions.limits` is an optional exact
`Partial<Limits>` record: omitted fields use the package defaults above, while unknown fields,
accessors, proxies, and unsafe or infinite supplied values reject before input copying or parsing.
Human-facing text and tool-argument limits remain Driver Pi concerns rather than ZIP parser fields.

`@sys/archive/zip` validates the resolved finite limit set and enforces it. Driver Pi owns its fixed
product policy, supplies every parser field explicitly, and may not widen those values through
profile YAML in v1.

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
extend beyond the work budget; do not claim a hard wall-clock termination guarantee.

## Cancellation snapshot maintenance

[dispose-until-snapshot.plan.md](../@sys.std/dispose-until-snapshot.plan.md) independently owns the
`Dispose.Snapshot.until()` primitive, readonly-input compatibility, Archive/Fs Snapshot call-site
replacements, and affected Driver Pi artifact regeneration. Existing admission remains valid until
replaced; this maintenance does not block the preceding ZIP implementation items or change the
independent Rooted streaming-tree work.

The reference at the end of this plan's opening arc participates in plan closure: ZIP implementation
may proceed without the refactor, but this plan cannot close until the referenced maintenance plan
completes. Its contract and implementation ledger live only in that std plan. Deadline factoring is
a separate opportunity, not part of the cancellation snapshot refactor.

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
- the stage writer admits only non-empty producer chunks of at most 64 KiB, snapshots the complete
  admitted chunk before its first write await, and submits at most 64 KiB per write segment.

The one fixed-source copy in `Zip.open` is the only unchunked native byte segment and remains
bounded by `maxSourceBytes`. A native segment or filesystem promise is not preemptible; checks bound
entry into and continuation after it rather than claiming hard interruption.

Each generated tool owns the same initial settlement before filesystem or host-queue authority. It
passes only that already-settled live signal to existing Rooted calls and rechecks immediately
before each call; it never forwards the caller's raw `UntilInput` independently to nested owners.

## Bounded payload pump

Use one internal payload-processing contract for integrity testing and extraction. It accepts one
admitted entry, reads only that entry's exact private compressed range, and either discards verified
output for `test` or presents fresh expanded segments to the operation-scoped extraction source
after archive-wide integrity preflight. Stored and deflated entries share actual-size, CRC,
aggregate-limit, lifecycle, and scheduler accounting. No public type exposes this internal pump.

For DEFLATE, configure `createInflateRaw` with a 64-KiB `chunkSize`, a 64-KiB
`writableHighWaterMark`, and a one-byte `readableHighWaterMark`. Node's readable high-water mark is
a backpressure threshold, not a hard byte cap: the one-byte threshold makes every non-empty output
chunk apply backpressure, while `chunkSize` bounds that one queued chunk to 64 KiB. The compressed
feeder and expanded consumer run as one joined duplex operation:

- submit at most one compressed block of at most 64 KiB at a time; do not submit the next block
  until the current write callback has settled and any `false` write result has reached `drain`;
- consume the readable side only in paused pull mode; do not use flowing `data` events, an
  application-level chunk queue, eager pumping, or concurrent `next()` calls;
- count limits and update CRC before an expanded segment can be discarded or exposed;
- admit at most one expanded segment of at most 64 KiB across the JavaScript consumer boundary, and
  request another only after the current demand has settled;
- after the exact compressed range is submitted, join feeder completion, writable `end`, readable
  completion, inflater success, exact input consumption, actual size, and CRC before reporting
  success; and
- on cancellation, timeout, consumer return, feeder/readable failure, or limit breach, stop both
  sides, destroy the inflater exactly once, observe every late callback/rejection, and await all
  owner-controlled settlement before the operation settles.

This is backpressure, not merely chunking. The package memory claim includes the private archive
copy, parser metadata, fixed zlib/native high-water buffers, one admitted compressed block, and one
expanded block. It excludes bytes a caller deliberately retains after receiving fresh output. Stored
entries use the same pull contract without zlib and never copy or CRC more than one 64-KiB segment
in response to one demand.

The implementation may use the inflater's native async iterator or an equivalent paused reader, but
it must prove these semantics under pinned Deno 2.9.6. Do not bridge zlib through a freely growing
promise/event queue. The implementation is blocked if the runtime cannot prove the configured
high-water marks, maximum emitted chunk size, exact-input-consumption evidence, or complete destroy
settlement.

## Bounded stable file snapshot

Add one `@sys/fs` operation with this exact runtime shape:

```ts
const snapshot = await Fs.Snapshot.file({
  root,
  path,
  maxBytes,
  until,
  timeout,
});
```

`t.Snapshot` owns the exact public contract below, and `Fs.Lib` gains
`readonly Snapshot: t.Snapshot.Lib`:

```ts
namespace Snapshot {
  type Lib = {
    readonly Is: Is.Lib;
    readonly file: File.Method;
  };

  namespace File {
    type Method = (options: Options) => Promise<Result>;

    type Options = {
      root: t.StringAbsoluteDir;
      path: t.StringAbsolutePath;
      maxBytes: t.NumberBytes;
      until?: t.UntilInput;
      timeout: t.Msecs;
    };

    type Result = {
      readonly path: t.StringAbsolutePath;
      readonly byteLength: t.NumberBytes;
      readonly evidence: Evidence.Kind;
      readonly bytes: Uint8Array;
    };
  }

  namespace Evidence {
    type Kind = 'device-inode' | 'metadata-only';
  }

  namespace Failure {
    type Error = globalThis.Error & {
      readonly name: 'FsSnapshotError';
      readonly operation: 'file';
      readonly kind: Kind;
    };

    type Kind =
      | 'invalid-options'
      | 'invalid-root'
      | 'invalid-path'
      | 'cancelled'
      | 'timeout'
      | 'missing'
      | 'source-limit'
      | 'unsafe-filesystem'
      | 'source-changed'
      | 'permission-denied'
      | 'io-failure';
  }

  namespace Is {
    type Lib = {
      failure(input: unknown): input is Failure.Error;
    };
  }
}
```

Caller options are mutable input. Snapshot the top-level options record and every cancellation-array
container before the first filesystem await without invoking container getters, proxy traps,
inherited values, or iterators; reject unknown or missing option keys and malformed array
containers. Structural lifecycle leaves retain canonical `UntilInput` behavior: validation and
subscription may observe their public properties and invoke getters as caller-authorized lifecycle
code. `root`, `path`, `maxBytes`, and `timeout` are required and `until` is the only optional key.
Before path normalization, reject NUL and cap each raw `root` and `path` at a fixed package ceiling
of 32,768 UTF-16 code units; recheck each normalized value against the same ceiling. This safety
bound is not a profile knob, and Driver Pi's 4,096-character request limit remains independently
stricter. `maxBytes` is a non-negative safe integer with checked room for the cap-plus-one probe, so
zero admits only an empty file. `timeout` is a non-negative safe integer and starts at the public
call boundary before option and `UntilInput` snapshotting. Snapshot cancellation fan-in with the
same maximum 256 total input/array nodes, counting `undefined` placeholders, and 32 nested array
levels as the ZIP owner. Bound an array's length against the remaining node budget before bulk key
or descriptor collection. A pre-terminal lifecycle performs no filesystem operation, and every
lifecycle subscription is disposed before settlement.

`Fs.Snapshot` and `Fs.Snapshot.Is` are frozen exact-key runtime records. A `Failure.Error` is a
frozen owner-branded native error with exactly the enumerable `name`, `operation`, and `kind`
fields; `Fs.Snapshot.Is.failure` is trap-free and rejects proxies and structural lookalikes. Failure
messages are fixed bounded text and never interpolate caller paths or native cause text. The failure
kinds are semantic API classifications rather than a mirror of host exception names:
`invalid-options` covers the options container, key set, numeric fields, or cancellation shape;
`invalid-root` covers a non-string, empty, NUL-bearing, over-limit, or non-absolute root;
`invalid-path` covers the same selected-path defects plus failure to be a strict lexical descendant;
`missing` covers any observed filesystem absence; `unsafe-filesystem` covers an observed symlink or
wrong filesystem type; `source-changed` covers observed identity/size/time drift; and `source-limit`
covers cap-plus-one. Map recognized authority failures to `permission-denied` and all other host
failures to `io-failure` without exposing host-specific error types. The first authoritative
terminal cause wins; always close the one owned handle, observe closure failure, and classify it as
`io-failure` only when no prior failure exists. A later cleanup failure never replaces an existing
primary failure.

Own the runtime at `m.Snapshot/mod.ts`, its guard library at `m.Snapshot/m.Is.ts`, its public type
spine at `m.Snapshot/t.ts`, and its behavior under `m.Snapshot/u/*`. Compose that same frozen runtime
object into `Fs.Snapshot` and export it directly as `@sys/fs/snapshot`. `t.Snapshot` is the sole type
owner; do not mirror it under `t.Fs` or add another runtime implementation, ambient path reader, or
package-path alias. Keep Node filesystem imports localized to their sole Rooted consumer.
Preserve these operation semantics:

1. After the fixed pre-normalization length check, normalize the already-absolute root and selected
   path through canonical `@sys/fs` lexical path semantics, recheck both lengths, require the
   selected path to be strictly beneath the root, and return that normalized selected path rather
   than a symlink-following `realPath` result.
2. `lstat` the selected root as a real directory and each selected-path component in order; reject a
   symlink root, every observed intermediate symlink or non-directory, a final symlink, and a final
   non-regular file.
3. Open one read-only handle exactly once, `fstat` it, compare it with a post-open path `lstat`, and
   reject observed type, identity, size, or available mtime/ctime drift. Never reopen by path.
4. Read one complete pass from that handle with each request capped at 64 KiB. Do not trust metadata
   size for allocation or admission; detect exactly cap plus one and reject `source-limit` before
   retaining additional source bytes. Check cancellation and the monotonic deadline before and after
   every filesystem await and read segment.
5. `fstat` the same handle after the read and reject observed identity or size drift plus
   mtime/ctime drift wherever each field is available on both compared observations.
6. Emit `device-inode` only when every required final-file observation supplies matching
   non-negative safe-integer device and inode values. This public literal expands Deno's `dev`
   (filesystem device identifier, not development) and `ino` (inode number) field names. Every pair
   of observations that supplies complete device/inode values must agree even when another
   observation forces fallback. Emit `metadata-only` whenever complete identity evidence across all
   observations is unavailable; this fallback reports only regular-file type, size, and available
   mtime/ctime observations. The literals describe final-file evidence, not continuity of the
   previously observed ancestry.
7. Close the handle exactly once on every path and settle closure before returning or rejecting.
8. Return one frozen exact-key `File.Result`. Its `byteLength` equals `bytes.byteLength`; `bytes` is
   a caller-owned mutable `Uint8Array` with direct `Uint8Array.prototype`, byte offset zero, and an
   exact-length ordinary non-resizable `ArrayBuffer` backing with no shared alias or retained
   package reference. It is accepted directly by `Zip.open` without adaptation.

The operation narrows ordinary drift and creates one internally consistent byte snapshot. Neither
evidence kind authenticates the source, proves uninterrupted path or ancestry identity, detects
every possible in-place content mutation, or claims that the path remains stable after return.
Because Deno 2.9.6 exposes no directory-handle-relative `openat` traversal, this operation cannot
remove the path-open race under hostile concurrent ancestry replacement. That limitation is public
contract, not an implementation defect.

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

## Extraction admission dependency

Gate-creation provenance (`2026-09-02`): the human architecture owner explicitly instructed this
planning work to keep extraction blocked until that owner accepts the cooperative-filesystem threat
model. This is a finite product-admission decision for mutating extraction, not a cautionary review
gate. The human architecture owner is the decision authority.

The referenced
[`rooted-streaming-tree.plan.md`](../@sys.fs/rooted-streaming-tree.plan.md) owns the one live gate and
its resolution evidence because that decision now controls admission of the Rooted writer as well as
these downstream items:

- `feat(zip): add bounded ZIP extraction through a tree sink`; and
- `feat(driver-pi): expose ZIP extraction under a cooperative-filesystem contract`.

The human accepted the boundary and the Rooted writer landed; the prerequisite owns their resolution
evidence. This section preserves the downstream rationale and is not a second gate ledger. If a
future deployment requires adversarial-concurrency resistance, keep extraction disabled there and
use the read-only tools under their source-topology contract. A native cross-platform
directory-handle broker or stronger isolation belongs to another reviewed plan; it does not erase
the completed cooperative arc.

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

## Filesystem prerequisite

The independent
[rooted-streaming-tree.plan.md](../@sys.fs/rooted-streaming-tree.plan.md) owns bounded streaming tree
construction inside private Rooted stages. ZIP extraction depends only on its landed public tree-sink
contract; this plan does not govern that filesystem implementation.

## Cooperative ZIP extraction

The ZIP extraction item adds the `Tree*` contracts under `t.Zip.Extract`, adds `ExtractResult`
under `t.Zip`, and extends the public ABI exactly:

```ts
type TreeDirectory = {
  readonly kind: 'directory';
  readonly path: string;
};

type TreeFile = {
  readonly kind: 'file';
  readonly path: string;
  readonly expectedBytes: number;
  readonly content: AsyncIterable<Uint8Array>;
};

type TreeEntry = TreeDirectory | TreeFile;
type TreeSinkOptions = {
  readonly maxEntries: number;
  readonly maxPathBytes: number;
  readonly maxPathDepth: number;
  readonly maxFileBytes: number;
  readonly maxTreeBytes: number;
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
`t.Zip.Failure.Kind`, and adds
`extractTo(sink: TreeSink, options: WorkOptions): Promise<ExtractResult>` to `Archive`.
`directoryCount` includes explicit and implicit requested directories, `treeEntryCount` is exactly
`fileCount + directoryCount`, and `expandedBytes` is the actual content-byte total fully consumed by
the successful sink. It does not independently prove the sink's external side effects. Freeze every
batch, entry, content source, options record, and result with the read-only ABI's exact-shape rules;
iterator instances remain private operation state rather than reusable public records.

`archive.extractTo(sink, { until, timeout })` performs:

1. strict snapshotting and validation of sink/options without invoking getters, proxies, or sink
   methods;
2. a complete integrity pass over the archive's private snapshot before invoking the sink;
3. construction of one deterministic directory/file batch, including implicit parents;
4. one sink call with directories in parent-first order and one-use file `content` sources in
   physical archive order, passing `maxTreeEntries` as `maxEntries`, `maxPathBytes` and
   `maxPathDepth` unchanged, `maxEntryBytes` as `maxFileBytes`, and `maxExpandedBytes` as
   `maxTreeBytes`;
5. a second payload pass whose content sources use the bounded pump and recheck DEFLATE completion,
   exact input consumption, actual size, CRC, cancellation, and deadline, yielding only fresh plain
   fixed `Uint8Array` chunks of at most 64 KiB; stored chunks are copied from archive-private bytes,
   and deflate output is copied from Node-owned buffers before exposure;
6. verification that the sink consumed every file's content exactly once, fully, sequentially, and
   settled before success; and
7. unconditional revocation in `finally`: every iterator method checks an operation token, active
   `next()` work is aborted, its inflater is destroyed and awaited, and every retained iterator
   rejects after settlement without reading archive bytes.

Each `TreeFile.content` is a frozen inert `AsyncIterable` until its iterator is acquired. Its first
`[Symbol.asyncIterator]()` call atomically claims that exact file at the expected ordinal; repeated,
concurrent, or out-of-order acquisition latches and throws a branded `sink-protocol` failure. The
returned iterator accepts only one live `next()` call, starts no payload work without demand, and
yields at most one fresh 64-KiB-or-smaller chunk per settled demand. `done: true` is returned only
after the second-pass size, CRC, DEFLATE-finalization, and exact-consumption checks succeed. Before
that point, `return()` records incomplete consumption, revokes the source, and destroys and awaits
active inflater work; after clean completion, repeated `next()`/`return()` are inert `done: true`
results. Repeated/concurrent/out-of-order acquisition or demand is an operation-terminal protocol
violation even when a hostile sink catches the surfaced failure. An ordinary early `return()` is
cleanup evidence rather than immediate public error selection: if the sink then rejects, its
`sink-failure` remains primary unless cancellation, timeout, an explicit protocol violation, or a
package-owned payload failure already won the terminal latch; if the sink resolves, incomplete
consumption becomes `sink-protocol`. Cleanup failures are observed but never overwrite that primary
failure. After operation settlement, acquisition throws and asynchronous iterator methods reject
before reading archive bytes. The extraction terminal latch is monotonic: the first authoritative
package, lifecycle, explicit-protocol, or sink terminal wins, and every later settlement is observed
without reclassification. This standard async-iteration seam deliberately has no parallel custom
`done` promise, stream controller, Node handle, or eager producer queue. Every file, including a
zero-byte file, must be acquired and reach clean iterator completion; declared size is not a
substitute for consuming the content protocol.

The extraction batch realizes exactly the path trie admitted by `Zip.open`; it creates no additional
node, and `treeEntryCount <= maxTreeEntries` is rechecked before the sink call. Thus implicit-parent
amplification is an explicit 8,192-node product bound, not `maxEntries × maxPathDepth` hidden work.

The extraction API receives no destination root or ambient filesystem object. The sink receives only
the validated tree batch and normalized bounded operation options. Race the single sink promise
against lifecycle expiry and attach a late-rejection observer before returning a timeout failure.
Invoking `writeTree`, its synchronous prefix, and a returned promise that never settles are
cooperative caller boundaries JavaScript cannot preempt. Timeout revokes all ZIP content authority,
but timely full sink settlement is claimed only for conforming sinks. Driver Pi supplies the
independently proved active `@sys/fs` stage writer, retains ownership of discard/promotion, and
keeps destination coordination active until one settles.

Do not preserve ownership, ACLs, xattrs, executable bits, DOS attributes, timestamps, or archive
permissions. Do not create links or special entries. Running `archive.test()` first is neither
required nor an authority token; extraction performs its own preflight from the archive object's
private bytes.

## Driver Pi read-only integration

### Scope and evidence

Expose exactly two read-only tools: `zip_inspect` and `zip_test`. Keep ZIP parsing and integrity in
Archive, byte snapshots in Fs, and path/protected-root policy in Driver Pi. Do not add extraction,
provider serializers, private Pi imports, fake models, parser-differential harnesses, Agent-loop
proofs, custom syntax plugins, or feature-specific process-test infrastructure.

Pi package authority is root `deps.yaml`; prep regenerates the single fallback in
`src/m.cli/u/u.resolve.pkg.ts`. Tool-summary admission compares against that generated package spec
and omits advisory detail for a custom or mismatched package. No second Pi version pin is permitted.

Current read-only evidence:

- `prep:zip` admits one text-plus-digest ESM artifact with one default export and only `node:util`
  and `node:zlib` imports.
- Profile proofs cover default-on/opt-out materialization, alias-safe migration, exact file/symlink
  read grants without parent broadening, conservative selector reporting, and registration versus
  live-callability wording.
- Filesystem-extension composition is exposed and consumed through `PiExtension.Sandbox.Fs` without
  changing the generated sandbox filesystem policy or runtime path.
- Nine focused modules / 75 steps and the full 69-module / 429-step Driver Pi unit suite passed;
  package check, exact-scope lint, correction-scope formatting, and whitespace checks also passed.

These results do not claim live-session callability, provider serialization, hostile-filesystem
confinement, or extraction. The schema layout under `u.schema/` is independently owned and must not
be reorganized as part of ZIP work.

### Completion order

1. Keep the fixed policy, source guard, Snapshot handoff, Archive calls, and bounded result
   formatting.
2. Keep default-on schema/migration behavior, explicit opt-out, future-launch materialization, and
   advertisement derived from successfully materialized extensions.
3. Regenerate the single-file artifact with `prep:zip`; require its exact import/export graph,
   policy marker, admitted text shape, and digest.
4. Run only affected ZIP/profile tests, Driver Pi `check`, formatting, lint, and whitespace checks.
5. Stop. Extraction remains behind its existing human gate and is not part of this item.

### Profile and runtime contract

The read-only Driver Pi item adds this default-on profile family, as approved by the human:

```yaml
tools:
  zip:
    enabled: true
```

Omitted policy and `enabled: true` register:

```text
zip_inspect({ path })
zip_test({ path })
```

Register both with `executionMode: 'sequential'` so the host does not overlap them within one tool
batch. Do not add an Agent-loop harness or claim process-global/cross-process serialization.

Explicit `enabled: false` registers nothing. Migration fills missing ZIP policy or `enabled` with
`true` for discoverability, preserves explicit `false`, and leaves malformed tool policy invalid for
schema validation. This default enables only inspection and integrity testing; it adds no filesystem
grants, extraction, creation, or fallback authority. At this arc point, `extract` is an unknown key
and must be rejected; future mutation tools do not inherit this enablement.

The read-only Driver Pi item establishes one protected-path guard shared by read and later extraction;
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

Materialize it from owner source with one frozen Deno single-file bundle. Generation admits one ESM
module, one default export, exactly `node:zlib` and `node:util` imports, one policy marker, and no
source-map directive. The prepared artifact stores only its text and SHA-256 digest. Do not add a
compiler-version pin, duplicate source/import metadata, deterministic double-build, custom AST
plugin, or separate host process proof.

The entrypoint adds no run, net, env, FFI, subprocess, or write permission and uses only resolved
user-data read roots. Built-in imports grant no permissions. It introduces no executable dependency
or startup preflight.

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

Historical Pi `0.84.4` source inspection found that the queue first serializes every caller through
one process-global, non-cancellable registration chain while deriving a key: an existing path uses
`realpath`, while an `ENOENT`/`ENOTDIR` path uses its lexical absolute form. Only after registration
does callback mutual
exclusion apply to that exact derived key. A blocked `realpath` therefore blocks registration for
unrelated destinations, and existence races can change key form. The queue does not coordinate
descendants or the Rooted metadata tree; it is cooperative coordination, not subtree confinement. Do
not claim that different-destination admission or any registration wait is independently bounded.

That 0.84.4 implementation's registration and same-key callback waits are not cancellation-aware.
Review these internal semantics in the dependency-selected host source; retain that as source
evidence, not a live stalled-I/O proof. Verify public loading, contention, cancellation, and actual
extraction through the real host. Do not instrument native `realpath` or add a private host simulator.
Queue contention or
key resolution is therefore a cooperative external wait that may delay tool settlement beyond the
120-second work budget. When the callback eventually starts, it must recheck cancellation and the
monotonic deadline before source allocation or filesystem mutation, throw without mutation if either
expired, and release its queue position. Do not claim bounded wall-clock settlement while another
caller holds the host queue indefinitely.

Import the queue through bare `@earendil-works/pi-coding-agent` only in the mutating entrypoint
module. Pi's extension loader must alias it to the running host module and shared singleton. Before
adding prompt text or launch args, reject an unresolved, local, overridden, or otherwise unproven
host specifier. Support only the canonical exact host specifier established by owner tests for the
prepared release. `deps.yaml` is the only authored version authority; reuse the launch selector and
its generated fallback, never a ZIP-specific supported-version literal.
[pi-dependency-metadata.plan.md](../@sys.driver-pi/pi-dependency-metadata.plan.md) owns metadata
refresh and freshness. Extraction independently requires compatibility proof against the newly
selected dependency. Historical host observations are evidence of past behavior, not a live version
allowlist. Metadata agreement alone does not establish host compatibility.

### Real-host acceptance boundary

Keep one explicit `test:host` task in `code/sys.driver/driver-pi/deno.json`, with its own
`test-host` permission preset and entry `-scripts/-test.external/-host.zip.ts`. Do not add it to
ordinary unit discovery or treat a successful metadata check as host evidence. This is acceptance
work within the extraction commit, not a new production abstraction or a separate framework commit.

The exploratory SDK-only `-scripts/-test.external/-host.queue.ts` has been removed. Its identity
coverage now runs inside the selected CLI through `-host.zip.ts`. The installed package's public SDK
and CLI can use different extension-loading branches; importing the same SDK twice outside the
launched CLI does not establish its binding. Bootstrap-only success is not the feature's release
criterion; the generated-entry and real-Agent acceptance results below supply the feature evidence.

Use the existing profile resolver for policy and materialization, then the public raw runner for
explicit host-test extension input. The raw runner uses CLI `m.run.ts` → `PiArgs.toArgs()`, the same
process boundary used by profile launches. Production profile passthrough deliberately rejects
`--extension`; preserve that refusal. A test extension belongs to the public raw runner's explicit
contract, not a new production profile field, a relaxed guard, or an environment-injected module.
Keep the resolved profile args intact and append only the declared test fixture at this raw boundary.
This proves profile-owned policy/materialization plus real host execution; it does not claim that
production profile passthrough accepts extra extensions.

Never reconstruct the package specifier, runtime-root layout, launch flags, extension policy, or
prepared ZIP bytes in a test. The fixture must consume the generated `mod.extract.ts`, not direct
`registerZipExtract` source or a text-patched substitute. Preserve the declared bare host import and
verify artifact admission independently from host loading.

At the existing `withInherit` boundary, use `Process.capture` to observe the actual no-shell child
process, preserving the owner's selected package, cwd, and argv. This dependency seam changes capture
and test-environment isolation only; it must still execute real Pi, not return a simulated launch.
Use the existing capture timeout, output bounds, and owned-child settlement result rather than adding
ZIP-specific process management, retry, transcript, or receipt infrastructure.

The fixture owns a private tree below the package's `.tmp/`, including HOME, agent configuration,
source ZIPs, destinations, and the launcher's Deno cache. Clear inherited child environment and pass
only the owner's fixture environment plus explicitly required platform variables. Do not read real
agent settings, credentials, sessions, or project extensions. Fixture HOME isolation is not a way to
avoid a denied system permission. Use explicit CLI extensions; never disable a trust gate to admit a
fixture. Missing dependency/cache preparation or trust authority is reported, not bypassed.

Account for the two execution authorities separately:

- Parent `test-host`: repository/input reads; writes only below package `.tmp/`; environment access
  for the existing launcher; permission to execute Deno. It needs no parent network, FFI, or system
  permission merely to launch and capture the child. The task uses frozen, cached-only, non-prompting
  test execution. Its direct executable allowlist names Deno; child authority is separate.
- Child Pi: the existing scoped launch contract, including `homedir`, `osRelease`, and `uid` system
  queries, its current network/process permissions, cache-scoped FFI, and owner-derived filesystem
  scopes. These are real host-startup capabilities, not extraction requirements. Parent
  `run: [deno]` does not confine the child to the parent's permissions. Review this complete transitive
  authority before execution; do not claim that the new test grants only a home-path query.
- Extraction itself: retain the independent exact-source-read/destination-write proof with run,
  network, and FFI denied. The real-host test cannot substitute for that lower-authority proof.

The parent task/preset requires human-provisioned execution authority. Declaring this contract does
not grant permission to widen a denied execution surface. Do not modify ordinary `test` permissions,
borrow `dev` or another feature's process preset, alter active profiles, or retry a denial with broader
flags. Any capability not covered by the reviewed contract requires separate resolution.

**Host verification decisions:**

- The selected CLI has passed shared loader binding, existing/missing exact-key exclusion,
  different-key progress, callback failure identity, registration rejection, and recovery.
- Canonical alias exclusion passes using the workspace installation's existing public
  `node_modules/@earendil-works/pi-coding-agent` symlink. The test verifies that it resolves to a
  distinct directory inside that installation. No current-version directory is embedded in the
  fixture. Only the alias and canonical target receive additional child read scope; neither is
  written or removed. No symlink provisioning or broader write permission is needed.
- The harness rejects unexpected child environment keys and non-fixture HOME/configuration/cache
  paths. It retains the private fixture if child settlement is unconfirmed. Native async disposal
  preserves a cleanup failure alongside an earlier test failure.
- A stalled-realpath experiment using public `node:fs/promises` replacement plus
  `syncBuiltinESMExports()` did **not** intercept the running host's binding. The behavioral probe
  failed with `Running host did not use the observed public I/O binding.` This is a test-seam
  limitation, not a permission refusal or evidence of a queue defect. That unsuccessful interceptor
  has been removed; do not treat it as global-registration proof or repeat it as a prerequisite.
- The human approved source review for upstream registration behavior in place of native
  blocked-realpath instrumentation. Keep real-host generated extraction, Agent sequencing/failure
  ABI, queued cancellation, and publication/cleanup acceptance. Direct caller tests cover delayed
  queue entry without pretending to model the host's internal filesystem. No new framework,
  prerequisite arc, or permission widening is part of this correction.

Acceptance is behavioral, not a startup banner or zero exit code:

1. Establish the selected CLI's public loading, existence-sensitive keying, and same-key callback
   exclusion using controlled paths and actual host APIs. Review global registration in selected
   source separately; do not claim native stalled-realpath behavior was runtime-proven. Coordinate
   behavioral tests with observable barriers, not sleeps or an unobserved pending promise.
2. In the completed feature, resolve opt-in policy through the actual profile owner, load the
   generated extraction entry through that host, and observe real `zip_extract` registration and
   execution. Exercise shared-key contention with the host mutation mechanism; a private queue or
   SDK-only substitute must not satisfy the assertions.
3. Drive the real Agent through public APIs with deterministic fixture provider output, not a live
   model request or a substitute Agent. Prove sequential sibling execution and the real event plus
   transcript failure ABI. No credential, external provider request, or private host import is
   required by the fixture contract.
4. Verify one complete publication, corrupt-input refusal before stage construction, and a queued
   cancellation that performs no later source allocation or mutation after eventual admission.
   Assert publication and cleanup truth separately; successful process exit is not extraction proof.
5. Fail on missing registration, mismatched events/results, missing fixture evidence, capture
   truncation, timeout, or incomplete child settlement. A host-startup-only success cannot mark this
   task or the extraction item complete. Retain the remaining owner fault-injection proofs below;
   do not duplicate Archive's format suite inside the host fixture.

### Verification evidence and failure-contract corrections

The integration results below are a historical checkpoint before the final Fs correction in
`8294315b9`. They do not establish acceptance of artifacts built from that later owner revision.

- Strict cooperative opt-in, canonical-host admission, destination guards, the separate generated
  extraction entry, materialization, prompt, README, and `dsl tools zip` share one policy contract.
  Omitted ZIP policy remains read-only. Explicit disablement loads no ZIP entry.
- Archive owns full preflight and verified extraction. Fs owns private construction, promotion, and
  cleanup. Pi retains and joins the actual sink promise before discarding or releasing the lease
  and host queue, including cancellation before Fs construction returns.
- Publication and cleanup are reported independently. Known publication survives late cancellation;
  uncertain committed promotion retains its private stage. Failed acquisition without a returned
  lease/stage handle reports cleanup as unconfirmed, not complete.
- Fs preserves the primary failure and exposes the first cleanup failure as `Failure.cleanupError`.
  Subsequent cleanup cannot clear reconciliation evidence. Failed rename reconciliation closes
  construction authority and retains private residue with `committed: true`; Pi reports uncertain
  publication rather than asserting non-publication. This is first-failure reporting, not an
  exhaustive cleanup transcript.
- Rooted fault tests exercise rename-after-effect plus failed destination/source observation,
  including a subsequent lock-release failure; a rejected rename without effect plus failed
  observation retains the private tree. Partial lock/lease acquisition and promotion's internal discard preserve both
  primary and cleanup causes. Rooted tests passed **23 suites / 159 steps**; Fs process tests passed
  **4 suites / 6 steps**.
- Pi direct tests inject those owner operations through Fs's IO seam, not replacement promotion
  results. Error rendering reserves the authenticated primary reason independently of path context.
  A 4,007-character admitted source argument retains `crc-mismatch` under the 16,000-character cap
  both directly and through generated extraction in the real Agent.
- Selected Pi `0.85.1` source review confirms global non-cancellable registration and exact-key
  callback exclusion. This is source evidence, not a native stalled-realpath runtime proof.
- At that integration checkpoint, `test:host` passed **3 suites / 3 steps**, covering baseline, installed
  alias, generated extraction, actual Agent sequencing/failure results, and queued cancellation.
- `test:zip:permissions` passed **1 suite / 1 step** with fixture-only source/destination reads,
  destination-only writes, and run/net/FFI/env/sys denied. This direct runtime lane uses a caller
  queue seam and does not substitute for host compatibility evidence.
- ZIP suites passed **4 suites / 35 steps**, including corrupt preflight, delayed admission,
  joined late construction, occupied publication, lost identity, failed discard/acquisition, and
  post-publication cleanup truth.
- Full Pi unit run after the failure-contract corrections: **69 suites / 459 steps passed;
  1 suite / 1 step failed**. The failure is the unrelated browser env-allowlist ordering assertion in
  `-scripts/-test/-task.start.gui.release.local.test.ts:90`. ZIP, profile, and help suites passed;
  existing browser configuration is preserved rather than changed to make this lane green.
- Fs and Pi `check` and publish dry-run passed. ZIP artifacts were regenerated after the owner and
  presentation corrections. The missing JSON comma introduced during formatting-residue cleanup
  was restored; JSON-import failures are distinct from the preserved browser env-order assertion.
  Workspace graph regeneration adds only the Archive → Driver Pi edge plus generated metadata;
  `check:graph` passed.
- Fs failure-contract corrections remain in Fs; Pi consumes their stable fields without walking
  arbitrary causes. No new framework, runtime permission widening, Archive-format duplication, or
  shell fallback is part of these corrections.

### Final Fs failure-evidence proof

The Fs correction in `8294315b9` preserves accumulated mutation evidence during partial tree cleanup,
compound failures through unsupported-result adapters, and the first descriptor/marker close failure.
The supplied fresh-session review identified three material findings; implementing-thread
reproductions and adjacent propagation checks closed them. Closure was not a new independent review
of the final bytes.

The correction proof recorded **11 failing settlement steps → all 26 steps passing**, Rooted
**23 tests / 178 steps**, and Fs process **4 tests / 6 steps**. Fs check and publish dry-run, scoped
lint/formatting, and whitespace checks passed. The final README pass separately corrected the
writer/sealing restriction and distinguished publication, permission evidence, mutation, and cleanup;
README formatting, whitespace, and Fs check passed after that documentation-only edit.

Changes to a bundled Fs owner require ZIP artifact regeneration and renewed source, selected-host,
and narrow-permission acceptance. Earlier generated-host results cannot attest to later owner bytes.
This is acceptance work within the existing Pi extraction item, not another arc item or approval gate.

### Pi failure-evidence acceptance

Pi retains the owner-selected primary failure when cancellation arrives during Fs settlement and
reports the later interruption separately. Discard, lease release, and promotion-result cleanup
retain both authenticated failure classifications, including equal classifications in different
roles. Presentation remains bounded and does not walk diagnostic causes.

Seven real-Fs IO regressions cover late cancellation and compound cleanup at those three boundaries
with distinct and equal classifications. The initial four reproductions failed while the preceding
19 extraction steps passed; after correction and the equal-classification additions, all **26
extraction steps** passed. Assertions distinguish publication, retained residue, primary/secondary
classification, and unlock/close settlement before queue release. They reject arbitrary cause text
and subsequent speculative removal. These are authored-Pi/real-Fs proofs, not native-fault injection
through the actual Agent.

`deno task --cwd code/sys.driver/driver-pi prep:zip --check` rebuilds both entries through the owning
configuration and existing graph/export/marker admission, then compares exact artifact JSON without
rewriting it. It rejected the stale extraction artifact before regeneration and passed afterward.
The accepted digests are:

- read: `sha256-fc906bbb2e3aa2206e6f1482c6b60a07237a8aa40cd3044c18700a5c27d9ac84`;
- extract: `sha256-87b4ce9498951accbc25523e9661d9d7a324c066dd94cdd642f8f388559d9cdc`.

Acceptance used Deno **2.9.6**, Darwin arm64, and dependency-selected Pi **0.85.1**, composing Fs
`8294315b9` with the corrected Pi source. Selected-host acceptance passed **3 tests / 3 steps**;
narrow-permission acceptance passed **1 test / 1 step**. Host execution covers prepared entry loading,
shared queue behavior, actual Agent sequencing/failure, and queued cancellation. The permission proof
uses authored runtime with an immediate queue; it proves permission scope, not host singleton identity.

Pi check, publish dry-run, workspace graph check, scoped lint/formatting, and whitespace checks passed.
The full Pi unit run recorded **69 passed / 466 steps**, with **1 failed / 1 step** at
`-scripts/-test/-task.start.gui.release.local.test.ts:90`: the unrelated browser environment-order
assertion. Its mixed `deno.json` ordering hunk remains outside ZIP scope; the full suite is not green.
Plans remain separate from implementation paths.

This checkpoint supplied implementing-thread closure evidence. The subsequent independent acceptance
below separately established the final scoped landing verdict; it did not repeat broad lower-owner
design review.

### Independent landing acceptance

The completed pass was reviewed by gpt-6-astra at high and returned **GO — no material target
findings** for the scoped extraction implementation against baseline `8294315b9`. Its verdict
excluded plans, the unrelated browser-ordering hunk, and Archive test restructuring. The
implementing thread accepted that disposition; no production correction followed from the pass.

The reviewer reported four independent native-I/O probes, all passing after actual work settled:

- owner-selected promotion failure survives later cancellation; when Archive cancellation selects
  first, separately observed Fs construction failure remains visible;
- distinct and identical cleanup classifications retain their roles, and later close failure cannot
  replace the first separately recorded cleanup failure;
- known publication is not rollback; rename-after-effect plus failed reconciliation preserves the
  complete destination and private residue without speculative removal; and
- actual open/write effects, delayed handle/promise return, descriptor close, stage discard, unlock,
  and close settle before queue release, including failed lease acquisition.

Diagnostics remained bounded and omitted injected `SECRET` cause text. The reviewer removed its
temporary probe file after all probes settled. These probes exercised authored Pi source and real
Fs IO; they were not fault injection through the generated Agent entry.

Complete serialized artifact correspondence passed independently before and after acceptance, with
both digests unchanged from those recorded above. Generated-host acceptance consumed those prepared
artifacts through normal policy injection. The selected host was independently corroborated as
`npm:@earendil-works/pi-coding-agent@0.85.1`; runtime was Deno **2.9.6**, Darwin arm64, V8
**15.0.245.2-rusty**, TypeScript **6.0.3**.

The independent commands passed Pi ZIP **7 suites / 61 steps**, all **4 probes**, host **3 tests**,
narrow permissions, Pi check, publish dry-run, workspace graph, and whitespace checks. The full Pi
unit run passed **72 suites / 485 steps**, with the same **1 failed suite / 1 step** at the browser
ordering assertion above. Publish dry-run reported three dynamic-import warnings in existing
sandbox/OCR test helpers. The scoped GO is not a whole-suite-green claim.

The earlier cache and execution-authority stops were resolved, not waived. Parent verification used
only PATH, HOME, and the existing prepared DENO_DIR in a credential-free environment:

```sh
env -i PATH="$PATH" HOME="$HOME" DENO_DIR=/Users/phil/code/org.sys/sys/.pi/@sys/tmp/deno deno task --cwd code/sys.driver/driver-pi prep:zip --check
```

The human separately authorized the unmodified host harness's existing child-startup authority,
including public dependency retrieval into its disposable fixture-local cache. Parent frozen and
cached-only constraints do not constrain that child. Child startup used `--no-lock` and is not
hermetic or lockfile-reproducible. Credential-free fixture HOME/config/cache, no remote model-provider
requests, and actual permission/trust stops were preserved. This historical authorization does not
grant another launcher broader permissions.

Native stalled-realpath behavior and other platforms remain unproven at runtime. Hostile
same-authority filesystem mutation remains outside the accepted contract. No further review-count
or architecture gate was created.

### Test-maintenance evidence

Archive's unchanged byte builder moved to `u.fixture.zip.ts`, behind a runner-independent `Fixture`
facade. Pi's test `common.ts` explicitly centralizes Archive/Fs fixture imports without routing
restricted-runtime fixtures through the test runner. Pi retains all **42 leaf cases**; **7 suites /
61 steps** includes **19 organizing groups**, not additional coverage. Real-Fs fault injection,
primary/secondary classifications, publication/residue assertions, and observable settlement barriers
remain. The independent reviewer inspected the reorganized extraction specs and helpers and found
those proofs meaningful; file movement did not invalidate production observations.

Separate implementing-thread post-maintenance proof passed Archive **13 suites / 100 steps**, Pi ZIP
**7 suites / 61 steps**, generated-host **3 tests / 3 steps**, narrow-permission **1 test / 1 step**,
Archive/Pi checks, 32-file scoped lint/formatting, exact artifact correspondence, Pi publish dry-run,
workspace graph, and whitespace checks. This supplies the Archive fixture-migration evidence without
extending the independent reviewer's stated approval scope.

### Extraction flow

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
   cooperative no-replace semantics;
9. discard only an unpublished owned stage on failure, preserving any ownership-loss residue and
   reporting cleanup separately; and
10. join actual Fs sink settlement before discard, lease release, and host queue release, even when
    Archive has already stopped; settle owned inflater, file, and cleanup work before returning.

A confirmed prepublication failure publishes no destination. `occupied` leaves the existing target
untouched. Known publication remains reported as published even when cleanup fails. An authenticated
committed promotion failure reports uncertain publication and retains the private stage. Neither
case claims rollback or removes the destination speculatively. Failed acquisition before a handle
returns reports cleanup as unconfirmed.

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
| `enabled: false`                | none                         | none                      |
| ZIP omitted or `enabled: true`  | `mod.read.ts`                | `zip_inspect`, `zip_test` |
| any `extract` key               | schema rejected              | none                      |

After the gated extraction item:

| Profile state                                                   | Generated/loaded entrypoints       | Prompt/runtime tools                     |
| --------------------------------------------------------------- | ---------------------------------- | ---------------------------------------- |
| `enabled: false`                                                | none                               | none                                     |
| ZIP omitted, or `enabled: true` with extract omitted             | `mod.read.ts`                      | `zip_inspect`, `zip_test`                |
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
- both operations admit exactly 256 total cancellation input/array nodes and 32 nested array levels,
  reject plus one before byte work, count `undefined` placeholders, bound array length before bulk
  descriptor/key collection, and reject direct or prototype-chain proxies without invoking traps;
- cancellation and finite timeout during parsing and payload processing stop at each declared
  64-KiB/1-MiB/record quantum; only the bounded source copy is unchunked, and every lifecycle
  listener is disposed before settlement;
- pinned-runtime probes assert the one-byte readable threshold, 64-KiB writable threshold, and
  64-KiB emitted-chunk cap; an instrumented duplex proves one-at-a-time writes, hard pause until
  `drain`, concurrent feeder/consumer progress without deadlock, no flowing-mode/application queue,
  at most one bounded pending output chunk under a fast feeder and slow consumer, and complete
  settlement for write, drain, readable, error, destroy, and cancellation races;
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

- the exact standalone `Snapshot` runtime keys, identity with the composed `Fs.Snapshot` surface,
  sole canonical `t.Snapshot` contract, frozen record surfaces, owner-branded trap-free failure
  guard, and one external consumer compiled without casts;
- the top-level mutable options record and cancellation-array containers are captured as exact own
  enumerable data before I/O; unknown/missing option keys, container accessors and proxies, NUL,
  non-absolute or out-of-root paths, and invalid numeric values reject without invoking container
  code, while getter-bearing structural lifecycle leaves retain canonical `UntilInput` behavior;
- raw and normalized root/path lengths pass at the fixed 32,768-code-unit ceiling and reject at plus
  one through an admission seam that performs no filesystem operation;
- `maxBytes` passes at zero and its largest admitted cap-plus-one-safe value, while timeout and the
  256-total-node/32-array-level `UntilInput` bounds pass exactly and reject at plus one, including
  `undefined` termini;
- pre-aborted, disposed, and synchronously emitting lifecycle inputs settle before any filesystem
  invocation, with lifecycle disposal on every result;
- each failure kind is produced by its declared semantic family, messages contain no hostile path or
  cause text, structural lookalikes fail authentication, and close failure becomes primary only when
  no earlier terminal cause exists;
- exact cap and cap-plus-one behavior without trusting metadata size, using one handle and read
  requests of at most 64 KiB with no path reopen; legal short reads fill retained slabs rather than
  retaining one allocation per read, and the final byte extent must equal the stable observed size;
- returned bytes have direct `Uint8Array.prototype`, offset zero, exact-length fixed ordinary
  backing, no shared or retained alias, exact `byteLength`, and direct `Zip.open` admission;
- root/intermediate/final symlink refusal, intermediate-directory and final-regular-file
  requirements, observed open/path mismatch, and during-read identity/size/time drift refusal;
- `device-inode` appears only with complete matching safe-integer final-file identity observations,
  while injected missing/unsafe identity fields produce `metadata-only` without weakening the
  required type/size/available-time comparisons or claiming ancestry stability;
- cancellation and monotonic finite-timeout checks surround every read/I/O segment, and the one
  handle closes exactly once and settles on success, rejection, cancellation, and timeout; and
- direct execution succeeds with only exact fixture-read permission while write, run, net, and FFI
  are denied.

Run `@sys/fs` check/unit/process proof and broader workspace checks affected by its public type
surface.

## Proof — Driver Pi read tools

Focused owner tests cover:

- strict read-only schema, default-on/new-profile behavior, malformed-policy refusal, and migration
  that preserves opt-outs while refusing alias-indirected mutation paths;
- configured readable/protected roots, exact argument capture, protected-name/symlink refusal,
  pre-aborted execution, and file/symlink grants excluded from ZIP roots without parent broadening;
- structural inspection versus CRC/payload testing, no payload exposure or extraction, bounded
  escaped text, exact omitted count, complete structured entries, and authenticated failures;
- one prepared text-plus-digest artifact with exact generated imports/exports and literal policy
  injection; and
- enabled/disabled/suppressed materialization, loader args, conservative selected-tool reporting,
  and prompt wording that separates materialized registration from live callability.

Do not test provider serializers, private Pi modules, fake models, or Agent-loop internals. Run the
affected tests, `prep:zip`, Driver Pi `deno task check`, and scoped formatting/lint/whitespace.

## Proof — cooperative ZIP extraction

Owner tests in `@sys/archive/zip` prove:

- extraction adds exactly the declared `Archive`, sink, result, operation, and failure-kind ABI with
  no path or ambient `Fs`;
- malformed sink inputs and pre-aborted/disposed/synchronous lifecycle inputs are rejected without
  getter/method/payload invocation, and corrupt archives fail complete preflight without invoking
  the sink;
- exact stored/deflated bytes, implicit directories, and UTF-8 paths pass through one deterministic
  snapshotted sink batch with the exact entry/path/depth/file/tree bounds and mapping declared by
  the API;
- every content source is frozen and inert before acquisition; each demand yields at most one fresh
  bounded chunk, a slow consumer causes no eager inflater input or growing output queue, and
  `done: true` appears only after second-pass integrity settles; zero-byte files still require one
  clean source completion;
- skipped, repeated, concurrent, partial, and out-of-order content acquisition or consumption
  rejects, while the write-pass DEFLATE completion, exact consumption, actual size, and CRC are
  reverified; a caught explicit protocol failure remains terminal;
- early iterator return followed by sink success reports `sink-protocol`, while automatic iterator
  cleanup caused by a rejecting sink preserves `sink-failure` and cleanup failure never masks the
  primary terminal reason;
- retained iterators after success, failure, early sink return, sink throw, timeout, explicit
  `return()`, or partial consumption are revoked; active `next()` and inflater work settles, and
  later calls expose no bytes;
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
- the mutating entrypoint resolves the bare queue import to the dependency-selected real host
  singleton; no test fixture or package-cache path embeds the current version;
- host integration proofs live outside ordinary unit discovery and require separately approved
  host-startup permissions, never new extraction runtime grants;
- source review of the selected host records global non-cancellable registration separately from
  real-host existence-sensitive keying and exact-key callback exclusion tests;
- same-key, different-key, existing/missing-key, cancelled-waiter, and registration-failure-recovery
  tests retain no source bytes before callback entry; direct delayed-entry tests and real-host queued
  cancellation prove an expired callback performs no mutation after release and the queue remains
  usable, without claiming native realpath interception;
- a real Agent batch containing extraction executes sibling tools sequentially;
- direct extraction works with exact source-read/destination-write permission while run, net, and
  FFI are denied;
- corrupt input creates neither stage nor destination;
- existing destination, missing parent, operation/protected roots, case/normalization/realpath
  aliases, symlink parents, and no-replace races are refused through the shared read-tool guard;
- successful extraction publishes one complete destination through Rooted;
- cross-owner integration proves the concrete Rooted writer plus ZIP content-source pair settles and
  revokes content authority under every injected timeout/failure;
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
- no generic cross-format archive API, compression package, adapter registry, or format negotiation;
- no profile-level limit tuning in Driver Pi v1; and
- no claim that CRC, integrity testing, staging, sealing, or extraction establishes provenance,
  authenticity, malware safety, content trust, or future filesystem state.
