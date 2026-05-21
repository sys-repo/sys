# Plan: @sys/text block primitive

## Status

Done.

`@sys/text/block` now exists as the focused `TextBlock` primitive and the shell managed-block
adapter has been refactored onto it.

Committed foundation:

- `178cfdf00 refactor(text): rename Update runtime namespace to TextUpdate`
- `7d0502950 feat(text): add TextBlock marker-bounded text primitive`

Final shell adoption work in this unit:

- Shell managed-block surgery delegates to `TextBlock`.
- Shell newline detection delegates to `TextUpdate.newlineOf`.
- Shell block logic is split by concept:
  - `u.block.ts` public facade
  - `u.block.markers.ts` marker grammar
  - `u.block.body.ts` body render/parse codec
  - `u.block.locate.ts` detection/state mapping
  - `u.block.plan.ts` update/remove planning
- Managed-block markers now use BEGIN/END heavy-rule lines rather than `>>>` / `<<<`.
- Legacy marker support was intentionally removed; this is a single-user greenfield migration.
- Generated body item labels are now minimal and human-readable:
  - `# path: deno`
  - `# alias: sys`
- Generated note now says:
  - `# Generated settings. Do not manually edit. Update with \`sys shell\`.`
- `@sys/tools` owner hint is now `sys shell`.

Final generated shell block shape:

```sh
# ━━━ BEGIN: @sys/tools:shell ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Generated settings. Do not manually edit. Update with `sys shell`.

# path: deno
export DENO_INSTALL="${DENO_INSTALL:-$HOME/.deno}"
case ":$PATH:" in
  *":$DENO_INSTALL/bin:"*) ;;
  *) export PATH="$DENO_INSTALL/bin:$PATH" ;;
esac

# alias: sys
alias sys="deno run -A jsr:@sys/tools"

# ━━━ END: @sys/tools:shell ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Final primitive assessment

`TextUpdate` and `TextBlock` form the intended toolkit layering:

```text
TextUpdate  → range-safe text edits, line spans, newline detection
TextBlock   → exact marker-bounded block detection/render/update/edit/remove
Shell block → product grammar, model parsing, stale/manual-edit warnings
```

The boundary is intentionally narrow:

- `TextBlock` owns marker semantics only.
- `TextUpdate` owns text surgery and mutation validation.
- Shell owns all shell/PATH/alias/product semantics.
- No root `{ Text }` export was added.
- No product defaults were added to `@sys/text/block`.
- `Update.diff` remains deferred.

## Proof

Passed after final shell adoption and block-body cleanup:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli && deno task check && deno task test
cd /Users/phil/code/org.sys/sys/code/sys.tools && deno task check && deno task test
```

Also verified no remaining old shell body/legacy marker references under shell code/tests:

```text
# >>> @sys/tools shell
# <<< @sys/tools shell
Managed by @sys/tools shell
Edit with: sys shell ...
# @sys.shell path ...
# @sys.shell alias ...
```

## Closeout

This plan is complete. The resulting primitives are pure, deterministic toolkit-level utilities,
and the shell adapter now composes them without leaking shell behavior back into `@sys/text`.

## Lifecycle cleanup

This file is complete and ready to retire from live working context once the cleanup commit below is
present in history.

```text
plan(archive): close sys text block primitive
```
