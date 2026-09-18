@sys.tools
r2-files-delivery.plan.md
- [x] GATE owner authorizes one bounded R2 upload and authenticated readback
- [x] efdd7cdde docs(deploy): record Files-backed R2 upload and readback


@sys.driver.cloudflare
r2-web-exposure.plan.md
- [x] 07a0a8028 chore(tmpl:pkg): scaffold @sys/web package
- [x] [r2-files-delivery.plan.md](../@sys.tools/r2-files-delivery.plan.md)
- [x] 12167cd70 feat(driver-cloudflare): expose presigned object reads
- [x] a54a39f98 feat(driver-cloudflare): add R2-backed application read routes
- [x] e242fbce4 feat(driver-cloudflare): add self-contained R2 deployment sample
- [x] db0e67864 docs(driver-cloudflare): clarify R2 sample workflow
- [x] e2e0afd44 feat(driver-cloudflare): add explicit sample routes and root redirect
- [x] 9f062ede0 refactor(driver-cloudflare): group sample application helpers
- [x] 6153361a0 refactor(driver-cloudflare): normalize sample app module layout
- [x] 3bb85eb9f chore(driver-cloudflare): remove unused sample staging task
- [x] d5248f6fa style(driver-cloudflare): separate sample explanation lines
- [x] 920158a72 style(driver-cloudflare): separate sample explanation lines
- [x] GATE owner authorizes local application proof against selected live R2 objects
- [x] 54afcb4a4 test(driver-cloudflare): add pinned local delivery probe
- [x] 204fca7d9 refactor(exports)!: standardize package type entrypoints on /t
- [x] 867add7c5 fix(tools): compare R2 manifest identity before skipping publication
- [x] e01433a26 docs(driver-cloudflare): describe the local proof task
- [x] 4f72461bb style(driver-cloudflare): clarify build checksum output
- [x] 4f5ebb73a feat(cli): add fitted label-value pair rendering
- [x] 35be4e1b0 feat(driver-cloudflare): add push progress and consolidate script helpers
- [x] 20e0464b7 feat(driver-cloudflare): clarify sample UI and show same-origin fetches
- [x] 43799c643 feat(http): support cell-aware startup detail presentation
- [x] 1a3667ffc refactor(http): separate startup presentation and file-serving helpers
- [x] 7c9fecaa5 refactor(driver-cloudflare): centralize sample build selection
- [x] 0169c2c20 feat(pkg): add canonical Dist pin contracts
- [x] 73c59650d refactor(driver-cloudflare): bootstrap sample routes from a pinned manifest
- [x] e210dc608 test(driver-cloudflare): verify local R2 application delivery
- [ ] GATE owner authorizes the first R2-backed app hostname and bounded deployment/exposure operations
- [ ] test(driver-cloudflare): verify hosted R2 application delivery


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

@sys
type-export-path-cleanup.plan.md
- [ ] GATE sys.canon owner adopts the /t-only package type export policy
- [ ] refactor(exports)!: standardize package type entrypoints on /t

jsr-readme-quality.plan.md
- [ ] docs(jsr): correct foundational README contracts
- [ ] docs(jsr): correct adapter and application README contracts
- [ ] docs(jsr): orient platform package README surfaces
- [ ] docs(jsr): orient UI and model README surfaces
- [ ] docs(jsr): reduce package README reference sprawl
- [ ] docs(jsr): polish package README residue

