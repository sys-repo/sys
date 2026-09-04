omakase - お任せ




verified-package-ui-release.plan.md
- [x] 9159b6770 feat(fs): expose leased owned-tree batch removal
- [x] f122a2bef refactor(fs): remove Rooted type alias facade
- [x] 13a913ab8 refactor(fs): group Rooted operations by capability noun
- [x] 23b18c40d refactor(driver-pi): consume leased owned-tree batch removal in GUI reset
- [x] b627146ef feat(server): expose owned pinned Dist generation sessions
- [x] 038e8cd7e Commit: refactor(driver-pi): adopt Server-owned Dist generations
- [x] f710d3aa0 plan(snapshot): direct-gui-release-composition.plan.md
- [ ] [direct-gui-release-composition.plan.md](direct-gui-release-composition.plan.md)

direct-gui-release-composition.plan.md
- [ ] refactor(driver-pi): collapse GUI release orchestration to direct composition






@sys.driver-pi
start-ui-release-evidence.plan.md
- [x] [start-ui.design.md](start-ui.design.md)
- [x] e52d9c0c4 feat(cli): expose narrow keyboard lifecycle entrypoint
- [x] 0741b6f89 fix(std): authenticate Uint8Array identity
- [x] 0b46ec0c0 feat(http): expose constrained file-byte response entrypoint
- [x] 0aa6135ed feat(fs): expose rooted file reads
- [x] 9c931aad2 feat(driver-pi): serve the GUI Dist source on localhost for development
- [x] 28fed0d56 refactor(driver-pi): group GUI preview build scripts under semantic module
- [x] 5fa35e3ce fix(http): bind explicit strict ports without fallback
- [x] e61e0122d feat(fs): expose exact-canonical local Dist reads
- [x] f051ef590 fix(fs): honor throwing file-write failures
- [x] ea3e88eed refactor(http): expose narrow server lifecycle entrypoint
- [x] f4303dd39 refactor(http): expose narrow server host entrypoint
- [x] a96178674 refactor(fs): expose narrow Dist verification entrypoint
- [x] 9ad3d214f feat(server): serve complete local Dist transport
- [x] 361230c35 test(driver-vite): align lifecycle alarm with Vite's Rolldown
- [x] 1e8e200ad fix(driver-vite): restore eager entry runtime imports
- [x] ab4506359 refactor(driver-vite): lazy-load requested command graphs
- [x] 540ef7436 refactor(driver-vite): consolidate lazy command layout
- [x] 515e1a1b5 refactor(driver-pi): remove duplicate GUI source server
- [x] 46a1002e5 refactor(fs): remove unused Rooted read surface
- [x] 439552356 fix(driver-pi): remove sealed GUI release stores during reset
- [x] 6c8ab9dbd refactor(std): strengthen Schedule turn contracts
- [x] 0c81ffaec refactor(server): replace lifecycle turn wrappers with Schedule
- [x] 2be183a8e refactor(server): separate BootstrapStatus lifecycle contracts
- [x] 1f4ccb176 feat(driver-pi): generate and prove local GUI release evidence
- [x] c099fb1f3 [finite-chrome-process-authority.plan.md](../@sys.testing/finite-chrome-process-authority.plan.md)
- [x] 77c2d0c2e refactor(driver-pi): name local GUI evidence binding explicitly
- [x] 5d7100d2f chore(driver-pi): bind rebuilt local GUI evidence
- [x] ea94fc46e feat(driver-pi): suggest commit after local GUI evidence binding
- [x] 015d9d4d5 refactor(http)!: rename checksum observation to received
- [x] 74d38afa3 feat(server): retain manifest checksum mismatch evidence
- [x] f7cdab9a3 feat(driver-pi): render manifest checksum mismatch diagnostics
- [x] 4ffeb0c24 fix(driver-pi): clarify local GUI evidence output
- [x] 43fb7b4cb chore(driver-pi): complete local GUI development task grammar
- [x] cb97b731b chore(driver-pi): bind rebuilt local GUI evidence
- [x] 70c17a78e chore(driver-pi): bind rebuilt local GUI evidence
- [x] a16b8ad41 fix(driver-pi): polish local GUI rehearsal label
- [x] 6795c1773 chore(driver-pi): bind rebuilt local GUI evidence
- [x] 6df696908 fix(driver-pi): link local GUI manifest digest
- [x] 72c8d412c feat(crypto): format linked digest references
- [x] fe66d2588 fix(driver-pi): display verified Dist digest in GUI status
- [x] 1d5e25ff3 fix(driver-pi): link verified Dist directory
- [x] ab3dc43a0 fix(driver-pi): render actionable busy reset refusal
- [x] 0b36818a4 fix(cli): let handled keys stop keyboard bindings
- [x] 5760c29a4 chore(driver-pi): bind rebuilt local GUI evidence
- [x] 82b510a0f fix(driver-pi): make start:gui back reopen profile menu
- [x] b0ef3401c chore(driver-pi): bind rebuilt local GUI evidence
- [ ] fix(server): bind pinned Dist hosts to one absolute root
- [ ] plan(snapshot): verified-package-ui-release.plan.md
- [ ] GATE release owner selects immutable artifact provider/path, public HTTPS proof origin, browser/filesystem floors, and prior-local-worker migration
- [ ] feat(driver-pi): bind published GUI Dist evidence for release







r2-dist-generation-publication.plan.md
- [ ] GATE official Cloudflare sources prove required conditional R2 semantics
- [ ] test(driver-cloudflare): add an opt-in conditional R2 settlement proof
- [ ] GATE authorized disposable-bucket conditional R2 proof passes
- [ ] feat(driver-cloudflare): expose conditional R2 object writes
- [ ] feat(tools): publish exact verified R2 Dist generations
- [ ] feat(tools): activate R2 Dist generations with guarded settlement
- [ ] test(tools): prove R2 generation publication failure worlds
- [ ] docs(deploy): reconcile generation-qualified R2 exposure



# Maintenance ----------------------------------------------------------------------



@sys.workspace
native-windows-ci-baseline.plan.md
- [x] ce5d1be24 refactor(workspace): name Linux test workflow explicitly
- [x] 20eb0e570 feat(workspace): generate native Windows test workflows
- [x] 27b6cb5fa test(ci): clear native Windows admission blockers
- [ ] test(ci): establish native Windows proof with @sys/std

@sys.std
obj-deep-freeze.plan.md
- [x] 69a00d48f fix(types): preserve DeepReadonly tuple structure
- [x] 80ede9a0b feat(std): add typed deep-freeze primitive
- [ ] refactor(fs): use Obj deep freeze for admitted manifests
- [ ] refactor(driver-pi): adopt Obj deep freeze in GUI reset data


@sys.archive
zip.plan.md
- [x] e3cd77745 chore(archive): establish minimal package baseline
- [x] ebca1f132 feat(zip): add strict bounded ZIP32 inspection and integrity
- [x] a121f91d6 test(zip): prove direct Fs snapshot interoperability
- [x] 3ca35dc7c fix(zip): enforce cancellation fan-in bounds
- [x] 6b2098dbd feat(fs): add bounded stable file snapshots
- [x] c88540147 docs(fs): clarify stable snapshot evidence and limits
- [ ] feat(driver-pi): expose bounded ZIP inspection and integrity tools
- [ ] GATE human accepts the cooperative-filesystem ZIP extraction threat model
- [ ] feat(fs): add owned streaming tree construction to Rooted stages
- [ ] feat(zip): add bounded ZIP extraction through a tree sink
- [ ] feat(driver-pi): expose ZIP extraction under a cooperative-filesystem contract
