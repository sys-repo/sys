---
name: upgrade-deps
description: Run `deno outdated` at the repo root, present the outdated dependency table for human selection, then update `deps.yaml` and run `deno task prep`; do not use ad hoc upgrade logic or direct `deno update` mutation as the primary workflow.
---
