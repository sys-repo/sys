# AGENTS.md (system repo root)
Before any action:
- Before any action that modifies code, structure, or public API, ensure `AGENTS.md`
  constraints are in scope.
- Apply those instructions verbatim
- This file adds local constraints only; all other behavior is governed by `../AGENTS.md`.


====================================================================================================


## Deno task discipline (local policy)
- “Module” = nearest ancestor directory (from the target file) that contains `deno.json`.
- Run tasks from that directory (cd there first if needed).
- For “test” and “check” actions, always defer to the module’s `deno.json` tasks:
  - `deno task test`
  - `deno task check`
- Never run `deno test` / `deno check` directly for these actions.
- If the relevant `deno.json` does not define the task, STOP and ask which task
  (or which `deno.json`) is authoritative.


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
