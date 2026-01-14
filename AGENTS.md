# AGENTS.md (/sys repo root)
Before any action:
- Read `../AGENTS.md`
- Apply those instructions verbatim

---

## Deno task discipline (local policy)
- For “test” and “check” actions, always defer to the module’s `deno.json` tasks:
  - `deno task test`
  - `deno task check`

- Never run `deno test` / `deno check` directly for these actions.

- If the relevant `deno.json` does not define the task, STOP and ask which task
  (or which `deno.json`) is authoritative.
