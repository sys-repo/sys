# Agent Context and Working Notes

This folder holds live or intentionally retained agent-facing context for the `sys` workspace.
Keep it small: retire completed plans after their useful history is preserved in git.

## Plan placement

When a human asks to "land this in a `-agent` `.md` plan file" or similar, prefer the nearest module-local `-agent` folder when the plan is scoped to a specific code area.

Use this workspace-level folder only for cross-cutting or root-scoped plans and working notes. Workspace-level live plan/context files belong under `-plan/`, grouped into stable subfolders when there is more than one file for the topic.

Name `.md` files for the durable subject they contain; avoid generic names like `DESIGN.md`, `PLAN.md`, or `notes.md` unless the surrounding folder makes the subject unambiguous.


