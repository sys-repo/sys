# AGENTS.md (workspace)
This file adds `sys`-local constraints only.
All broader behavior is governed by root `AGENTS.md` and canonical canon.

Agents MUST:
- continue AGENTS.md traversal upward and apply the parent `AGENTS.md`
- treat the parent bootstrap and its canonical references as authoritative
- apply this file cumulatively with that canon

## Forced canon bootstrap
Before answering any substantive prompt, agents MUST load the canonical context, in order:

1. Read `../AGENTS.md`.
2. Read `../sys.canon/AGENTS.md`.
3. Follow the canonical references from those files under `../sys.canon/-canon/` and apply them cumulatively.

Do not answer from this local file alone. Do not summarize or infer canon from memory.

If any required canon read fails because the launcher sandbox does not grant access, stop and say so. Then resolve the missing permissions through the active Pi profile, not by guessing a config under `../sys.canon`.

- If launcher/runtime context provides `runtime.pi.active-profile`, use that exact path.
- In this workspace, the local Pi profile is `./-config/@sys.driver-agent.pi/canon.yaml` (absolute: `/Users/phil/code/org.sys/sys/-config/@sys.driver-agent.pi/canon.yaml`).
- If the active/local profile is readable and writable, offer to update it with the missing permissions. If the human approves or says to "add it", edit the profile immediately, then ask the human to restart Pi.
- If the profile path is unknown or not writable, ask the human to add explicit Pi profile YAML permissions manually, then restart Pi.

The expected shape to add to the Pi profile is:

```yaml
sandbox:
  capability:
    read:
      - ../AGENTS.md
      - ../sys.canon
  context:
    append:
      - ../AGENTS.md
      - ../sys.canon/AGENTS.md
```

`context.append` loads startup guidance only; `capability.read` is still required for follow-up reads under canon.

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
