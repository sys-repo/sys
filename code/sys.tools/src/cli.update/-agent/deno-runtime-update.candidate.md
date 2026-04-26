# Deno runtime update candidate

Status: candidate only. Not opened for implementation.

## Design essence
If `sys update` later gains a Deno runtime action, keep ownership in the `@sys/tools/update` product seam.
Do **not** start by widening `@sys/driver-deno`.

## Why
`@sys/tools/update` already owns:
- explicit update UX
- prompts
- process execution
- user-facing maintenance flow

A Deno runtime action is first a product-flow concern, not a driver concern.

## Earned UI rule
Keep the current single-action update flow while `@sys/tools` is the only real update action.
Only move to a checkbox selection flow once there are **2+** legitimate independent update actions.

Example future shape:
- `[x] @sys/tools`
- `[ ] Deno runtime`
- then confirm with `Run` / `(exit)`

## Scope if opened later
In scope:
- explicit `sys update` flow only
- add a Deno runtime action beside `@sys/tools`
- use `deno upgrade --dry-run` for explicit status/probe if needed
- use `deno upgrade` for execution
- keep non-interactive semantics explicit and conservative

Out of scope:
- cached Deno advisory
- root-menu Deno notice
- background Deno monitoring
- custom network fetch for latest Deno version
- widening `@sys/driver-deno` unless a tiny low-level helper is clearly earned later

## Doctrine
Delegate Deno runtime update truth to the `deno` executable itself.
Avoid inventing a parallel Deno-version authority inside `@sys/tools`.

## Current posture
Good future packet.
Not a late add-on.
Not opened now.
