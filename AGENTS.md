# AGENTS.md (system repo root)
This file adds `sys`-local constraints only.
All broader behavior is governed by root `AGENTS.md` and canonical canon.

Agents MUST:
- continue AGENTS.md traversal upward and apply the parent `AGENTS.md`
- treat the parent bootstrap and its canonical references as authoritative
- apply this file cumulatively with that canon


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
