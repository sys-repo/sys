# Agent IO Policy YAML Plan

## Status
Open live TODO: deferred design/backlog.

Keep this plan open until structured IO policy has an owner, schema, and runtime surfacing path. Do not canonize this file as-is: it describes an intended policy surface, not current mechanical enforcement.

Close/delete this plan only after the policy surface is implemented, documented, and any enforcement limits are stated truthfully in canon/runtime docs.

## Goal
Introduce a declarative `agent_io_policy` YAML/config surface that makes the agent's IO authority model explicit, inspectable, and eventually enforceable by tooling.

This is the next step after the lightweight prompt/README pass. The prompt defines the behavioral contract first; the YAML policy later becomes the structured config that runtimes, UIs, and command brokers can read.

## Why
The current risk is multiple authority planes: standard read/edit/write tools may deny file access while raw bash can still route around the denial. A written prompt reduces accidental bypass, but it is not a mechanical boundary.

A structured policy gives the system a durable place to express:
- which tools may read or write file contents
- what bash is allowed to do
- what bash is forbidden to do
- whether Python is disallowed
- whether Deno eval is allowed, and under what constraints
- how permission expansion is requested and approved
- which future runtime substrate is expected to enforce the policy

## Non-goals
- Do not replace the immediate hard prompt rule.
- Do not claim YAML alone is security enforcement.
- Do not remove useful bash execution for declared tasks, tests, builds, linting, or operational probes.
- Do not let `deno eval` become a new IO bypass.
- Do not silently self-grant permissions.

## Draft shape

```yaml
agent_io_policy:
  mode: strict-io

  filesystem_content_authority:
    read:
      - read
    write:
      - edit
      - write

  bash:
    allowed_for:
      - declared_tasks
      - tests
      - build
      - lint
      - operational_probes
    forbidden_for:
      - file_content_reads
      - file_content_writes
      - permission_bypass
      - config_self_grant_without_approval

  python:
    allowed: false
    reason: "Python is not part of the portable @sys agent substrate."

  deno_eval:
    allowed_for:
      - pure_ephemeral_computation
      - deterministic_text_or_data_transforms_without_filesystem_access
    forbidden_for:
      - reading_files
      - writing_files
      - bypassing_denied_standard_tools
      - broad_permission_runs

  permission_expansion:
    requires_explicit_user_approval: true
    require_smallest_grant: true
    require_restart_after_config_change: true
    if_config_unwritable: "present exact diff and ask the human to apply it"

  enforcement_future:
    candidates:
      - remote_deno_sandbox
      - constrained_command_broker
      - just_bash_style_bash_subset
      - local_tool_gateway_with_audit_log
```

## README note for later pass
When the README security posture is edited, mention that the system is designed to target several runtime futures, including a remote `Deno Sandbox`.

Suggested wording:

> Agent IO hardening is defense-in-depth, not a complete local security boundary while raw bash remains available. The intended enforcement path is a constrained command broker and/or remote runtime substrates such as a `Deno Sandbox`, where Deno permissions and tool policy can become mechanical rather than merely behavioral.

## Design constraints
1. The YAML must describe policy; enforcement may arrive in separate runtime/tooling work.
2. The policy must be truthfully weaker than a real sandbox until a broker/remote runtime enforces it.
3. Bash remains powerful for legitimate operation, but not for bypassing protected read/write scope.
4. Python remains disallowed for agent helper work to avoid ambient runtime dependency.
5. Deno remains the preferred ephemeral runtime, but only within the same IO authority rule.
6. Permission expansion must be explicit, minimal, visible, and restart-bound.

## Implementation phases

### Phase 1: Locate owner
- Identify the correct config owner for default agent policy.
- Decide whether this belongs beside the default sys prompt, agent runtime config, or a shared policy package.
- Avoid duplicate policy definitions.

### Phase 2: Schema and docs
- Define the minimal YAML shape.
- Document semantics for each field.
- Keep names stable and operator-readable.

### Phase 3: Runtime surfacing
- Print or expose active policy in agent startup/debug output.
- Ensure the user can see whether `strict-io` is active.
- Keep this honest: visible policy is not yet enforcement.

### Phase 4: Enforcement adapter
- Add command-broker/runtime checks that deny disallowed bash/Python/Deno-eval paths.
- Prefer allowlisted operation classes over fragile command string parsing.
- Preserve audit logs for denied attempts and approval flows.

### Phase 5: Remote sandbox path
- Map the same policy onto remote execution, including a remote `Deno Sandbox` target.
- Treat remote enforcement as the S-tier security posture, with local prompt rules as defense-in-depth.

## Acceptance criteria
- A human can inspect one YAML surface and understand the IO contract.
- The policy does not overclaim enforcement.
- Prompt rules, README security posture, and runtime behavior tell the same story.
- Future command broker / remote sandbox work has a concrete policy target to implement.
