DOCS/WRITING 
Review this documentation against canon with Tuftean restraint and Pirsig’s standard of Quality: durable usefulness, not surface polish.

Are the claims accurate and earned? Does it convey purpose, boundaries, choices, and consequences—not merely narrate implementation? Can humans and agents quickly
understand what matters and act correctly?

Verify claims against source. Flag misleading promises, missing context, repetition, and misplaced detail. Preserve essential caveats. Seek the fewest words that
remain genuinely helpful—not brevity at the expense of understanding.

Give an honest verdict and prioritized, concrete findings. Review only; no edits.

---------------------------------------------------------------------------------------------------------




@sys.fs
dist-content-identity.plan.md
- [x] e6316e80b fix(driver-signer): preserve own keys in canonical Dist documents
- [x] 872b5a34d fix(crypto): preserve every selected key in composite hash builders
- [x] 6c15b0942 feat(dist)!: define canonical content identity and pin contracts
- [x] a1c9a6939 feat(fs)!: establish canonical Dist production and verification
- [x] d95a79372 fix(fs): preserve narrow Dist verification dependencies
- [x] 640f81a75 feat(server)!: serve and materialize canonical Dist evidence
- [x] 29d108d70 feat(tools)!: preserve canonical Dist staging and publication ownership
- [x] 103b61db8 feat(tools)!: consume canonical Dist pins in pull and serve
- [x] 1ff973510 feat(dist)!: migrate build and snapshot producers to canonical pins
- [x] 65cc8ef7e feat(cell)!: configure Dist services with canonical content pins
- [x] ae6151a1b feat(driver-pi)!: admit GUI packages through canonical Dist content
- [x] c64c8bf77 feat(cloudflare)!: admit R2 distributions using canonical content pins
- [x] e9baa2857 fix(std): preserve native separators in path containment
- [x] 60cd6377b fix(http): reject sibling-prefix static path escapes
- [x] 9ce529fe5 feat(dist)!: align observations and signing fixtures with canonical manifests
- [x] 7c8c28cda chore(ui): add frozen cache-only check tasks
- [x] 6372151e2 docs(dist)!: clarify signing and observation boundaries
- [ ] fix(driver-vite): honor immediate-child dependency policy
- [ ] fix(driver-vite): align frozen fixtures and preserve build failure causes
- [ ] refactor(dist): consolidate inventory accounting without merging authority
- [ ] test(dist): prove canonical build projection and serving composition
- [ ] test(driver-pi): prove canonical Dist isolation across real previews

@sys.fs
dist-metadata.plan.md
- [ ] [dist-content-identity.plan.md](./dist-content-identity.plan.md)
- [ ] refactor(dist)!: move descriptive metadata into optional .meta



@sys.driver-vite
html-subresource-integrity.plan.md
- [x] d449229f6 feat(crypto): add Base64 digest output to Hash
- [x] e29b7c596 feat(driver-vite): add opt-in integrity for HTML-linked assets
- [x] 2ea133e7c feat(driver-cloudflare): compare image asset paths in the R2 sample
- [ ] feat(driver-cloudflare): enable subresource integrity in the R2 sample



@sys.driver-pi
upstream-runtime-compatibility.plan.md
- [x] test(driver-pi): verify upstream CLI compatibility in isolation
- [x] fix(driver-pi): preserve Pi child exit status
- [ ] fix(driver-pi): adopt current Pi with verified Deno compatibility

pi-compile-cache-pr.plan.md
- [ ] fix(coding-agent): make compile cache initialization optional
- [ ] GATE Pi maintainers approve contributor PR submission
- [ ] GATE Human approves final PR wording and submission





@sys.driver-cloudflare
r2-delivery-extraction.plan.md
- [x] ff24c6d98 refactor(pkg): extract verified Dist projections and shared selection
- [x] df5f3c67e refactor(driver-cloudflare): adopt shared Dist projections and pins in the sample
- [x] 626c8c5ce test(driver-cloudflare): right-size R2 sample coverage
- [x] 1cac22d67 fix(driver-vite): pass captured build base to the Vite child
- [x] 9c569c13e refactor(driver-cloudflare): construct read routes from pinned Dist manifests
- [x] cc074d82a refactor(driver-cloudflare): move ReadRoute helpers into u/
- [x] a1e8be68d refactor(tools): expose safe Deploy failure diagnostics
- [x] 652d1daa7 fix(http): settle server shutdown and completion failures together
- [x] b3f14a5ee refactor(driver-cloudflare): reduce the R2 sample to policy and library calls


@sys.driver-cloudflare
r2-public-delivery.plan.md
- [x] bb6fad039 feat(tools): admit captured endpoint inputs for Deploy.push
- [x] bc0d8e416 refactor(driver-cloudflare): remove temporary sample push configuration
- [x] GATE Phil confirms the public/private R2 targets, public HTTPS asset base, and owned prefix
- [x] 0deb22c3c docs(driver-cloudflare): simplify R2 sample setup and verification
- [x] e8a88471a feat(yaml): add non-empty env resolution and unavailable-ref metadata
- [x] 2889d1e89 feat(event): transport explicitly exposed command diagnostics
- [x] fd417a579 refactor(event): organize command implementation by file role
- [x] ccaf213fd refactor(event): separate command client orchestration from adapters
- [x] 3c8f9c38e feat(driver-cloudflare): demonstrate public Vite assets with private R2 shell delivery
- [x] [r2-delivery-extraction.plan.md](r2-delivery-extraction.plan.md)
- [ ] feat(driver-cloudflare): integrate the template service worker with mixed R2 delivery



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
- [ ] [r2-public-delivery.plan.md](../@sys.driver-cloudflare/r2-public-delivery.plan.md)
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


@sys.tools
deploy-state-containment.plan.md
- [x] fix(tools): contain build coordination in source-owned dev state
- [ ] chore(deploy): isolate the fs.db.team development workflow


@sys.driver-crdt
cmd-first-kernels.plan.md
- [x] test(driver-crdt): establish isolated native and immutable contract fixtures
- [ ] test(driver-crdt): compare async-owner and native-replica mutation paths
- [ ] test(driver-crdt): prove editor reconciliation and boundary failure behavior
- [ ] docs(driver-crdt): specify draft-one contracts from topology evidence

@sys.html
html-capability.plan.md
- [x] GATE Human approves the HTML capability design in the actual /sys context
- [ ] chore(html): scaffold the HTML package
- [ ] feat(html): expose HTML parsing contracts
- [ ] refactor(driver-vite): migrate HTML parsing to @sys/html

@sys.driver-vite
workspace-chunking-and-ui-components-bundle.plan.md
- [ ] fix(driver-vite): restore workspace module chunk resolution
- [ ] perf(ui-components): tune bundle composition and loading boundaries


