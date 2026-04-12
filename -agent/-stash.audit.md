## Stash checkpoint

```yaml
status: stashed
repo: sys
repo_url: https://github.com/sys-repo/sys.git
worktree: /Users/phil/code/org.sys/sys
subject: checkpoint(cli.deploy): deno integration smoke-proven before final driver reporting cleanup
note: ./-agent/stashes/checkpoint.cli.deploy-deno-integration-smoke-proven-before-final-driver-reporting-cleanup.md
branch: phil-work
stash: stash@{0}
created_at: 2026-03-30T20:58:00+13:00
summary:
  - Deno cli.deploy stage -> push is smoke-proven end-to-end against real Deno Deploy.
  - Staged Deno roots now carry a truthful root dist.json for generic staged hash/reporting.
  - Driver and cli deploy failure reporting/log enrichment is mid-landing.
next:
  - Tighten driver-deno missing-app reporting from logs-enriched failure truth.
  - Finish the remaining deno push/stage output cleanup without reopening the core integration seam.
resume:
  - git switch phil-work
  - git stash apply stash@{0}
```

## Stash checkpoint

```yaml
status: stashed
repo: sys
repo_url: https://github.com/sys-repo/sys.git
worktree: /Users/phil/code/org.sys/sys
subject: checkpoint(driver-agent.pi): typed session policy tightened before tomorrow review
note: ./-agent/stashes/checkpoint.driver-agent.pi-typed-session-policy-tightened-before-tomorrow-review.md
branch: phil-work
stash: stash@{0}
created_at: 2026-04-12T18:18:27+12:00
summary:
  - Pi profile session policy is now typed, with persistent modes requiring explicit project storage.
  - Project session locality now resolves from the nearest ancestor deps.yaml instead of raw cwd.
  - Profile passthrough session flags are blocked so durable startup policy stays owned by the profile layer.
next:
  - Re-review the deps.yaml-root choice and the raw Cli.run escape hatch with a fresh head.
  - Decide whether the pi.NOTES.md edit belongs in this same change or should be split.
resume:
  - git switch phil-work
  - git stash apply stash@{0}
```
