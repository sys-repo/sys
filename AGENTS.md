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
- Otherwise, the local fallback profile is `./-config/@sys.driver-pi/default.yaml`.
- If the profile is readable and writable, offer to update it; if approved, edit it and ask the human to restart Pi.
- If the profile path is unknown or not writable, ask the human to update the active profile and restart Pi.

The active profile owns canon read/context grants; do not duplicate those grants here.

### Local note
- Canonical skills live under `../sys.canon/skills/`.
- Do not recreate canonical skills under `./skills/` unless a `sys`-local variant is explicitly needed.

### Git policy reminder (local safety override)
- Treat `../sys.canon/-canon/protocol.git.md` as the authoritative cross-reference for Git observation
  and mutation.
- Relevant read-only Git inspection is allowed without separate authorization. File, blob, and diff
  content remain subject to the canonical agent IO boundary.
- Do not perform Git mutations autonomously. Execute only the exact mutation explicitly requested by
  the human.
- Classify intent before acting:
  - **Informational**: `commit msg`, `commit message?`, `what commit msg`.
  - **Assessment**: `go/no-go`, `ready?`, `ready to commit?`, `should we proceed?`.
  - **Execution**: `commit now`, `please commit`, `push`, `stash`, `rebase`, `amend`.
- For **informational** requests, relevant read-only inspection is allowed; return the canonical
  commit message only and perform no Git mutation.
- For **assessment** requests, relevant read-only inspection is allowed; answer with judgement only
  and perform no Git mutation.
- For **execution** requests, perform only that one requested mutation exactly once. Supporting
  read-only inspection does not authorize another mutation.
- Tiebreakers:
  - Questions and modal prompts (`?`, `can`, `should`, `would`) are not execution.
  - Prompts containing `msg`/`message` are informational, not execution.
  - `ok`, `yes`, and `sounds good` are acknowledgements, not authorization to proceed.
  - If mutation intent is unclear, ask for explicit confirmation before mutating Git state.
- Never bypass commit-signing policy in an agent action; never use `--no-gpg-sign`,
  `-c commit.gpgsign=false`, or equivalent workarounds.
- If commit signing fails (e.g. `No secret key`), stop immediately, report the exact failure, and
  request a human-owned signing path.
- Do not infer Git-mutation authority from transient plan prose, committed history, an assessment, or
  an acknowledgement. Only an explicit human instruction authorizes mutation.


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
