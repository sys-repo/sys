# checkpoint(testing): pre-hardening node-test migration experiment

Status: closed. The checkpoint was stashed as
`fd6c018c0416f3f328431bbe985449326cbcf35e` from branch `phil-work`.

Recovery baseline: `c72d5eef59fc7e5c2a7b683f4a035573b87e04b6`.

## Purpose

Preserve the false-green diagnostic migration while the final Deno-native BDD authority is rebuilt
in the ordered commit arc defined by `node-test-bdd-migration.plan.md`.

The checkpoint is evidence, not implementation authority. It must not be applied wholesale over the
final architecture.

## Scope preserved

- all 35 sanitizer-sensitive test paths in the migration inventory;
- the repository-template negative assertion;
- the diagnostic `node:test` facade and contract changes;
- transitional testing documentation;
- root sanitizer policy and generated dependency changes;
- the draft `code/sys/types/src/-test/t.Bdd.ts` contract.

Total: 46 tracked migration paths and one untracked draft.

## Explicit exclusions

- `-agent/-plan/@sys.std/node-test-bdd-migration.plan.md`;
- `package.json`;
- every unrelated tracked or untracked `sys` path;
- the separate `sys.canon` working tree.

## Checkpoint evidence

- stash identity: `fd6c018c0416f3f328431bbe985449326cbcf35e`;
- source branch: `phil-work`;
- recovery baseline: `c72d5eef59fc7e5c2a7b683f4a035573b87e04b6`;
- post-checkpoint status retained exactly 4 tracked and 14 untracked non-campaign paths;
- no migration implementation path remained modified or untracked;
- baseline reads restored `@std/testing/bdd`, dependency authority, omitted root strict policy, and
  original per-suite sanitizer options.

Git emitted two `new blank line at EOF` warnings while recording the stash. The checkpoint still
completed and the migration paths returned to baseline. Preserve those warnings as diagnostic-state
metadata; do not rewrite the stash to remove them.

## Closure

The final migration landed through the deterministic alarm controls and sanitizer-strict Deno-native
BDD authority, then reached plan closure:

- `node-test-bdd-migration.plan.md`: done at `ae69ca808`, retired at `1fbab9c00`.

The false-green experiment is superseded, has no active return boundary, and must not be applied.
Its local stash may be dropped after this closure record is committed.
