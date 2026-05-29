# Deno runtime vs `@sys/tools` upgrade

This note preserves the self-maintenance boundary for `@sys/tools upgrade`.

## Contract
- `@sys/tools upgrade` upgrades the locally cached `@sys/tools` package.
- It must not upgrade the Deno runtime.
- The implementation command is `deno cache --reload jsr:@sys/tools`.
- Keep the implementation helper named `refreshCache`; that is the exact operation.

## Naming
- Public command: `upgrade`.
- Only short alias: `up`.
- Do not restore retired long-form or extra aliases.
- Advisory copy, flags, env vars, and tests should use upgrade terminology:
  - `--no-upgrade-check`
  - `SYS_TOOLS_NO_UPGRADE_CHECK`
  - `sys upgrade --latest`

## Review guard
If a future change invokes `deno upgrade`, it has crossed into Deno runtime maintenance and should be rejected unless that is the explicit feature under review.
