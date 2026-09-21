test-workflow-preflight.plan.md
- [x] 69fc60f1f refactor(workspace): run test workflow preflight once

## Closeout

The bounded generator change is complete. The opening item reconciles to reachable history; its
commit changes exactly the five implementation surfaces listed below. Current generator source and
`.github/workflows/test.linux.yaml` retain one non-matrix `graph` job, with the package matrix
waiting through `needs: graph` and no graph command in the matrix job.

Closeout reran the owning focused test command below: one test / nine steps passed, including
structural graph-job, dependency, command-count, and existing package/browser assertions. No
workflow regeneration or hosted CI execution was performed during closeout. The checked-in output
and local structural proof establish this plan's acceptance; a new hosted run is not an additional
completion requirement.

No implementation work remains. The remaining sections preserve the delivered contract and its
verification procedure, not an open work queue. Preserve this completion snapshot in history before
archiving the plan.

## Purpose

Stop recomputing the workspace graph in every Linux package-matrix job.

The graph check is repository-wide: the matrix package does not change its inputs or its result. The
generated workflow should therefore prove it once before package tests begin:

```text
graph → deno (package matrix)
```

## Change

Update the generated Linux test workflow so that:

1. `jobs.graph` runs on `ubuntu-latest`, has no matrix, uses only `contents: read`, and has no
   environment or secrets.
2. The graph job checks out the repository, installs the same pinned Deno runtime and frozen
   dependencies, then runs the existing exact command:

   ```text
   deno task check:graph
   ```

3. The existing `jobs.deno` package-matrix job declares `needs: graph`.
4. The matrix job no longer contains the graph-check step.
5. A failed graph job prevents package tests from starting through normal `needs` behavior.

Keep the package matrix, package test commands, browser setup, workflow triggers, permissions, and
all unrelated steps unchanged. Do not move workspace-information or Deno-information steps into the
graph job.

## Implementation boundary

Change only the Linux test-workflow generator, its focused tests, and its generated output. Expected
surfaces are:

- `code/sys/workspace/src/m.ci/u/u.workflow.ts`;
- `code/sys/workspace/src/m.ci/m.Test/u.tmpl.ts`;
- `code/sys/workspace/src/m.ci/m.Test/u.text.ts`;
- `code/sys/workspace/src/m.ci/m.Test/-.test.ts`; and
- `.github/workflows/test.linux.yaml`.

Use the smallest generator change that gives the graph job explicit ownership. Do not duplicate the
whole workflow template or introduce a generic job framework for this one dependency. Any shared
helper extension must be opt-in so existing callers render unchanged.

The Windows workflow generator is outside this item. Report before expanding beyond the listed
surfaces or absorbing unrelated generated changes.

## Test contract

Parse the rendered Linux YAML and prove structure rather than relying only on loose substring
checks:

- `jobs.graph` exists, runs on `ubuntu-latest`, has only read access, and has no matrix or
  environment;
- its checkout, Deno setup, frozen install, and graph-check steps render in order;
- the graph job contains exactly one step whose command is `deno task check:graph`;
- the complete workflow contains that exact command once;
- `jobs.deno.needs` is `graph`;
- the matrix job contains no graph-check command; and
- existing package matrix, package-test, and browser-test assertions remain valid.

## Non-goals

- no workspace graph algorithm, schema, hash, or graph-file change;
- no cache, fingerprint, changed-path shortcut, or replacement verifier;
- no movement of other workflow steps into a broader preflight;
- no synthetic matrix-failure propagation;
- no Windows, build, JSR, release, branch-protection, or trigger redesign; and
- no unrelated generator cleanup or abstraction work.

## Verification procedure (retained)

From `code/sys/workspace`:

```text
deno task test --trace-leaks ./src/m.ci/m.Test/-.test.ts
```

From the repository root:

```text
deno task check:graph
deno task prep:ci
```

Then inspect `.github/workflows/test.linux.yaml` and confirm:

- one non-matrix `graph` job runs the exact graph command once;
- the `deno` matrix has `needs: graph` and no graph command;
- package entries and test/browser behavior are unchanged; and
- no unrelated generated file is included in this implementation.

## Acceptance

The change is complete when the generated Linux workflow computes the workspace graph once, package
matrix jobs wait for that result, focused structural tests pass, and no package job recomputes the
graph.
