# AGENTS.md (system repo root)
Before any action:
- Before any action that modifies code, structure, or public API, ensure `AGENTS.md`
  constraints are in scope.
- Apply those instructions verbatim
- This file adds local constraints only; all other behavior is governed by `../AGENTS.md`.


====================================================================================================


## Deno task discipline (local policy)
- **Module** = the nearest ancestor directory (from the target file) that contains `deno.json`.
- **Task execution rule**:
  - Always run `deno task …` from within the module directory (or any subdirectory of it).
  - If starting elsewhere, `cd` into the module first.
- **Task authority** (test / check):
  - Always use the module’s `deno.json` tasks:
    - `deno task test`
    - `deno task check`
  - Never run `deno test` / `deno check` directly.
  - If the module’s `deno.json` does not define the task, **STOP and ask** which task
    (or which `deno.json`) is authoritative.
- **Scoped testing**:
  - When run from a subdirectory, `deno task test` executes only the tests rooted under that path
    (per task configuration).
  - Use subdirectory runs intentionally for focus; use module root for full coverage.

### Targeted tests
- Run targeted tests with:
  - `deno task test --trace-leaks <relative-path>`
- Examples (from module root):
  - `deno task test --trace-leaks ./foo/bar`
  - `deno task test --trace-leaks ./foo/bar/-test/-baz.test.ts`



====================================================================================================


## Scoped agent canon (delegation rule)
Some subsystems define their own scoped `AGENTS.md` with additional,
domain-specific execution rules (e.g. UI components, media, schema tooling).

If the human explicitly indicates that work is scoped to a specific domain:
- You MUST locate and read the nearest applicable scoped `AGENTS.md`
  (e.g. under `-agent/*` or within the relevant subtree),
- Apply it cumulatively with this file,
- Obey the same conflict-resolution rules (root canon still wins).

Do NOT infer scope.
Do NOT activate scoped canon unless explicitly instructed.
