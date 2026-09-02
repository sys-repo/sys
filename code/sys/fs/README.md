# Filesystem

`@sys/fs` is the Deno-native filesystem layer for `@sys`. It uses Deno's filesystem APIs and
permission model; it does not abstract other runtimes.

Choose the narrowest surface that owns the guarantee you need. Use `Fs` and `Path` for ordinary file
and path work, `Pkg.Dist` for distribution verification and checksum-matched reads, and `Rooted` to
publish complete targets without replacement while coordinating their use, sealing, and removal
beneath one canonical root.

## Primary imports

| Import               | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `@sys/fs`            | `Fs`, `Path`, and common helpers           |
| `@sys/fs/capability` | `FsCapability`, including its `Rooted` API |
| `@sys/fs/env`        | `Env` and `.env` loading                   |
| `@sys/fs/file`       | `JsonFile` for JSON and JSONC              |
| `@sys/fs/filemap`    | `FileMap` for declarative file trees       |
| `@sys/fs/pkg`        | `Pkg.Dist` package metadata and integrity  |
| `@sys/fs/watch`      | `Watch` for directory changes              |
| `@sys/fs/t`          | Public types                               |

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

A `Rooted` instance binds publication, sealing, lease coordination, and removal to one canonical
directory. It suits assets, builds, application versions, and caches that are published once, shared
by several processes, and removed later.

Every admitted target is a validated root-relative path. Every private stage and lock file remains
beneath the root. Binding an existing root observes and canonicalizes that exact directory without
requesting ambient ancestor reads. Set `{ create: false }` to require the root to exist. Creating a
missing root still validates its complete parent chain. `Rooted` neither replaces Deno permissions
nor restricts direct filesystem calls.

Operations are grouped by capability noun:

| Family   | Operations                                     |
| -------- | ---------------------------------------------- |
| `Target` | `admit`                                        |
| `Lease`  | `acquire`                                      |
| `Tree`   | `inspectSeal`, `seal`, `remove`, `removeBatch` |
| `File`   | `publish`                                      |
| `Stage`  | `create`, `discard`, `promote`                 |

The instance and every family object are frozen. Methods close over the creating instance rather
than `this`, so they remain valid when passed or destructured.

Three handles carry scoped authority:

| Handle   | Meaning                                                                    |
| -------- | -------------------------------------------------------------------------- |
| `Target` | A validated root-relative path accepted only by the creating instance.     |
| `Stage`  | Private content owned by the creating instance until promotion or discard. |
| `Lease`  | A shared or exclusive OS-backed lock for cooperating callers.              |

Protocol metadata lives under `.sys.rooted`; transient publication files use
`.sys.rooted-tmp-<token>`.

`Rooted` makes four deliberately narrow promises:

- Successful publication makes one complete target visible; it never replaces an existing target.
- File publication has at most one winner. Directory publication has at most one winner among
  `Rooted` instances bound to the same root.
- Leases coordinate use, publication, sealing, and removal among cooperating `Rooted` callers.
- When identity or permission safety cannot be proved, Rooted refuses the operation rather than
  guessing or falling back to recursive mutation.

### Publish

`Target.admit()` validates root-relative paths as one batch. If any path is invalid, the whole batch
is rejected. Each returned handle belongs to the `Rooted` instance that created it.

`File.publish()` writes and syncs bytes in a private same-directory `.sys.rooted-tmp-<token>` file,
then makes the target visible only if it is absent. It removes the temporary file only while that
file's identity remains owned. An existing target or a lost race rejects with an `FsRootedError`
whose `kind` is `occupied`.

`Stage.create()` opens a private `.sys.rooted/stages/<token>` directory. Populate it through the
complete `Rooted` instance at `stage.files`, then pass the stage to `Stage.promote()`. Promotion
publishes the complete stage with one rename. If the target exists, it returns `occupied`, leaves
the target untouched, and attempts to clean the losing stage. `Stage.discard()` removes an
unpromoted stage or retries cleanup after a promotion attempt.

The directory race guarantee covers only `Rooted` instances bound to the same canonical root.
Publication is atomic to readers, but success does not guarantee that a new directory entry survives
sudden power loss.

If stage construction or cleanup can no longer prove ownership of a private container, Rooted leaves
it in place rather than risk deleting the wrong path. The capability intentionally provides no API
to read file contents, list directories, or overwrite targets.

### Lease

`Lease.acquire()` requests shared or exclusive ownership of one or more directory targets. A shared
lease marks them as in use; an exclusive lease reserves them from cooperating callers for
publication, sealing, or removal. Acquisition is all-or-nothing: `acquired` owns every requested
target, while `busy` owns none.

| Option                  | Contention behavior                                              |
| ----------------------- | ---------------------------------------------------------------- |
| `wait` omitted or false | Return `busy` immediately and release any partial acquisition.   |
| `wait: true`            | Wait for the complete batch, or stop on cancellation or failure. |

Targets are always acquired in stable lock-identity order, regardless of caller order. Two
cooperating callers therefore cannot deadlock merely because they list the same targets differently.
The `until` option can cancel acquisition; it never releases a lease already returned.

`lease.release()` waits for operations currently borrowing the lease, then attempts to unlock every
target. `await using` follows the same release path. If the process exits, the operating system
releases its locks.

Operations that need ownership normally acquire it themselves. When the same instance already holds
a lease over the target, pass that compatible lease as `{ lease }` to `Tree.inspectSeal()`,
`Tree.seal()`, or `Stage.promote()`. Omitting it fails immediately with `invalid-lease` instead of
waiting on the caller's own lock. Inspection accepts a shared or exclusive lease. Sealing and
promotion require an exclusive lease.

Empty lock files persist in `.sys.rooted/locks`; their paths provide stable lock identity across
release and reacquisition. Private stage containers are transient under `.sys.rooted/stages` and are
removed after completed promotion or discard. Never delete or replace a lock file: a process could
keep locking the old file while another process locks its replacement, splitting one lock into two.
Lock files contain no process data.

### Seal

A sealed tree has all write bits clear on every ordinary file and directory in the owned tree. Files
remain readable by the owner, and directories retain owner traversal. This is a checked mode state,
not permanent immutability.

`Tree.inspectSeal()` reports `sealed`, `unsealed`, or `unsupported` without changing the tree.
`Tree.seal()` clears the required bits and rechecks the complete tree before returning `applied`.
`changed: false` means the tree already satisfied the seal.

Before changing an entry, Rooted opens it and rechecks its filesystem identity. Replacing the path
therefore cannot redirect that permission change to another file. If the host cannot provide the
required identity or mode evidence, the operation reports `unsupported`. If the tree changes during
verification or contains an unsafe entry, the operation fails with a typed error. Rooted never
fabricates applied evidence.

With `{ seal: true }`, `Stage.promote()` performs the sensitive work before publication: it seals
the private tree, temporarily adds owner-write to the stage root, renames the tree into place, then
reseals and checks the published target. Seal evidence describes permissions only. It says nothing
about content bytes, provenance, or future state.

With an exclusive lease, `Tree.remove()` can restore only the permissions needed inside that target
and remove it. Sealing therefore resists ordinary writes; it is not a retention lock.

### Remove

`Tree.remove()` requires an exclusive lease for the exact admitted target handle. This prevents
cooperating cleanup from removing a directory that is still in use. Releasing the lease while
removal is running waits for that operation before unlocking. A missing target returns `absent`.

`Tree.removeBatch()` accepts directory paths directly. Before I/O, it snapshots the complete path
array and any nested lifecycle arrays. One cancellation latch then spans admission, acquisition,
every removal, and mandatory release. Later caller mutation cannot alter the captured paths or
lifecycle structure; an empty batch creates neither Rooted metadata nor a lifecycle subscription.

The method admits the complete batch, acquires one non-waiting exclusive lease in stable lock order,
removes targets in caller order, and then attempts to release every acquired lock. Contention
returns `busy` before removal and maps the contended lock back to its caller index. A `settled`
result carries ordered `removed` or `absent` results. After input capture succeeds, an operational
failure returns `failed`, which reports the completed prefix, the current target when known, the
unattempted suffix, and whether mutation may have occurred. Both settlements preserve any
independent release failure instead of rewriting removal truth. The method never probes afterward to
manufacture certainty about unfinished targets.

On POSIX hosts, Rooted refuses removal unless the parent's mode grants write and traversal in at
least one permission class. The operating system still applies the process identity and its other
rules. A sealed parent therefore fails with `permission-denied` without weakening or deleting the
target. The operation never broadens ancestor or sibling permissions.

If removal may have changed the target before failing, the error has `committed: true`. Keep the
still-active lease, inspect the cause, and retry. Success means the target was absent when the
operation finished. It does not promise that the deletion reached durable storage before sudden
power loss.

Seal, removal, and stage-cleanup operations first check that every entry is an ordinary file or
directory on the same filesystem. They refuse symbolic links, special files, and hard-linked files.
An entry that cannot be proved safe remains in place for retry. No operation falls back to an
unverified recursive delete.

### Outcomes and failures

Expected conditions settle explicitly:

| Condition                                     | Settlement                                    |
| --------------------------------------------- | --------------------------------------------- |
| A non-waiting lease is contended              | `Lease.acquire()` returns `busy`              |
| Batch removal finds a contended target        | `Tree.removeBatch()` returns `busy`           |
| A directory target already exists             | `Stage.promote()` returns `occupied`          |
| A removal target is already absent            | `Tree.remove()` returns `absent`              |
| The host cannot prove identity or mode safety | Tree seal operations may return `unsupported` |
| A file target already exists                  | `File.publish()` rejects with kind `occupied` |

Other rejected operations use `FsRootedError`. Call `Fs.Capability.Rooted.Is.failure(error)` to
identify one. Its `operation` and `kind` fields say where and why it failed. `committed: true` means
filesystem state may have changed and must be checked before retry.

Once `Stage.promote()` knows whether publication succeeded or the target was occupied, `kind` does
not change. A later cleanup, cancellation, or post-publication seal problem appears in
`cleanupError` instead of rewriting the known outcome.

### Example

```ts
import { Fs } from '@sys/fs';

const rooted = await Fs.Capability.Rooted.create({ root: './store' });
const admission = await rooted.Target.admit([{ kind: 'directory', path: 'generations/v1' }]);
const target = admission.targets[0];

const stage = await rooted.Stage.create();
const files = await stage.files.Target.admit([{ kind: 'file', path: 'index.html' }]);
await stage.files.File.publish(files.targets[0], new TextEncoder().encode('<h1>Hello</h1>'));

const ownership = await rooted.Lease.acquire([target], {
  mode: 'exclusive',
});
if (ownership.kind === 'busy') {
  await rooted.Stage.discard(stage);
  throw new Error(`Directory is busy: ${ownership.target.path}`);
}

await using lease = ownership.lease;
const publication = await rooted.Stage.promote(stage, target, { seal: true, lease });
if (publication.cleanupError) {
  await rooted.Stage.discard(stage);
  throw publication.cleanupError;
}
if (publication.kind === 'occupied') throw new Error(`Target exists: ${target.path}`);
```

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
import type * as t from '@sys/fs/t';
import { JsonFile } from '@sys/fs/file';

type Doc = t.JsonFile.Doc & { msg?: string; count: number };
const initial = JsonFile.default<Doc>({ count: 123 });
const file = await JsonFile.get('./config.json', initial);

console.info(file.current.count); // → 123
file.change((draft) => {
  draft.count += 1;
});

const { error } = await file.fs.save();
if (error) throw error;
```
