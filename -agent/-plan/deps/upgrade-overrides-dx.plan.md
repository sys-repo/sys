# Upgrade override-policy DX optics

## Status

Complete. This plan is intentionally committed as a final historical record and is pending deletion
from the live tree.

Implemented by:

```text
b7afbc3a7 feat(workspace): surface npm override policy during upgrade
614ee29bf refactor(workspace): organize upgrade CLI helpers
```

## Final outcome

`deno task upgrade` now surfaces canonical npm override policy as read-only DX optics:

- the upgrade summary table shows `Overrides 2` when top-level package override roots exist;
- interactive checkbox rows mark direct override-root candidates with `override parent`;
- override optics do not alter policy selection, graph ordering, apply behavior, lockfile state, or
  audit behavior.

Current expected root output when all dependencies are latest:

```text
Release Policy   minor
Dependencies     77
Already latest   77
Blocked          0
Overrides        2
Planned          0
```

Current override roots are counted from canonical `deps.yaml` package policy:

```yaml
package.json:
  - overrides:
      "@automerge/automerge-repo":
        uuid: '11.1.1'
      monaco-editor:
        dompurify: '3.4.0'
```

The final count is `2`, because the optic counts top-level override roots:

- `@automerge/automerge-repo`
- `monaco-editor`

## Final design seams

The final implementation kept the intended authority boundaries:

1. `@sys/esm/deps` parses package override policy from `deps.yaml`.
2. `WorkspaceUpgrade.collect(...)` carries parsed `manifest.data.packageJson` on
   `WorkspaceUpgrade.CollectResult`.
3. CLI formatting derives read-only optics from `upgrade.collect.packageJson`.
4. The CLI never parses `deps.yaml` directly for this feature.

Relevant implemented files:

```text
code/sys/workspace/src/m.upgrade/t.ts
code/sys/workspace/src/m.upgrade/u.collect.ts
code/sys/workspace/src/m.upgrade/-test/-u.collect.test.ts
code/sys/workspace/src/m.cli/-test/-u.fmt.test.ts
```

After the feature landed, the formatter was organized into focused helper modules:

```text
code/sys/workspace/src/m.cli/u.fmt/u.fmt.ts
code/sys/workspace/src/m.cli/u.fmt/u.fmt.applied.ts
code/sys/workspace/src/m.cli/u.fmt/u.fmt.base.ts
code/sys/workspace/src/m.cli/u.fmt/u.fmt.diagnostics.ts
code/sys/workspace/src/m.cli/u.fmt/u.fmt.help.ts
code/sys/workspace/src/m.cli/u.fmt/u.fmt.plan.ts
code/sys/workspace/src/m.cli/u.fmt/u.fmt.progress.ts
code/sys/workspace/src/m.cli/u.fmt/u.fmt.selection.ts
code/sys/workspace/src/m.cli/u.fmt/u.fmt.t.ts
code/sys/workspace/src/m.cli/u/u.args.ts
code/sys/workspace/src/m.cli/u/u.interactive.ts
```

The public formatter surface remains the composed `Fmt` facade.

## Manual review workflow this enables

When `deno task upgrade` shows override policy and an override parent changes, the intended workflow is
still manual:

```sh
cd /Users/phil/code/org.sys/sys

# Remove or comment the relevant override in deps.yaml.
deno task prep:imports
deno install --reload
deno audit
deno why npm:dompurify
# or:
deno why npm:uuid
```

Decision rule:

- if audit stays clean and the transitive graph resolves safely, commit the override removal;
- if audit goes red or the unsafe transitive returns, restore the override in `deps.yaml`, rerun prep
  and audit, and keep the override policy.

This remains deliberately human-in-the-loop. Automation can be considered later only after this manual
flow proves recurring value.

## Acceptance criteria result

- [x] Summary reports override policy count when overrides exist.
- [x] Summary omits the override row when no override policy exists.
- [x] Selection rows flag direct candidates that are override roots.
- [x] Child override packages such as `uuid` and `dompurify` are not flagged merely because they are
      override leaves.
- [x] No mutation behavior changed.
- [x] No extra audit, lockfile, or resolver workflow was introduced.
- [x] CLI formatting does not duplicate dependency-policy parsing.
- [x] Tests cover collection metadata, summary count, and selection-row hints.

## Verification performed

Feature verification:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno task test --trace-leaks ./src/m.upgrade/-test/-u.collect.test.ts
deno task test --trace-leaks ./src/m.cli/-test/-u.fmt.test.ts
deno task check

cd /Users/phil/code/org.sys/sys
deno task upgrade --dry-run
```

Formatter organization verification:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno fmt --check src/m.cli/u.fmt src/m.cli/u src/m.cli/m.run.ts src/m.cli/-test/-u.fmt.test.ts src/m.cli/-test/-u.interactive.test.ts
deno task test --trace-leaks ./src/m.cli/-test/-u.fmt.test.ts
deno task test --trace-leaks ./src/m.cli/-test/-u.interactive.test.ts
deno task test --trace-leaks ./src/m.cli/-test/-m.run.test.ts
deno task check
```

## Non-goals preserved

- No automatic override removal.
- No `deno audit` run from `deno task upgrade`.
- No `deno.lock` inspection.
- No inference about whether an override is still needed.
- No advisory metadata or override reason tracking.
- No dependency upgrade workflow redesign.

## Pending lifecycle step

After this final plan-state commit, delete this plan from the live tree in a separate retirement
commit. The historical value will remain available in git history under this file path and the related
implementation commits listed above.
