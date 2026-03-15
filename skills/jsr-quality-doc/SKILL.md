---
name: jsr-quality-doc
description: Deep-pass a published JSR package from a local path, inspect the live JSR score and docs, and improve source-controlled documentation until the public surface is genuinely clean.
---

# JSR Quality: Docs

## Purpose

Use this skill when a local Deno package is published on JSR and its documentation quality needs to be raised without bluffing, padding, or score-gaming.

This skill targets the documentation-derived parts of the JSR score:
- `README` or module doc presence
- examples in the `README` or module doc
- module docs in entrypoints
- symbol documentation coverage

It does not pretend to solve non-doc score items such as runtime compatibility markers, provenance, or package registry settings. It should still inspect those items on the live score page and report them clearly when they are the remaining blockers.

The goal is not merely to hit 100%. The goal is to leave the repo in a cleaner, more truthful, more useful state than before.

## Inputs

- A concrete local package path.
- The path may be absolute or relative to the current workspace.
- Example:
  - `./code/sys.driver/driver-deno`

## Operating Standard

This is a `BMIND` ("beginners mind") skill:
- use a DEEP PASS
- derive truth from the real code and the live public surface
- read surrounding docs before writing new docs
- never infer behavior from names alone
- never write speculative or flattering documentation
- prefer one sharp sentence over a padded paragraph
- improve the repo, not just the score

## Preconditions
Before making any edits:

1. Find the nearest ancestor `deno.json` for the given package path.
2. Read `deno.json` and derive the published JSR package name from `name`.
3. Confirm the package is published on JSR.
4. Open the live score page:
   - `https://jsr.io/<name>/score`
5. Open the live docs page:
   - `https://jsr.io/<name>/doc`
6. If the live score is already 100% and the docs page is already clean, stop and report that no JSR quality-doc pass is needed.

## Required Sources

Read all relevant sources before writing:

- the local package `deno.json`
- the live JSR score page
- the live JSR docs page
- local `README.md` files that define package-facing docs
- local entrypoint module docs
- the exported type and runtime surfaces that back the missing docs
- nearby symbols and neighboring docs so wording stays consistent
- the implementation that determines the actual behavior

## Workflow

1. Resolve the package identity.
   - Read the nearest `deno.json`.
   - Extract the JSR package name from `name`.
   - Build the live score and doc URLs from that value.

2. Inspect the live score page first.
   - Identify which score items are failing.
   - Separate failures into:
     - source-controlled doc work this skill should fix
     - non-doc or publish-settings work this skill should only report

3. Inspect the live docs page.
   - Scan for every `No documentation available`.
   - Record the count and exact public symbols affected.
   - Also note missing or weak module-level docs and missing examples when those are part of the live score failure.

4. Map each live gap back to local source.
   - Find the exact defining file for each exported namespace, type alias, property, function, constant, entrypoint, module doc, or README section.
   - Read surrounding symbols first.
   - Read the implementation, not just the type name.
   - Confirm what the code actually guarantees.

5. Write only truthful docs.
   - Add symbol-level `/** */` JSDoc where the public symbol itself is undocumented.
   - Add member docs where the live surface still exposes undocumented fields.
   - Add or refine module docs where an entrypoint lacks a clear module summary.
   - Add or refine README or module-doc examples when the live score indicates the package needs one.
   - Prefer single-line docs when one line is enough.
   - Use longer docs only when the extra detail materially improves correctness or usability.

6. Re-read every touched doc for elegance.
   - Remove filler.
   - Remove speculative phrasing.
   - Remove wording that merely echoes the type name.
   - Align nearby docs so the surface reads as one system, not a pile of patches.

7. Rescan after edits.
   - Re-run the local doc surface scan.
   - Confirm the previously missing public symbols now have docs.
   - Re-check that entrypoint docs and examples satisfy the score item that triggered the work.

8. Verify locally.
   - Run the module's authoritative `deno task check`.
   - Run the narrowest relevant `deno task test --trace-leaks <relative-path>` first.
   - Expand verification only as needed.

## Writing Standard

Every added or revised doc must be:

- true to the current implementation
- informed by adjacent API context
- concise enough to scan quickly
- useful to a developer or agent reading the public surface
- free of filler, marketing tone, and speculation

Prefer:

- `JSR registry URL helpers.`
- `Package-scoped fetch helpers.`
- `Manifest pull result.`

Avoid:

- vague summaries
- behavior inferred only from names
- long multi-sentence blur
- repeated restatement of the symbol name
- comments written only to silence the score page

## BMIND Rules ("Beginners Mind")
When documenting a symbol:

- inspect the defining file
- inspect the code path or type spine that gives it meaning
- inspect adjacent exported members for consistency
- inspect module-level docs and README context when relevant
- read further when the truth is not yet crisp

When the public docs and local source diverge:

- say so explicitly
- name the published version and the local version when known
- do not claim the live JSR state reflects unpublished local changes

## Stop Conditions

Stop and report instead of guessing when:

- the package name cannot be derived cleanly from `deno.json`
- the package is not published on JSR
- the live score page or docs page is unavailable
- a missing public symbol cannot be mapped confidently to local source
- the local export surface and the live JSR docs are clearly from different versions
- the remaining score failures are not source-controlled doc work

## Output

Return:

- the live score before the pass
- the live missing-doc count before the pass
- the doc-derived score items that were failing
- the main surfaces that were documented or refined
- any residual mismatch between local source and the live JSR publication
- the verification commands that were run
- a conventional commit message suggestion
