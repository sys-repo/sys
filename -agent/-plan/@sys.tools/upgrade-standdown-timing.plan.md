# @sys/tools upgrade standdown timing

- [x] fix(registry): expose JSR version creation timestamps
- [x] fix(workspace): preserve minimum dependency age cutoff facts
- [x] fix(tools): report minimum dependency age standdown timing

## Finish reality

- `8802ad964` — `fix(registry): expose JSR version creation timestamps`
- `ec217873e` — `fix(workspace): preserve minimum dependency age cutoff facts`
- `5502977e0` — `fix(tools): report minimum dependency age standdown timing`

Final tools proof rerun after DRY/copy review:

- [x] `deno task --cwd /Users/phil/code/org.sys/sys/code/sys.tools test:upgrade`
- [x] `deno task --cwd /Users/phil/code/org.sys/sys/code/sys.tools check`
- [x] Bad-copy/DRY scan: no runtime `held at`, `running`, `Deno is not allowing`, `supply-chain`, or `holding`; no local upgrade-slice `MINUTE/HOUR/DAY` restatement.

## Subject

`@sys/tools upgrade` currently has the right high-level state but the wrong human model:

- `running` reads like process state; the truthful label is `current`.
- `held at` is misleading when Deno resolves an older eligible version than the CLI already running.
- The footer blames Deno instead of naming the policy window.
- The timing truth is available but not carried through the upgrade model.

## Truth model

The standdown timer is calculable only when both facts are present:

1. JSR latest version publish timestamp from `@sys/tools` metadata, currently `createdAt` on the
   version entry.
2. Deno resolver minimum dependency date from the pinned latest probe diagnostic.

Derived fact:

```text
eligibleAt = latest.createdAt + (now - minimumDependencyDate)
remaining = eligibleAt - now
```

Equivalent algebra:

```text
remaining = latest.createdAt - minimumDependencyDate
```

This is honest because Deno's minimum dependency date is the moving cutoff: a package becomes
eligible when its publish timestamp is no longer newer than that cutoff.

## Actionability rule

Standdown is not the whole upgrade state. The unpinned public resolver answer is the latest
installable/actionable version under the active Deno policy.

Render rules:

- If `current < actionable`, offer the actionable upgrade, even when `actionable < latest`.
- Show `upgrade standing down` only when `latest > current` and there is no actionable version newer
  than `current`.
- Do not block an eligible intermediate upgrade just because a newer latest release is still inside
  the minimum dependency age window.

Example:

```text
current  0.0.462
latest   0.0.464
upgrade  0.0.463
```

This is an upgrade-available state, not a standdown state.

## Target render

When duration is known:

```text
@sys/tools upgrade standing down

  current  0.0.462
  latest   0.0.464

No upgrade was run.
Waiting for the minimum dependency age window to pass — 20h 45m.
```

When duration is not known:

```text
@sys/tools upgrade standing down

  current  0.0.462
  latest   0.0.464

No upgrade was run.
Waiting for the minimum dependency age window to pass.
```

## Design shape

- `@sys/registry/jsr` should truthfully type JSR version metadata with `createdAt`.
- `@sys/workspace/resolve` should preserve parsed minimum dependency age cutoff facts on the
  `policy:minimum-dependency-age` reason.
- `@sys/tools/upgrade` should compose those two facts into a local standdown timing model rather
  than re-parsing strings in the renderer.
- Formatting should be a leaf concern: display `current`, `latest`, and the footer duration only
  when the data model has a proven duration.

## TMIND/DMIND review gates

- Do not show `held at` for an actionable version lower than `current`.
- Do not compute a timer from one fact; missing `createdAt` or missing cutoff means no duration.
- Do not weaken or bypass Deno's supply-chain policy to prove the upgrade path.
- Do not make Deno the subject of the footer; the subject is the minimum dependency age window.
- Do not let a blocked latest hide an eligible intermediate upgrade.
- Keep the shared contracts small: registry exposes registry facts, workspace resolver exposes
  resolver facts, tools upgrade composes display state.

## Implementation steps

1. Add/adjust focused tests around JSR version metadata typing and Deno minimum dependency date
   parsing.
2. Add `createdAt` to the JSR package version metadata type.
3. Parse and preserve the minimum dependency date in the workspace resolver reason.
4. Extend the `@sys/tools` upgrade version state with an optional minimum-dependency-age standdown
   timing fact.
5. Preserve/verify the actionable upgrade path when `current < actionable < latest`.
6. Change the render labels and footer copy.
7. Verify fallback behavior when either timing fact is missing.

## Proof targets

- [x] `deno task --cwd code/sys/registry test --trace-leaks ./src/m.jsr/m.client/m.Fetch/-Pkg.test.ts`
- [x] `deno task --cwd code/sys/workspace test:resolve`
- [x] `deno task --cwd code/sys.tools test:upgrade`
- [x] `deno task --cwd code/sys/registry check`
- [x] `deno task --cwd code/sys/workspace check`
- [x] `deno task --cwd code/sys.tools check`
