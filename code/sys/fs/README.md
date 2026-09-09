# Filesystem

`@sys/fs` is the Deno-native filesystem layer for `@sys`. It uses Deno's filesystem APIs and
permission model; it does not abstract other runtimes.

Choose the narrowest surface that owns the guarantee you need. Use `Fs` and `Path` for ordinary file
and path work, `Fs.Snapshot` for bounded single-file reads with explicit stability evidence,
`Pkg.Dist` for distribution verification and checksum-matched reads, and `Rooted` for coordinated
publication, use, sealing, and removal beneath one canonical root.

## Primary imports

| Import               | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `@sys/fs`            | `Fs`, `Path`, and common helpers           |
| `@sys/fs/capability` | `FsCapability`, including its `Rooted` API |
| `@sys/fs/env`        | `Env` and `.env` loading                   |
| `@sys/fs/file`       | `JsonFile` for JSON and JSONC              |
| `@sys/fs/filemap`    | `FileMap` for declarative file trees       |
| `@sys/fs/pkg`        | `Pkg.Dist` package metadata and integrity  |
| `@sys/fs/snapshot`   | Standalone `Snapshot` file-read module     |
| `@sys/fs/watch`      | `Watch` for directory changes              |
| `@sys/fs/t`          | Public types                               |

## Stable file snapshots

A file snapshot pairs bounded, caller-owned bytes with evidence of the source's observed stability.
Use it when an ordinary read provides insufficient evidence about concurrent replacement or
mutation. It gives integrity checks a precise input; it does not establish containment or
provenance.

`Fs.Snapshot.file()` reads one absolute file selected strictly beneath an absolute root. Supply
finite `maxBytes` and `timeout` limits, and optionally `until` for cancellation. Symbolic links in
the observed root-to-file chain are rejected. The same API is available as `Snapshot` from
`@sys/fs/snapshot`.

### Reading the result

A successful snapshot is a frozen record. Read it as evidence about one completed operation, not as
authority over the path.

| Field        | Meaning                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| `path`       | Normalized absolute path that was read                                     |
| `byteLength` | Exact length of the returned bytes                                         |
| `bytes`      | Mutable `Uint8Array` with fresh, exact backing storage owned by the caller |
| `evidence`   | Strength of final-file identity evidence available from the host           |

Both evidence grades require stable size and available modification/change timestamps.
`device-inode` additionally records consistent device and inode identity across the final-file
observations. `metadata-only` means complete identity evidence was unavailable, not that checking
was skipped. The caller decides whether that evidence is sufficient.

### What it does not prove

A snapshot observes change; it does not prevent it. Another actor can replace an ancestor path
during the read or change file contents without changing the metadata the host reveals. Success
therefore establishes neither containment, authenticated origin, nor stability after return. Use an
external sandbox or excluded mutation for stronger location stability, and independent verification
for intended content or origin.

### Limits and failures

`maxBytes` is an acceptance limit: an oversized file rejects rather than returning a prefix.
`timeout` and `until` request termination; neither can interrupt pending native I/O. Changing
options or cancellation arrays after invocation does not reconfigure the read; admitted lifecycle
sources remain live.

Rejected operations throw frozen `FsSnapshotError` values. Test them with
`Fs.Snapshot.Is.failure(error)` and inspect their stable `kind`. Messages contain neither paths nor
host-cause text, and failures do not expose raw host error objects.

## Distribution integrity

A distribution consists of one `dist.json` manifest and the files it names. The manifest describes
the expected complete tree, but it travels with that tree. By itself, it can establish internal
consistency—not that the caller selected the intended artifact.

`Pkg.Dist.Local.verify()` checks the complete tree against the manifest at its root. A successful
result includes the checksum of those exact manifest bytes. Local verification can run with Deno
read permission limited to that root.

`Pkg.Dist.Pinned.verify()` additionally requires a caller-supplied expected manifest checksum. When
obtained independently, that value binds successful verification to the distribution selected by the
caller.

`Pkg.Dist.Local.readPart()` and `Pkg.Dist.Pinned.readPart()` are narrower. Given a root-relative
path, exact byte length, and checksum, each returns one file only when all three match. Neither
verifies the complete distribution. These reads verify returned bytes against caller-supplied
values. They provide no stable-location guarantee while another process can replace paths. Use them
only where mutation is excluded or a separate sandbox provides containment.

Each call captures its root at invocation; relative roots resolve against the process CWD. A
long-lived service should resolve one absolute root at startup and reuse it.

## Rooted

`Rooted` separates private construction from public visibility and coordinates the use of published
targets. It suits assets, builds, application versions, and caches shared by cooperating processes.
Publication, leases, and sealing serve different purposes: visibility, coordination, and
permissions.

Create an instance with `Fs.Capability.Rooted.create()`, or `FsCapability.Rooted.create()` from
`@sys/fs/capability`. Each instance binds to one canonical directory and accepts validated
root-relative targets. Set `{ create: false }` when the root must already exist. Binding an existing
root requires no ancestor read permission; creating a missing root requires an existing parent and
permission to validate its ancestry. Rooted does not replace Deno permissions or restrict direct
filesystem calls.

The API groups operations by what they act on:

| Family   | Operations                                     |
| -------- | ---------------------------------------------- |
| `Target` | `admit`                                        |
| `Lease`  | `acquire`                                      |
| `Tree`   | `inspectSeal`, `seal`, `remove`, `removeBatch` |
| `File`   | `publish`                                      |
| `Stage`  | `create`, `discard`, `promote`                 |

The instance and its operation families are frozen. Methods retain their instance binding when
passed or destructured.

Three handles carry scoped authority:

| Handle   | Meaning                                                                   |
| -------- | ------------------------------------------------------------------------- |
| `Target` | A validated root-relative path accepted only by the creating instance.    |
| `Stage`  | Private construction and cleanup authority held by the creating instance. |
| `Lease`  | A shared or exclusive OS-backed lock for cooperating callers.             |

Rooted reserves `.sys.rooted` for protocol metadata and `.sys.rooted-tmp-<token>` for private file
publication. These are not application targets.

### Publish

Publication makes constructed content visible as a complete file or tree, not a partially built
destination. File publication never replaces an existing target and has at most one winner in a
race. Directory publication offers that guarantee only among cooperating Rooted instances bound to
the same canonical root; it is not a filesystem-enforced no-replace guarantee. Atomic visibility
also does not imply durability after sudden power loss.

`Target.admit()` validates root-relative paths as a batch: either every path is accepted or the call
rejects. `File.publish()` publishes one file; an existing target or a lost race rejects with kind
`occupied`.

`Stage.create()` provides private content under the root. Choose one construction model:

- `stage.files` is a Rooted instance for publishing files and nested stages within that content.
- `stage.writer.writeTree()` provides bounded streaming construction of a pristine stage. It claims
  the stage once, disabling `stage.files` operations and the creating instance's
  `Tree.inspectSeal(stage)` and `Tree.seal(stage)`. After successful construction, request sealing
  through `Stage.promote()` with `{ seal: true }`. A failure after claim prevents promotion.

Await construction before promotion; do not mix construction models. Rooted provides no API to read
file contents, list directories, or overwrite targets.

`Stage.promote()` publishes the constructed tree. An existing directory yields `occupied`: the
existing target is untouched, and private cleanup of the losing stage is attempted.
`Stage.discard()` removes an unpromoted stage or retries private cleanup after promotion. Discard is
not rollback: it never removes the published destination. Private artifacts may remain when safe
cleanup cannot be proved.

### Lease

A lease coordinates use of exact directory targets, not entire subtrees. A shared lease marks those
targets as in use; an exclusive lease reserves them from cooperating callers for publication,
sealing, or removal. An `acquired` result covers every requested target; `busy` owns none.

| Option                  | Contention behavior                                              |
| ----------------------- | ---------------------------------------------------------------- |
| `wait` omitted or false | Return `busy` without a lease.                                   |
| `wait: true`            | Wait for the complete batch, or stop on cancellation or failure. |

Supply targets in the order your application needs; batch acquisition does not depend on that order.
The `until` option cancels acquisition, not the lifetime of a returned lease.

`lease.release()` is idempotent and waits for operations already using the lease. `await using` has
the same semantics. The operating system releases native locks when their owning process exits.

`Tree.inspectSeal()`, `Tree.seal()`, and `Stage.promote()` normally acquire ownership as needed.
When this instance already holds a lease over the directory target, pass that compatible lease as
`{ lease }`. Omitting it fails immediately with `invalid-lease`. Inspection accepts a shared or
exclusive lease; sealing and promotion require an exclusive lease.

Lock files in `.sys.rooted/locks` are persistent coordination metadata, not stale process records.
Never delete or replace them: cooperating callers must share the same lock identity.

### Seal

Sealing is a verified permission state, not permanent immutability. Every ordinary file and
directory in a sealed tree has all write bits clear and remains owner-readable; directories also
retain owner traversal. Seal evidence describes permissions, not content integrity, provenance, or
future state.

`Tree.inspectSeal()` reports `sealed`, `unsealed`, or `unsupported` without changing the tree.
`Tree.seal()` returns `applied` only for a verified complete seal. `changed: false` means the tree
already satisfied it. Required identity or mode evidence may be unavailable on an unsupported host;
an unsafe or observably changing tree fails verification.

Use `{ seal: true }` with `Stage.promote()` to request a sealed publication. Check the returned
`seal` when permission evidence is required, even if the stage was sealed in advance: publication
and verified sealing are separate facts.

Sealing is not a retention lock. Removal under an exclusive lease may restore the permissions needed
inside the target.

### Remove

`Tree.remove()` requires an exclusive lease for the exact admitted target handle, so cooperating
cleanup cannot remove a directory held under a shared lease. Success reports `removed` or `absent`;
it does not prevent later recreation or guarantee durability after sudden power loss.

Removal authority does not extend to ancestor or sibling permissions. In particular, a sealed parent
prevents removal on POSIX hosts and yields `permission-denied`; Rooted does not weaken the parent to
make removal succeed.

`Tree.removeBatch()` accepts directory paths and owns the required lease. It provides ordered
removal, not an all-or-nothing transaction: failure does not undo completed removals.

- `busy`: no target was removed; identifies the contended target by caller index.
- `settled`: ordered `removed` or `absent` results for every target.
- `failed`: the completed prefix, current target when known, and unattempted suffix, plus whether
  mutation may have occurred.

Input-capture errors reject; subsequent operational failures return `failed`. Both `settled` and
`failed` may carry an independent `releaseError`. Neither implies that lease release succeeded.
Later edits to the supplied path or cancellation arrays do not change the operation; lifecycle
sources remain live. An empty batch is a no-op.

For a failed single-target removal, retain the required lease and reconcile partial changes before
retrying. For a failed batch, use its progress report to distinguish completed work from work that
still needs reconciliation or retry.

Sealing, removal, and stage cleanup accept only ordinary files and directories on one filesystem.
They refuse symbolic links, special files, and multiply linked files. Unproved ownership or safety
is a reason to retain an entry, not permission for an unchecked recursive delete.

### Outcomes and failures

A known outcome and a subsequent failure can both be true. A returned `Stage.promote()` result
records `published` or `occupied`. Its `cleanupError` reports an additional publication-boundary,
cleanup, cancellation, or verification problem; it does not revise that outcome.

Rejected Rooted operations use `FsRootedError`. Identify one with
`Fs.Capability.Rooted.Is.failure(error)`, then read its fields as separate facts:

- **Primary failure:** `operation` and `kind` classify it; `cause` is diagnostic context.
- **Possible change:** `committed: true` requires reconciliation before retry.
- **Cleanup failure:** `cleanupError` preserves the first separately recorded cleanup failure.

`committed` is not a publication result. It can describe private permission changes or an unresolved
publication attempt. When publication cannot be determined, Rooted revokes construction authority
and retains private residue; do not infer success or non-publication from that rejection.

Preserve primary and cleanup failures together. Cleanup evidence is not an exhaustive record of
cleanup attempts: `committed: false`, absence of `cleanupError`, or absence of a returned stage or
lease handle does not prove that every resource was released or every private artifact removed.

An `unsupported` result differs from an `unsupported` failure. Sealing and inspection reject when
mutation or cleanup evidence needs to accompany that classification.

### Reading a promotion result

Assume `stage` has finished construction and `lease` is an active exclusive lease for `target`, all
from the same `rooted` instance. Report publication separately from any additional failure:

```ts
const publication = await rooted.Stage.promote(stage, target, { seal: true, lease });
console.info('Publication:', publication.kind);
if (publication.cleanupError) {
  console.warn('Additional failure:', publication.cleanupError.kind);
}
```

This example reads a returned result; it is not a complete rejection or recovery workflow.

### Security boundary

`Rooted` provides coordination and mutation safety, not containment. Its leases coordinate only
callers that use the same Rooted protocol. Code with direct filesystem authority can ignore those
locks, change mode bits, replace names, or remove targets. Sealing does not revoke open handles or
protect against a hostile process running as the same user. Run untrusted code behind a separate OS
sandbox or account boundary.

## Environment

### Load

`Env.load()` reads `.env` files first. The live process environment supplies any missing keys.

- `search: 'cwd'` reads only the target directory's `.env` file.
- `search: 'upward'` reads each ancestor `.env` from the filesystem root to the target directory;
  nearer files override farther files.

`get()` returns an empty string for a missing key. Use `has()` when missing and empty values must be
distinguished.

```ts
import { Env } from '@sys/fs/env';

const env = await Env.load({ search: 'upward' });
const apiKey = env.get('API_KEY');
```

### Initialize

`Env.init()` detects VS Code from the process environment. When `.vscode/settings.json` is absent,
it writes default Deno settings; existing settings remain untouched.

```ts
// main.ts
import { Env } from 'jsr:@sys/fs';

await Env.init();
```

Run the script with environment, read, and write permissions:

```sh
deno run -ERW main.ts
```

## JSON files

`JsonFile` represents a `.json` or `.jsonc` file as an `ImmutableRef<T>`. `get()` reads without
writing; a missing file stays absent unless `{ touch: true }` is passed or `fs.save()` is called.

Editing and saving are separate. Changes remain in memory until `fs.save()`, and `fs.pending`
reports unsaved changes. A successful save records `.meta.modifiedAt`; `.meta.createdAt` remains
stable. JSONC input may contain comments and trailing commas.

```ts
import type { t } from '@sys/fs';
import { JsonFile } from '@sys/fs/file';

type Doc = t.JsonFile.Doc & { count: number };
const initial = JsonFile.default<Doc>({ count: 123 });
const file = await JsonFile.get('./config.json', initial);

console.info(file.current.count);
file.change((draft) => {
  draft.count += 1;
});

const { error } = await file.fs.save();
if (error) throw error;
```
