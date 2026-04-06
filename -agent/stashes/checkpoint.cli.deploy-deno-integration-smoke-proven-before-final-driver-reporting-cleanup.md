# checkpoint(cli.deploy): deno integration smoke-proven before final driver reporting cleanup

## State

- Deno `cli.deploy` stage -> push is smoke-proven end-to-end against real Deno Deploy.
- The integration is salvageable and working; remaining problems are now mainly reporting and final UX cleanup.
- Current checkpoint identity matches:
  - stash message
  - audit `subject`
  - this handoff note title

## Proven

- Deno config surface is now singular `mapping`, not Orbiter `mappings`.
- Deno stage and push share one staged artifact root.
- Sidecar persists the staged metadata needed for later push.
- `workspaceTarget` was added because staged target layout could not be truthfully reconstructed later from source workspace paths.
- Deno staged roots now compute a truthful root `dist.json`, which removes the fake `#00000` fallback for staged hash/reporting.
- Real deploy through `@sys/tools` succeeded.

## Remaining

- Missing-app reporting is still weak when raw Deno Deploy failure collapses to `An error occurred:`.
- Driver-level logs enrichment now exists as the right seam for better failure reporting.
- A pure `driver-deno` missing-app recovery/reporting pass is still worth doing so the driver happy path and `cli.deploy` path tell the same truth.

## Key Files

- `code/sys.tools/src/cli.deploy/u.providers/provider.deno/u.stage.ts`
- `code/sys.tools/src/cli.deploy/u.providers/provider.deno/u.push.ts`
- `code/sys.tools/src/cli.deploy/u.providers/provider.deno/u.sidecar.ts`
- `code/sys.driver/driver-deno/src/m.cloud/m.DenoDeploy/m.pipeline/u.prepare.ts`
- `code/sys.driver/driver-deno/src/m.cloud/m.DenoDeploy/m.stage/u.executeStage.ts`
- `code/sys.driver/driver-deno/src/m.cloud/m.DenoDeploy/m.deploy/u.logs.ts`
- `code/sys.driver/driver-deno/src/m.cloud/m.DenoDeploy/m.fmt/u.info.ts`

## Next

- Tighten `driver-deno` missing-app classification from logs-enriched failure truth.
- Decide whether missing-app create/retry should live fully in the driver staged pipeline as the canonical behavior.
- Finish the last Deno stage/push output cleanup only after the driver failure semantics are solid.

## Resume

```bash
git switch phil-work
git stash apply stash@{0}
```
