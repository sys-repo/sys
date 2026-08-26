# Filesystem

`@sys/fs` is the Deno-native filesystem layer used across `@sys`. It builds on Deno's filesystem
APIs and runs under Deno's permission model. It is not a cross-runtime abstraction.

Use `Fs` and `Path` for ordinary file and path work. Use `Pkg.Dist` for complete-tree verification
and checksum-matched distribution reads. Use `Rooted` to publish complete targets without
replacement and coordinate directory use, sealing, and removal beneath one canonical root.

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
the expected complete tree. Because it belongs to the artifact it describes, it cannot by itself
identify which artifact the caller intended.

`Pkg.Dist.Local.verify()` checks the complete tree against the manifest found at its root. A
successful result includes the checksum of those exact manifest bytes. This establishes internal
consistency, not independent identity. Local verification can run with Deno read permission limited
to that root.

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
directory. Use it for assets, builds, application versions, and caches that are published once, used
by several processes, and removed later.

Every admitted target names a validated root-relative path, and every private stage and lock file
remains beneath that root. Binding an existing root observes and canonicalizes that exact directory
without requesting ambient ancestor reads. Set `{ create: false }` to require the selected root to
exist. Creating a missing root still validates its complete parent chain. `Rooted` does not replace
Deno permissions or restrict direct filesystem calls.

The API works with three scoped handles:

| Handle | Meaning                                                                    |
| ------ | -------------------------------------------------------------------------- |
| Target | A validated root-relative path accepted only by the creating instance.     |
| Stage  | Private content owned by the creating instance until promotion or discard. |
| Lease  | A shared or exclusive OS-backed lock for cooperating callers.              |

Protocol metadata lives under `.sys.rooted`; transient publication files use
`.sys.rooted-tmp-<token>`.

Its central promises are deliberately narrow:

- Successful publication makes one complete target visible; it never replaces an existing target.
- File publication has at most one winner. Directory publication has at most one winner among
  `Rooted` instances bound to the same root.
- Leases coordinate use, publication, sealing, and removal among cooperating `Rooted` callers.
- When identity or permission safety cannot be proved, Rooted refuses the operation rather than
  guessing or falling back to recursive mutation.

### Publish

`admit()` validates root-relative paths as one batch. If any path is invalid, the whole batch is
rejected. Each returned handle works only with the `Rooted` instance that created it.

`publishFile()` syncs bytes in a private same-directory `.sys.rooted-tmp-<token>` file, then makes
the target visible only if it is absent. It removes that temporary file only while its identity is
still owned. An existing target or a lost race rejects with an `FsRootedError` whose `kind` is
`occupied`.

`createStage()` opens a private `.sys.rooted/stages/<token>` directory with its own publisher at
`stage.files`. Write the directory contents there, then pass the stage to `promoteStage()`.
Promotion moves the complete stage into place with one rename. If the target exists, it returns
`occupied` and leaves that target untouched. `discardStage()` removes a stage that was not promoted
or retries cleanup after promotion.

The directory race guarantee covers only `Rooted` instances bound to the same canonical root.
Publication is atomic to readers, but a successful return does not guarantee that the new directory
entry survives sudden power loss.

If stage construction or cleanup can no longer prove that it owns a private container, the container
is left in place rather than risk deleting the wrong path. The capability exposes no API for reading
file contents, listing directories, or overwriting targets.

### Lease

A shared lease marks a directory as in use. An exclusive lease reserves it from cooperating callers
for publication, sealing, or removal. A returned result is all-or-nothing: `acquired` owns every
requested target, while `busy` owns none.

| Option                  | Contention behavior                                              |
| ----------------------- | ---------------------------------------------------------------- |
| `wait` omitted or false | Return `busy` immediately and release any partial acquisition.   |
| `wait: true`            | Wait for the complete batch, or stop on cancellation or failure. |

Targets are always acquired in stable lock-identity order, regardless of caller order. This prevents
two cooperating callers from deadlocking merely because they listed the same targets differently.
The `until` option can cancel acquisition. It never releases a lease that has already been returned.

`release()` waits for operations currently borrowing the lease, then attempts to unlock every
target. `await using` disposal follows the same path. If the process exits, the operating system
releases its locks.

Operations that need ownership normally acquire it themselves. When the same instance already holds
the target, pass the compatible lease as `{ lease }` to `inspectSeal()`, `sealTree()`, or
`promoteStage()`. Omitting it fails immediately with `invalid-lease` instead of waiting on the
caller's own lock. Inspection accepts a shared or exclusive lease. Sealing and promotion require an
exclusive lease.

Empty lock files persist in `.sys.rooted/locks`; their paths provide stable lock identity across
release and reacquisition. Private stage containers are transient under `.sys.rooted/stages` and are
removed after completed promotion or discard. Never delete or replace a lock file: a process could
keep locking the old file while another process locks its replacement, splitting one lock into two.
Lock files contain no process data.

### Seal

A sealed tree has all write bits clear on every ordinary file and directory in the owned tree. Files
remain readable by the owner, and directories retain owner traversal. This is a checked mode state,
not permanent immutability.

`inspectSeal()` reports `sealed`, `unsealed`, or `unsupported` without changing the tree.
`sealTree()` clears the required bits and rechecks the complete tree before returning `applied`.
`changed: false` means the tree already satisfied the seal.

Before changing an entry, Rooted opens it and rechecks its filesystem identity. Replacing the path
cannot redirect that permission change to a different file. If the host cannot provide the required
identity or mode evidence, the operation reports `unsupported`. A changed or unsafe tree fails with
a typed error. Rooted never fabricates applied evidence.

With `{ seal: true }`, `promoteStage()` performs the sensitive work before publication: it seals the
private tree, temporarily adds owner-write to the stage root, renames the tree into place, then
reseals and checks the published target. Seal evidence describes permissions only. It says nothing
about content bytes, provenance, or future state.

With an exclusive lease, `removeTree()` can restore only the permissions needed inside that target
and remove it. Sealing therefore resists ordinary writes; it is not a retention lock.

### Remove

`removeTree()` requires an exclusive lease for the exact admitted target handle. This prevents
cooperating cleanup from removing a directory that is still in use. Releasing the lease while
removal is running waits for that operation before unlocking. A missing target returns `absent`.

On POSIX hosts, Rooted refuses removal unless the parent's mode grants write and traversal in at
least one permission class. The operating system still applies the process identity and its other
rules. A sealed parent therefore fails with `permission-denied` without weakening or deleting the
target. The operation never broadens ancestor or sibling permissions.

If removal starts but does not finish, the error has `committed: true`. Filesystem state may have
changed; keep the still-active lease, inspect the cause, and retry. Success means the target was
absent when the operation finished. It does not promise that the deletion reached durable storage
before sudden power loss.

Seal, removal, and stage-cleanup operations first check that every entry is an ordinary file or
directory on the same filesystem. They refuse symbolic links, special files, and hard-linked files.
An entry that cannot be proved safe remains in place for retry. No operation falls back to an
unverified recursive delete.

### Outcomes and failures

Expected conditions settle explicitly:

| Condition                                     | Settlement                                   |
| --------------------------------------------- | -------------------------------------------- |
| A non-waiting lease is contended              | `acquireLease()` returns `busy`              |
| A directory target already exists             | `promoteStage()` returns `occupied`          |
| A removal target is already absent            | `removeTree()` returns `absent`              |
| The host cannot prove identity or mode safety | Seal operations may return `unsupported`     |
| A file target already exists                  | `publishFile()` rejects with kind `occupied` |

Other rejected operations use `FsRootedError`. Call `Fs.Capability.Rooted.Is.failure(error)` to
identify one. Its `operation` and `kind` fields say where and why it failed. `committed: true` means
filesystem state may have changed and must be checked before retry.

Once publication or occupation is known, `promoteStage()` preserves that outcome in `kind`. A later
cleanup, cancellation, or post-publication seal problem appears in `cleanupError` instead of
rewriting what happened.

### Example

```ts
import { Fs } from '@sys/fs';

const rooted = await Fs.Capability.Rooted.create({ root: './store' });
const admission = await rooted.admit([{ kind: 'directory', path: 'generations/v1' }]);
const target = admission.targets[0];

const stage = await rooted.createStage();
const files = await stage.files.admit([{ kind: 'file', path: 'index.html' }]);
await stage.files.publishFile(files.targets[0], new TextEncoder().encode('<h1>Hello</h1>'));

const ownership = await rooted.acquireLease([target], {
  mode: 'exclusive',
  wait: true,
});
if (ownership.kind === 'busy') {
  await rooted.discardStage(stage);
  throw new Error(`Directory is busy: ${ownership.target.path}`);
}

await using lease = ownership.lease;
const publication = await rooted.promoteStage(stage, target, { seal: true, lease });
if (publication.cleanupError) {
  await rooted.discardStage(stage);
  throw publication.cleanupError;
}
if (publication.kind === 'occupied') throw new Error(`Target exists: ${target.path}`);

// Keep the lease while inspecting or otherwise settling the published target.
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
