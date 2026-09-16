@sys.tools
r2-files-delivery.plan.md
- [x] GATE owner authorizes one bounded R2 upload and authenticated readback
- [x] efdd7cdde docs(deploy): record Files-backed R2 upload and readback


@sys.driver.cloudflare
r2-web-exposure.plan.md
- [x] 07a0a8028 chore(tmpl:pkg): scaffold @sys/web package
- [x] [r2-files-delivery.plan.md](../@sys.tools/r2-files-delivery.plan.md)
- [ ] feat(driver-cloudflare): expose presigned object reads
- [ ] feat(driver-cloudflare): add R2-backed application read routes
- [ ] feat(deploy): compose a Deno-hosted R2 application
- [ ] GATE owner authorizes local application proof against selected live R2 objects
- [ ] docs(plan): record local R2 application proof
- [ ] GATE owner authorizes the first R2-backed app hostname and bounded deployment/exposure operations
- [ ] docs(plan): record first R2 web exposure proof


@sys.driver.cloudflare
r2-files-enumeration-bounds.plan.md
- [x] 2d4e9d2ce fix(driver-cloudflare): bound R2 Files enumeration work


@sys.driver-pi
start-ui-release-evidence.plan.md
  ...
- [x] c39511c15 [verified-package-ui-release.plan.md](verified-package-ui-release.plan.md)
- [ ] GATE release owner selects versioned artifact provider/path, public HTTPS proof origin, browser/filesystem floors, and prior-local-worker migration
- [x] [r2-files-delivery.plan.md](../@sys.tools/r2-files-delivery.plan.md)
- [ ] [r2-web-exposure.plan.md](../@sys.driver.cloudflare/r2-web-exposure.plan.md)
- [ ] feat(driver-pi): bind published GUI Dist evidence for release


# Maintenance ----------------------------------------------------------------------


@sys.workspace
native-windows-ci-baseline.plan.md
- [x] ce5d1be24 refactor(workspace): name Linux test workflow explicitly
- [x] 20eb0e570 feat(workspace): generate native Windows test workflows
- [x] 27b6cb5fa test(ci): clear native Windows admission blockers
- [ ] test(ci): establish native Windows proof with @sys/std


@sys.cli
system-owned-spinner.plan.md
- [ ] feat(process): expose canonical stderr output
- [ ] fix(driver-vite): stop build feedback before failure output
- [ ] fix(tools): stop daemon feedback before clearing the terminal
- [ ] refactor(cli): replace Ora with an owned spinner runtime
- [ ] chore(deps): remove Ora from the workspace graph


@sys.std
time-canon.plan.md
- [ ] fix(std): settle rejected Schedule queue tasks
- [ ] fix(std): own delayed callback settlement
- [ ] fix(std): terminate failed intervals
- [ ] fix(std): align scoped timers with root lifecycle contracts
- [ ] fix(std): enforce Time polling deadlines and cancellation
- [ ] fix(std): correct Time instant and timer ownership
- [ ] fix(std): normalize duration parsing and validity
- [ ] refactor(std): tighten Time type-plane contracts

