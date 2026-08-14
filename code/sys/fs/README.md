# Filesystem

`@sys/fs` is the Deno-native filesystem layer used across `@sys`. It builds on Deno's filesystem
APIs and runs under Deno's permission model. It is not a cross-runtime abstraction.

Use `Fs` and `Path` for ordinary file and path work. Use `Rooted` when cooperating processes must
publish complete data or coordinate its use and removal.

## Primary imports

| Import               | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `@sys/fs`            | `Fs`, `Path`, and common helpers           |
| `@sys/fs/capability` | `FsCapability`, including its `Rooted` API |
| `@sys/fs/env`        | `Env` and `.env` loading                   |
| `@sys/fs/file`       | `JsonFile` for JSON and JSONC              |
| `@sys/fs/filemap`    | `FileMap` for declarative file trees       |
| `@sys/fs/watch`      | `Watch` for directory changes              |
| `@sys/fs/t`          | Public types                               |

## Rooted

A `Rooted` instance is a filesystem capability bound to one canonical directory. It publishes files
and directories, holds leases, seals owned trees, and removes leased targets. Its admitted targets,
private stages, and lock files all stay beneath that root.

Use `Rooted` for assets, builds, application versions, and caches that are written once and removed
later.

- Publication exposes only complete targets and leaves existing targets untouched.
- File races have at most one winner. Directory races have the same guarantee only among `Rooted`
  instances on the same root.
- A shared lease keeps cooperating cleanup from removing a directory in use.

### Publish

`admit()` validates root-relative paths as one batch. If any path is invalid, the whole batch is
rejected. Each returned handle works only with the `Rooted` instance that created it.

`publishFile()` syncs the bytes, then makes the target visible only if it is absent. An existing
target or a lost race rejects with an `FsRootedError` whose `kind` is `occupied`.

`createStage()` opens a private directory with its own publisher at `stage.files`. Write the
directory contents there, then pass the stage to `promoteStage()`. Promotion moves the complete
stage into place with one rename. If the target exists, it returns `occupied` and leaves that target
untouched. `discardStage()` removes a stage that was not promoted or retries cleanup after
promotion.

The directory race guarantee covers only `Rooted` instances bound to the same canonical root.
Publication is atomic to readers, but a successful return does not guarantee that the new directory
entry survives sudden power loss.

If stage construction or cleanup can no longer prove that it owns a private container, the container
is left in place rather than risk deleting the wrong path. The capability exposes no API for reading
file contents, listing directories, or overwriting targets.

### Lock

A shared lease marks a directory as in use. An exclusive lease reserves it for work such as cleanup.
If a requested lease conflicts with one already held, `acquireLease()` returns `busy` and holds no
locks.

`acquireLease()` takes each batch in a fixed order, regardless of caller order. If the whole batch
cannot be acquired, it releases every lock already taken. The `until` option can cancel acquisition;
it never releases a lease already returned.

`release()` waits for operations already using the lease before it unlocks. `await using` disposal
follows the same path. The operating system releases the locks if the process exits.

Operations that need a target lock normally acquire it themselves. If this instance already holds
the lock, pass the compatible lease as `{ lease }` to `inspectSeal()`, `sealTree()`, or
`promoteStage()`. Omitting it fails immediately with `invalid-lease` instead of waiting on the
caller's own lock. Inspection accepts a shared or exclusive lease; sealing and promotion require an
exclusive lease.

Empty lock files remain in `.sys-rooted/locks`. Their paths give each lock a stable identity. Do not
delete or replace them: changing a lock path while another process holds the old file can split one
lock into two. The files contain no process data.

### Seal

Sealing makes an owned tree read-only. The filesystem owner can still read files and traverse
directories. This protects published data from accidental changes. `inspectSeal()` reports `sealed`,
`unsealed`, or `unsupported`. `sealTree()` changes and checks the complete tree before returning
`applied`.

Before changing permissions, `sealTree()` opens and rechecks the exact entry. Replacing its path
cannot redirect that change to another file. If the host cannot safely identify entries or prove
their permissions, sealing reports `unsupported`.

Passing `{ seal: true }` to `promoteStage()` seals the private stage, makes only its root writable
when needed for the rename, then reseals and checks the published target. The seal result describes
permissions only. It says nothing about file contents or origin.

A seal prevents ordinary writes; it is not a retention lock. With an exclusive lease, `removeTree()`
restores only the permissions needed inside the target and removes it.

### Remove

`removeTree()` requires an exclusive lease for the exact admitted target handle. This prevents
cooperating cleanup from removing a directory that is still in use. Releasing the lease while
removal is running waits for that operation before unlocking. A missing target returns `absent`.

On POSIX hosts, the target's parent must already permit removal: at least one permission class needs
both write and traversal access. A sealed parent therefore fails with `permission-denied` without
weakening or deleting the target. The operation never broadens ancestor or sibling permissions.

If removal starts but does not finish, the error has `committed: true`. Filesystem state may have
changed; keep the still-active lease, inspect the cause, and retry. Success means the target was
absent when the operation finished. It does not promise that the deletion reached durable storage
before sudden power loss.

Seal, removal, and stage-cleanup operations first check that every entry is an ordinary file or
directory on the same filesystem. They refuse symbolic links, special files, and hard-linked files.
An entry that cannot be proved safe remains in place for retry. No operation falls back to an
unverified recursive delete.

### Outcomes and failures

| Operation                       | Expected outcome when work cannot proceed    |
| ------------------------------- | -------------------------------------------- |
| `acquireLease()`                | Returns `busy`                               |
| `promoteStage()`                | Returns `occupied`                           |
| `removeTree()`                  | Returns `absent`                             |
| `inspectSeal()` or `sealTree()` | May return `unsupported`                     |
| `publishFile()`                 | Rejects with `FsRootedError` kind `occupied` |

Rejected operations use `FsRootedError`. Call `Fs.Capability.Rooted.Is.failure(error)` to identify
one. Its `operation` and `kind` fields say where and why it failed. `committed: true` means
filesystem state may have changed and must be checked before retry.

Once publication or occupation is known, `promoteStage()` preserves that outcome in `kind`. A later
cleanup or verification problem appears in `cleanupError` instead of rewriting what happened.

### Example

```ts
import { Fs } from '@sys/fs';

const rooted = await Fs.Capability.Rooted.create({ root: './store' });
const admission = await rooted.admit([{ kind: 'directory', path: 'generations/v1' }]);
const target = admission.targets[0];

const stage = await rooted.createStage();
const files = await stage.files.admit([{ kind: 'file', path: 'index.html' }]);
await stage.files.publishFile(files.targets[0], new TextEncoder().encode('<h1>Hello</h1>'));

const publication = await rooted.promoteStage(stage, target, { seal: true });
if (publication.cleanupError) {
  await rooted.discardStage(stage);
  throw publication.cleanupError;
}
if (publication.kind === 'occupied') throw new Error(`Target exists: ${target.path}`);

const leaseResult = await rooted.acquireLease([target], { mode: 'shared' });
if (leaseResult.kind === 'busy') throw new Error(`Directory is busy: ${leaseResult.target.path}`);

await using lease = leaseResult.lease;
// Cooperating cleanup cannot remove the target before this scope exits.
```

### Limits

A `Rooted` instance is not a sandbox. It constrains only calls made through that instance. Code with
direct filesystem access can still change the same files. Sealing does not revoke open handles or
protect against a hostile process running as the same user.

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
