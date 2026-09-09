# JSR prep and release hardening plan

## Position

Current posture is strong but not yet S-tier on the release path. The work should be landed
progressively, not as one large move.

Most fixes are small-to-medium. The only potentially disruptive items are the publish gate changes
because they can affect human release habit and GitHub environment policy.

## Disruption estimate

### Low disruption

- Add generated-output drift checks.
- Add tests for workflow YAML rendering invariants.
- Harden YAML/shell rendering for package names and paths.
- Add clearer comments around generated publish workflow semantics.
- Make `prep:check` or equivalent non-mutating verification available.

### Medium disruption

- Remove or constrain `workflow_dispatch` on the JSR workflow.
- Change publish workflow to fail on generated drift before publishing.
- Replace `--allow-dirty` with a cleaner publish preflight or narrow exception.
- Split prep permission profiles between local generation and network/ahead-only checks.

### Higher disruption / policy-sensitive

- Pin GitHub Actions by full SHA.
- Tighten branch/tag/environment rules for JSR publish.
- Change the release habit from reusable mutable trigger tags to immutable release tags or an
  explicit release command.

## Strategy

Do not land this as one large security rewrite. Land it in progressive, independently reversible
chunks.

### Chunk 1: drift proof

Goal: prove generation is current without mutating files.

- Add a non-mutating prep check path.
- Check generated files:
  - `imports.json`
  - `package.json`
  - `deno.graph.json`
  - `.github/workflows/build.yaml`
  - `.github/workflows/test.yaml`
  - `.github/workflows/jsr.yaml`
  - generated `src/pkg.ts` files
  - CI Deno pin
- Wire the check into test/build/publish workflows before risky operations.

Acceptance:

- A clean checkout passes.
- A stale generated file fails with a precise message naming the file and generator.

### Chunk 2: publish cleanliness

Goal: make publish provenance defensible.

- Add publish preflight that verifies generated drift is clean.
- Remove `--allow-dirty` if possible.
- If `--allow-dirty` must remain, document and enforce the smallest allowed dirty set before
  publish.
- Keep JSR OIDC permission only on the publish workflow.

Acceptance:

- Publish cannot proceed from stale generated outputs.
- Publish cannot silently include unreviewed generation drift.

### Chunk 3: workflow-generation hardening

Goal: make generated YAML robust against malformed names/paths.

- Escape/quote YAML scalars through one helper.
- Avoid raw shell interpolation where possible.
- Validate package names and paths before workflow generation.
- Add tests for names/paths that contain YAML/shell-sensitive characters.

Acceptance:

- Generated workflows are stable for current repo paths.
- Malformed package metadata fails closed before YAML is written.

### Chunk 4: trigger and environment policy

Goal: make publish intent explicit and externally defensible.

- Decide whether branch-capable publish remains acceptable.
- If yes, require explicit protected environment approval for branch publish.
- If no, remove branch-capable trigger and keep mainline-only publish.
- Re-evaluate `workflow_dispatch` for publish.

Acceptance:

- Release path is understandable from workflow YAML alone.
- Manual publish cannot bypass the intended branch/tag policy.

### Chunk 5: supply-chain tightening

Goal: reduce mutable third-party CI surfaces.

- Consider SHA-pinning GitHub Actions.
- Keep Deno version pinned by generated source.
- Preserve lockfile/frozen dependency behavior in CI.

Acceptance:

- CI runner dependencies are pinned or consciously documented as mutable trust roots.

## Recommended order

1. Chunk 1: drift proof.
2. Chunk 2: publish cleanliness.
3. Chunk 3: workflow-generation hardening.
4. Chunk 4: trigger/environment policy.
5. Chunk 5: supply-chain tightening.

This order improves safety immediately without first changing release policy. Policy-sensitive
changes land only after the repo can prove generated state cleanly.

## Progress

### Landed

- [x] `f3b6e6191` fix(workspace): fail closed on unsafe workflow generation values
  - Started Chunk 3 with the low-disruption fail-closed guard.
  - Generated workflow module names and paths now reject shell/YAML-sensitive values before render.
  - Covered JSR publish, build, and test workflow generation paths.
  - Added regression tests for unsafe package names and paths.
  - Current generated workflow output remains unchanged for existing workspace package names and
    paths.
- [x] `e17f352a0` fix(ci): checkout LFS assets before JSR publish
  - Began proving JSR checkout cleanliness before publish by ensuring LFS assets are present.
- [x] `3b3402435` fix(ci): hydrate LFS assets before JSR publish
  - Continued the LFS checkout/hydration path for JSR publish cleanliness.
- [x] `a5fa75c4c` fix(ci): align LFS attributes before strict JSR publish
  - Aligned LFS attributes with committed pointer files for strict JSR publish checks.

### In progress

- Remove `--allow-dirty` from generated GitHub JSR publish steps.
  - This targets GitHub OIDC publish only.
  - Local dry-run helper surfaces may still use `--allow-dirty` for operator diagnostics.
  - If GitHub publish now fails dirty, treat that as a real generated-state/provenance signal.

### Remaining first-pass candidates

- Chunk 1: add non-mutating generated-output drift proof.
- Chunk 2: add publish preflight around generated drift before changing publish policy.
- Chunk 3 follow-up: split the coarse scalar guard into path-specific and package-name-specific
  validators if needed.

## Non-goals for first pass

- Do not rewrite the whole prep system.
- Do not replace the workspace graph model.
- Do not redesign bump/prep orchestration.
- Do not change package versions or publish package selection without an explicit release-policy
  decision.
