# Plan: driver-pi remove-tool hardening

## Status
Retired after landing prompt-contract hardening in `90b52682b`.

The remaining mechanical bash guard/report-visibility ideas were intentionally not landed in this plan slice and should be reopened as fresh scoped work if needed.

## Updated smoke finding
The `remove` tool registration works when the active profile YAML is saved before Pi restart.

Observed tool list after saving and restarting:

```text
- read — read text/image files
- bash — run shell commands, but not for file content/mutation work
- edit — precise text replacement in existing files
- write — create/overwrite files
- remove — dedicated tool to remove a file or directory path inside the writable sandbox
```

So the previous failure was not caused by `--extension` failing to load or by the wrapper-owned extension not registering. The active profile file had not been saved before restart.

## Remaining STIER gap
The system must not rely only on prompt discipline to prevent file deletion through bash.

Even with a dedicated `remove` tool, a model may still attempt:

```sh
rm -- some-file
```

This is exactly the class of bypass the `remove` tool was designed to avoid.

## TMIND verdict
The current implementation is directionally correct:

- profile opt-in works
- extension materialization works
- `remove` tool registration works
- absent policy remains disabled
- recursive deletion is permitted by default once `remove` is explicitly enabled

Remaining S-tier hardening target:

> prevent `bash` from acting as an unauthorized filesystem deletion/mutation fallback.

## Hardening moves

### 1. Prompt hardening
Strengthen the default/system prompt and enabled-remove runtime prompt.

Required wording:

```text
Filesystem mutation boundary:

Bash is not a file mutation tool.

Do not use bash to create, delete, rename, move, copy, truncate, patch,
transform, or clean up files/directories.

Forbidden bash examples include rm, rmdir, unlink, mv, cp, touch,
shell redirection, heredocs, and ad hoc scripts used for filesystem mutation.

If the remove tool is available, use remove for deletion/cleanup.
If asked to delete and remove is not available, STOP and say no approved
delete tool is available. Do not fall back to bash.
```

When `tools.remove.enabled: true`, runtime prompt should additionally state:

```text
The launcher has enabled a callable tool named remove.
Use remove for file/directory cleanup. Do not use bash for deletion.
Recursive removal is disabled/enabled according to profile policy.
If remove is absent from callable tools, report a launcher/tooling fault and stop.
```

### 2. Mechanical bash deletion guard
Add a runtime guard in the wrapper-owned extension that blocks clear deletion attempts through `bash`.

Initial narrow blocklist:

- `rm`
- `rmdir`
- `unlink`

Principle:

- Do not build a full shell parser in v1.
- Do not loosen bash.
- Block obvious deletion primitives mechanically.
- Keep the dedicated `remove` tool as the only deletion path.

Potential v2 expansion:

- `mv`, `cp`, `touch` where used as mutation
- shell redirection/truncation
- heredocs
- ad hoc interpreter scripts used for filesystem mutation

These broader mutation guards need careful design to avoid overblocking legitimate declared build/test tasks.

### 3. Launcher/report visibility
When `tools.remove.enabled: true`, make the launch/sandbox report visibly state:

```text
tools.remove: enabled
recursive: true
extension: .pi/@sys/extensions/sandbox.fs.ts
```

Goal: make smoke/debug obvious to humans before asking Pi to delete anything.

## Tests to add

### Prompt tests
- default prompt forbids bash deletion/mutation fallback
- enabled remove runtime prompt says to use `remove`
- enabled remove runtime prompt says to stop if callable `remove` is absent

### Guard tests
- generated extension blocks `bash` call containing `rm file`
- generated extension blocks `rmdir dir`
- generated extension blocks `unlink file`
- generated extension still allows non-deletion bash commands
- guard applies when extension is loaded

### Integration/report tests
- enabled profile reports remove state/path visibly
- disabled profile does not claim remove is available

## Non-goals
- No broad shell parser in this pass.
- No automatic enabling of the `remove` tool by migration/default profile.
- No weakening of the constrained bash boundary.
- No debugging of extension registration unless a fresh saved-profile smoke fails again.

## Acceptance criteria
- If the model tries `bash rm`, the tool call is blocked by runtime policy.
- If cleanup is needed and `remove` is available, prompt instructs use of `remove`.
- If cleanup is needed and `remove` is unavailable, prompt instructs STOP, not bash fallback.
- Humans can see remove-enabled state in launcher/report output.
