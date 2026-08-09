# Sandbox filesystem exact tools plan

## Implementation reality

Status: implemented and landed.

Relevant commits:

- `089949ba0` — `Add sandbox filesystem move and copy tools`
  - implemented the Pi sandbox filesystem extension family: `remove`, `move`, and `copy`;
  - made `remove` and `copy` available by default unless explicitly disabled;
  - kept `move` opt-in by default;
  - kept prompt contracts truthful: only enabled/registered tools are mentioned;
  - generated the Pi extension as a self-contained runtime file that does not import `@sys/fs`.
- `2a8321c13` — `feat(fs): add exact filesystem primitives for sandbox-safe mutation`
  - added related std-level `@sys/fs` primitives (`lstat`, `rename`, strict `copyFile`, `remove`);
  - these remain valid library improvements for normal consumers;
  - the generated Pi extension intentionally does not use them at startup, to avoid widening child-process read permissions or requiring `~/node_modules/@sys/fs` readability.

Reality after implementation:

- `remove`: enabled by default, recursive enabled by default, still bounded to write roots and protected-root guards.
- `copy`: enabled by default, read-root → write-root only, regular files only, no overwrite, no parent creation.
- `move`: disabled by default and enabled only by explicit `tools.move.enabled: true`.
- The extension is generated only when at least one sandbox filesystem tool is enabled.
- The generated extension registers tools conditionally from policy:
  - `remove` iff `POLICY.remove.enabled`;
  - `move` iff `POLICY.move.enabled`;
  - `copy` iff `POLICY.copy.enabled`.
- The prompt is appended at profile-run time via `SandboxFs.toPromptArgs(policy)`, not baked into the global startup prompt.
- Validation passed before landing: driver-pi checks/tests and workspace `deno task check`.

## BMIND / S-tier conclusion

The right design is not a generic filesystem tool and not a return to unbounded shell power.
The right design is a small, wrapper-owned sandbox filesystem family that restores only the exact
filesystem primitives removed from `bash` by the sandbox:

- `remove`: destructive cleanup inside writable roots;
- `move`: exact rename/move inside writable roots;
- `copy`: exact file import from readable roots into writable roots.

This is still principled. Pi's four-tool elegance remains the core authoring model:

```txt
read, write, edit, bash
```

The sandbox filesystem tools are conditional restitution tools. They exist only because direct shell
filesystem mutation is now forbidden. They must stay exact-path, policy-bounded, non-magical, and
truthfully advertised only when enabled.

Do not add convenience tools. Add only syscall-like primitives that:

- replace a forbidden shell filesystem operation;
- are safer than model-mediated read/write emulation;
- can be bounded by read/write roots and protected runtime paths;
- return structured details;
- avoid globs, overwrite defaults, parent creation, and shell fallback.

## Problem

The wrapper-owned `remove` tool correctly prevents agents from using shell deletion as a fallback.
It covers one destructive filesystem primitive, but sandboxed Pi still lacks safe primitives for two
real workflows:

1. refactor motion: rename/move a file or directory without reading and rewriting content through the
   model transcript;
2. artifact import: copy a readable external file, such as a screenshot, into the writable workspace
   while leaving the source untouched.

When a file needs to be renamed, the agent currently has to emulate the move by reading the old file,
writing a new file, and removing the old file. That is slower, token-heavy, non-atomic, and increases
drift risk.

When a file exists in a read-only sandbox root, `move` is not correct because moving mutates the
source parent. The principled operation is `copy`: read source bytes from a readable root and create a
new destination file in a writable root.

Safe wrapper-owned `move` and `copy` tools should sit beside `remove`.

## Goals

Add deterministic sandbox filesystem tools for exact path operations:

- `move`: move or rename files/directories inside writable sandbox roots;
- `copy`: copy one regular file from readable sandbox roots into writable sandbox roots.

`move` should support:

- file rename within a directory;
- file move to another writable sandbox directory;
- directory rename/move when both source and destination are allowed;
- atomic filesystem rename where the runtime supports it.

`copy` should support:

- file copy from the runtime root or profile/caller-authored read roots;
- file copy into the runtime root or profile/caller-authored write roots;
- exact byte ingestion for artifacts such as screenshots;
- no source mutation.

The tools should not support:

- globs;
- shell expansion;
- overwrite-by-default;
- implicit parent creation;
- copy-as-move semantics;
- move-as-copy-remove fallback;
- directory copy in the first version;
- copying symlinks in the first version;
- moving or copying protected control/runtime paths;
- traversing through intermediate symlinks.

## Tool count doctrine

Adding `copy` is principled only if it remains an import primitive, not a convenience layer.

The split is:

```txt
move: write-root → write-root, source disappears by rename
copy: read-root  → write-root, source remains
remove: write-root destructive delete
```

`copy` must not become the implementation strategy for `move`. A filesystem rename is its own
primitive. `copy + remove` is non-atomic, failure-prone, metadata-changing, and semantically wrong
for refactors.

If the underlying exact rename primitive cannot move across devices, `move` should fail clearly. Do
not silently degrade to `copy + remove`.

## Tool contracts

### `move`

```txt
# Runtime Tool Contract: move

The launcher has enabled the wrapper-owned `move` tool.

Available additional tool:
- move: Move or rename a file or directory path inside the writable sandbox. No globs, no shell commands.

Rules:
- Use `move` for file/directory renames and refactor moves that should preserve content exactly.
- Bash is not a file move/rename fallback. Do not use `bash`, `mv`, shell redirection, heredocs, or ad hoc scripts to move/rename files/directories.
- If asked to move/rename and the callable `move` tool is unavailable, STOP and report a launcher/tooling fault. Do not fall back to `bash`.
- The source must exist inside a writable sandbox root.
- The destination must be inside a writable sandbox root.
- The destination must not already exist.
- The destination parent must already exist.
- The tool refuses protected control/runtime paths even when the process can write them.
```

### `copy`

```txt
# Runtime Tool Contract: copy

The launcher has enabled the wrapper-owned `copy` tool.

Available additional tool:
- copy: Copy one regular file from a readable sandbox path to a writable sandbox path. No globs, no shell commands.

Rules:
- Use `copy` for exact artifact import, such as copying a screenshot into the workspace before creating a note that references it.
- Bash is not a file copy fallback. Do not use `bash`, `cp`, shell redirection, heredocs, or ad hoc scripts to copy files.
- If asked to copy/import and the callable `copy` tool is unavailable, STOP and report a launcher/tooling fault. Do not fall back to `bash`.
- The source must exist inside a readable sandbox root.
- The source must be a regular file, not a directory or symlink.
- The destination must be inside a writable sandbox root.
- The destination must not already exist.
- The destination parent must already exist.
- The tool refuses protected control/runtime paths even when the process can read or write them.
```

## Parameters

```ts
type MoveParams = {
  /** Source file or directory path, relative to cwd or absolute inside the writable sandbox. */
  readonly from: string;

  /** Destination file or directory path, relative to cwd or absolute inside the writable sandbox. */
  readonly to: string;
};

type CopyParams = {
  /** Source regular-file path, relative to cwd or absolute inside a readable sandbox root. */
  readonly from: string;

  /** Destination file path, relative to cwd or absolute inside a writable sandbox root. */
  readonly to: string;
};
```

Do not add `overwrite` in the first version. Existing-destination replacement should remain an
explicit multi-step operation with human-visible intent.

## Policy

Keep tool policy separate from filesystem root policy.

Profile shape as implemented by defaults:

```yaml
tools:
  remove:
    enabled: true
    recursive: true
  move:
    enabled: false
  copy:
    enabled: true
```

`remove` and `copy` are default-on but can be explicitly disabled. `move` remains opt-in because it
changes tree structure more aggressively than cleanup or read-root artifact import.

Type shape:

```ts
export type Tools = {
  readonly remove?: Tools.Remove;
  readonly move?: Tools.Move;
  readonly copy?: Tools.Copy;
};

export namespace Tools {
  export type Move = {
    /** Enable the wrapper-owned `move` tool. */
    readonly enabled?: boolean;
  };

  export type Copy = {
    /** Enable the wrapper-owned `copy` tool. */
    readonly enabled?: boolean;
  };
}
```

Resolved sandbox filesystem policy should become tool-shaped rather than remove-shaped:

```ts
export type Policy = {
  /** Roots visible to read-side operations such as `copy.from`. */
  readonly readRoots: readonly t.StringDir[];
  /** Roots writable by mutating operations such as `remove`, `move`, and `copy.to`. */
  readonly writeRoots: readonly t.StringDir[];
  /** Paths and descendants the sandbox filesystem tools must refuse. */
  readonly protectedRoots: readonly t.StringPath[];
  readonly remove: RemovePolicy;
  readonly move: MovePolicy;
  readonly copy: CopyPolicy;
};

export type RemovePolicy = {
  readonly enabled: boolean;
  readonly recursive: boolean;
};

export type MovePolicy = {
  readonly enabled: boolean;
};

export type CopyPolicy = {
  readonly enabled: boolean;
};
```

Root derivation:

- `writeRoots` are the runtime root plus profile/caller-authored write roots;
- `readRoots` are the runtime root plus profile/caller-authored read roots;
- do not include process-only runtime reads such as shells, Deno cache, temp dirs, or ancestor
  discovery grants as `copy` source roots;
- protected roots are excluded for all tools.

For compatibility inside the implementation, introduce this in one refactor with the extension
template updated at the same time. Do not leave long-lived duplicate root fields.

## Root rules

Use one shared root model:

- runtime root is always a read and write operation root;
- profile/caller-authored read roots are `copy.from` roots;
- profile/caller-authored write roots are `remove`, `move`, and `copy.to` roots;
- protected roots are excluded descendants;
- operation roots themselves cannot be removed or moved;
- protected roots and their descendants cannot be removed, moved, copied from, or copied to.

A move is allowed only when:

- `from` resolves inside a configured write root;
- `to` resolves inside a configured write root;
- `from` is not equal to any write root;
- `to` is not equal to any write root;
- neither resolved path is inside a protected root;
- moving a directory will not move a protected descendant;
- both source parent and destination parent avoid intermediate symlink traversal.

A copy is allowed only when:

- `from` resolves inside a configured read root;
- `to` resolves inside a configured write root;
- `from` is a regular file and not a symlink;
- `to` is not equal to any write root;
- neither resolved path is inside a protected root;
- source parent and destination parent avoid intermediate symlink traversal.

Cross-root moves are acceptable when both roots are configured write roots. The tool is still bounded
by the active sandbox policy. Cross-device rename failures should surface as move failures, not fall
back to copy/delete.

## Guard rules

Reject `move` when:

- `move` is disabled by active profile policy;
- `from` or `to` is empty after trim;
- either path starts with `~`;
- either path contains a `..` segment;
- either path contains glob-shaped characters: `* ? [ ] { }`;
- source does not exist;
- destination already exists;
- destination parent does not exist;
- destination parent is not a directory;
- source or destination is outside write roots;
- source or destination equals a write root;
- source or destination is inside a protected root;
- source is a directory that contains a protected root;
- destination would contain or overlap a protected root;
- an intermediate source or destination parent segment is a symlink;
- source and destination resolve to the same path;
- source is a directory and destination is inside source.

Reject `copy` when:

- `copy` is disabled by active profile policy;
- `from` or `to` is empty after trim;
- either path starts with `~`;
- either path contains a `..` segment;
- either path contains glob-shaped characters: `* ? [ ] { }`;
- source does not exist;
- source is not a regular file;
- source is a symlink;
- destination already exists;
- destination parent does not exist;
- destination parent is not a directory;
- source is outside read roots;
- destination is outside write roots;
- destination equals a write root;
- source or destination is inside a protected root;
- source or destination parent traversal crosses an intermediate symlink;
- source and destination resolve to the same path.

Symlink policy:

- `move` may move a final-path symlink itself when source and destination are otherwise permitted;
- `copy` refuses final-path symlinks in the first version;
- resolving through intermediate symlinks is refused for both tools;
- use `lstat` for final-path guard classification.

Protected-tree policy:

- refusing `target inside protectedRoot` is not enough;
- tree-affecting operations must also refuse `target ancestor of protectedRoot`;
- this should be factored once and applied to `remove`, `move`, and relevant destination checks.

## Runtime implementation

Extend the generated sandbox filesystem extension template.

Generated extension filesystem rule:

- keep the generated Pi extension self-contained and dependency-minimal;
- do not import `@sys/fs` from the generated extension, because Pi loads extensions inside the scoped child sandbox and package-resolution paths may not be readable;
- use direct `Deno.*` filesystem primitives only inside the generated runtime extension boundary;
- keep exact filesystem semantics locally obvious: `Deno.lstat`, `Deno.rename`, `Deno.copyFile`, and `Deno.remove`;
- do not use shell fallbacks, generic transfer helpers, globs, implicit destination parent creation, or overwrite-by-default policy.

Required local runtime surface:

```ts
type LocalSandboxFsSurface = {
  /** resolve/normalize user and policy paths without importing path libraries. */
  readonly resolve: (...parts: readonly string[]) => string;

  /** lstat semantics: classify the final path without following a final symlink. */
  readonly lstat: (path: string) => Promise<FileInfo | undefined>;

  /** exact rename semantics; no copy/delete fallback. */
  readonly rename: (from: string, to: string) => Promise<void>;

  /** direct file copy after guards have rejected overwrite and missing parent. */
  readonly copyFile: (from: string, to: string) => Promise<void>;

  /** removal with caller-controlled recursion. */
  readonly remove: (path: string, options?: { readonly recursive?: boolean }) => Promise<void>;
};
```

`@sys/fs` may still expose these primitives for normal library consumers, but the generated Pi
extension should not depend on that package at startup.

Register tools conditionally, matching the prompt truthfully:

```ts
export default function sandboxFs(pi: ExtensionAPI) {
  if (POLICY.remove.enabled) registerRemove(pi);
  if (POLICY.move.enabled) registerMove(pi);
  if (POLICY.copy.enabled) registerCopy(pi);
}
```

Do not register disabled tools and rely on guards to reject. The callable tool surface should match
what the prompt says is available.

### Move execution

Execution should:

1. trim `from` and `to`;
2. resolve both against `ctx.cwd`;
3. run `guardMove(...)`;
4. call the exact `Fs.rename(fromTarget, toTarget)` primitive;
5. return structured details.

Success details:

```ts
type MoveDetails = {
  readonly ok: true;
  readonly from: string;
  readonly to: string;
  readonly resolvedFrom: string;
  readonly resolvedTo: string;
};
```

Failure details:

```ts
type MoveDetails = {
  readonly ok: false;
  readonly from: string;
  readonly to: string;
  readonly resolvedFrom: string;
  readonly resolvedTo: string;
  readonly reason: string;
};
```

Human text:

```txt
Moved: <resolvedFrom> → <resolvedTo>
Move failed: <reason>
```

### Copy execution

Execution should:

1. trim `from` and `to`;
2. resolve both against `ctx.cwd`;
3. run `guardCopy(...)`;
4. call the exact `Deno.copyFile(fromTarget, toTarget)` primitive after guards have rejected existing destinations and missing parents;
5. return structured details.

Success details:

```ts
type CopyDetails = {
  readonly ok: true;
  readonly from: string;
  readonly to: string;
  readonly resolvedFrom: string;
  readonly resolvedTo: string;
};
```

Failure details:

```ts
type CopyDetails = {
  readonly ok: false;
  readonly from: string;
  readonly to: string;
  readonly resolvedFrom: string;
  readonly resolvedTo: string;
  readonly reason: string;
};
```

Human text:

```txt
Copied: <resolvedFrom> → <resolvedTo>
Copy failed: <reason>
```

## Prompt wiring

`toPromptArgs(...)` should append contracts only for enabled and registered tools:

- no tools enabled: no appended prompt and no generated extension;
- remove only: current remove contract;
- move only: move contract;
- copy only: copy contract;
- multiple tools: one sandbox filesystem section, or adjacent runtime tool contracts, listing only
  the enabled tools.

Keep the prompt truthful. If recursive removal is disabled, say so. If `move` or `copy` is disabled,
do not mention the tool as available.

## Tests

Add/update tests for:

- profile schema accepts `tools.move.enabled` and `tools.copy.enabled`;
- profile schema rejects unknown move/copy fields;
- migration defaults bounded remove/copy tools on while preserving explicit disabled policy;
- migration keeps move opt-in by default;
- policy resolution enables move and copy separately from remove;
- policy resolution separates read roots from write roots;
- prompt args mention each tool only when enabled;
- generated extension registers only enabled tools;
- generated extension registers remove, move, and copy when all are enabled;
- move renames a file without reading/writing file content;
- move renames a directory;
- move refuses empty paths, `~`, `..`, globs, same-path moves;
- move refuses missing source;
- move refuses existing destination;
- move refuses missing destination parent;
- move refuses destination parent that is not a directory;
- move refuses operation roots;
- move refuses protected roots, descendants, and protected descendants contained by directory moves;
- move refuses intermediate symlink traversal for source and destination parents;
- move refuses directory move into its own descendant;
- move permits moving the final symlink itself when otherwise allowed;
- copy copies a readable external file into a writable workspace path;
- copy leaves the source file in place;
- copy refuses directory sources;
- copy refuses final symlink sources;
- copy refuses missing source;
- copy refuses existing destination;
- copy refuses missing destination parent;
- copy refuses read sources outside read roots;
- copy refuses destinations outside write roots;
- copy refuses protected roots and descendants;
- copy refuses intermediate symlink traversal for source and destination parents;
- remove behavior remains unchanged except for the protected-tree safety fix.

## Acceptance criteria

- Agents can rename a file with one `move` tool call instead of read/write/remove.
- Agents can import a readable screenshot or artifact with one `copy` tool call instead of shell `cp`
  or model-mediated file content transfer.
- `move` never requires shell access.
- `copy` never requires shell access.
- `move` never reads or rewrites file content.
- `copy` never removes or mutates the source.
- Destinations are never overwritten implicitly.
- The same protected root guarantees apply across `remove`, `move`, and `copy`.
- Disabled tools are not registered and are not mentioned in prompt contracts.
- `deno task check` and driver-pi extension tests pass.

## Non-goals

- no generic filesystem tool;
- no overwrite mode in the first version;
- no glob expansion;
- no recursive parent creation;
- no directory copy in the first version;
- no symlink copy in the first version;
- no move fallback to `copy + remove`;
- no automatic git-aware rename behavior;
- no fallback to shell `mv` or `cp`.
