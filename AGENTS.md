# AGENTS.md (workspace)
This file adds `sys`-local constraints only.
Canonical agent policy lives in `../sys.canon/` and is authoritative.

Agents MUST:
- Apply loaded canon cumulatively with this file.
- If canon has not been loaded by the launcher, read `../sys.canon/AGENTS.md` and follow its references.
- Do not use `../AGENTS.md` for `sys` workspace bootstrap.
- Do not answer from this local file alone or infer canon from memory.

If canon reads fail because launcher sandbox access is missing, stop and say so. Resolve missing access through the active Pi profile, not by guessing a config path.

- If launcher/runtime context provides `runtime.pi.active-profile`, use that exact path.
- Otherwise, the local fallback profile is `./-config/@sys.driver-agent.pi/canon.yaml`.
- If the profile is readable and writable, offer to update it; if approved, edit it and ask the human to restart Pi.
- If the profile path is unknown or not writable, ask the human to update the active profile and restart Pi.

The active profile owns canon read/context grants; do not duplicate those grants here.

### Local note
- Canonical skills live under `../sys.canon/skills/`.
- Do not recreate canonical skills under `./skills/` unless a `sys`-local variant is explicitly needed.


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
