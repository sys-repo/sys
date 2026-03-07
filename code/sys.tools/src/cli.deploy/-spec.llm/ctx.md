# cli.deploy — Mental Model

Staging builds a deployable filesystem tree based on mappings.
Push resolves targets from staged outputs, then deploys each target via provider.

Flow:
- Stage: `u.staging` executes mappings (copy/build/index) into `staging.dir`.
- Resolve: `u.resolvePushTargets` inspects mappings + provider shards to produce targets.
  - `mode: index` → root target (index staging dir) if present.
  - `<shard>` mappings → shard targets when `provider.shards.siteIds` exist.
- Push: `u.push` dispatches to provider with each target’s staging dir.

Notes:
- `index` is a generic staging primitive; shard behavior is target resolution only.
- Root target uses base provider; shard targets override `siteId` + domain.
