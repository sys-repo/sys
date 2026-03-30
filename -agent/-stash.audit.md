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
