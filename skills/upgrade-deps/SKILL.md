---
name: upgrade-deps
description: Run `deno outdated` at the repo root, present the outdated dependency table for human selection, then update `deps.yaml` and run `deno task prep`; do not use ad hoc upgrade logic or direct `deno update` mutation as the primary workflow.
---

# Upgrade Dependencies

## Purpose
Use this skill when `/Users/phil/code/org.sys/sys` needs a dependency upgrade pass that stays inside the existing root dependency pipeline.

This repo uses [`deps.yaml`](/Users/phil/code/org.sys/sys/deps.yaml) as the single source of truth for dependency versions. The upgrade workflow is not "run an updater and accept the result." The workflow is:

1. run `deno outdated` at the repo root
2. present the outdated table for human review
3. agree which upgrades to take or defer
4. edit `deps.yaml`
5. run `deno task prep`

The goal is to move dependencies forward without bypassing the repo's own generation path for `imports.json`, `package.json`, and downstream prep artifacts.

## Inputs
- The repo root: `/Users/phil/code/org.sys/sys`
- Or a request that clearly targets the root dependency surface.
- Optional scope guidance from the human, for example:
  - upgrade all non-major updates
  - upgrade one dependency family
  - skip named packages
  - leave major versions deferred

## Operating Standard
This is a `BMIND` and `TMIND` skill:
- derive truth from the live command output and current `deps.yaml`
- treat the outdated table as the starting fact surface
- require a human selection step before mutating versions
- do not re-implement dependency resolution logic in code
- do not use `deno update` or `deno outdated --update` as the primary mutation path
- keep the diff limited to the intended dependency changes plus generated artifacts from `deno task prep`

## Required Sources
Read these before editing:
- [`/Users/phil/code/org.sys/sys/deps.yaml`](/Users/phil/code/org.sys/sys/deps.yaml)
- [`/Users/phil/code/org.sys/sys/deno.json`](/Users/phil/code/org.sys/sys/deno.json)
- [`/Users/phil/code/org.sys/sys/-scripts/task.prep.ts`](/Users/phil/code/org.sys/sys/-scripts/task.prep.ts)

These sources define:
- the root dependency source of truth
- the authoritative root task surface
- the generation path from `deps.yaml` to `imports.json`, `package.json`, package metadata sync, and submodule prep

## Workflow
1. Run `deno outdated` at `/Users/phil/code/org.sys/sys`.
   - Capture the outdated dependency table exactly as reported by the tool.
   - Do not mutate dependency versions at this step.

2. Present the results to the human.
   - Re-render the outdated output as a readable table in the response.
   - Call out major-version upgrades and any obviously sensitive packages.
   - Ask whether to proceed and whether any packages should be excluded.

3. Wait for selection.
   - Do not edit `deps.yaml` until the human confirms the target set.
   - If no upgrades are approved, stop without making changes.

4. Edit `deps.yaml` manually.
   - Change only the agreed dependency versions.
   - Preserve grouping and existing structure.
   - Do not introduce unrelated cleanup or formatting churn.

5. Run `deno task prep` at `/Users/phil/code/org.sys/sys`.
   - This is the authoritative mutation pipeline after `deps.yaml` changes.
   - Let the repo regenerate root dependency artifacts and run downstream prep steps.

6. Review the resulting diff.
   - Confirm that the changes align with the selected upgrades.
   - Review `deno.lock`, generated `imports.json`, generated `package.json`, and any downstream generated artifacts touched by `deno task prep`.
   - Keep those generated changes when they are the direct result of the approved upgrade set.
   - Call out any surprising follow-on changes.

7. Verify as needed.
   - Use the narrowest relevant checks first when the upgrade scope is limited.
   - Expand verification only when the changed dependency surface requires it or the human requests it.

## Hard Rules
- `deps.yaml` is the source of truth.
- `deno task prep` is the authoritative generation step after editing `deps.yaml`.
- `deno outdated` is for inspection and reporting.
- Do not edit generated `imports.json` or `package.json` directly to perform the upgrade.
- Do not edit `deno.lock` manually to force upgrade outcomes.
- Do not make `deno update` or `deno outdated --update` the main workflow.
- Do not add custom upgrade logic that duplicates what the existing commands already do.
- Do not discard generated artifacts from `deno task prep` when they are part of the approved upgrade result.
- Do not silently take major-version upgrades without explicit human approval.

## Reporting Standard
When using this skill, report:
- the outdated table
- the selected upgrades
- the deferred or excluded upgrades
- the exact `deps.yaml` edits made
- the commands run
- any notable generated changes after `deno task prep`, including `deno.lock` and generated dependency artifacts
- any verification performed

## Stop Conditions
Stop and report instead of guessing when:
- `deno outdated` fails or produces ambiguous output
- the repo root cannot be identified
- `deps.yaml` and the observed dependency surface appear out of sync
- the human has not yet confirmed which upgrades to take
- `deno task prep` fails

## Output
Return:
- the outdated dependency table
- the selected and deferred upgrades
- the files changed, especially `deps.yaml`, `deno.lock`, and generated artifacts
- the commands run
- any verification run
- a suggested canonical Conventional Commit message wrapped in triple backticks
  - use a family-specific message only when the upgraded set has a clear truthful family, for example `chore(deps): upgrade vite dependencies`
  - otherwise use the generic fallback: `chore(deps): upgrade selected dependencies`
