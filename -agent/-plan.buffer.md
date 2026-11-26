# DOCS/WRITING 
Review this documentation against canon with Tuftean restraint and Pirsig’s standard of Quality: durable usefulness, not surface polish.
Are the claims accurate and earned? Does it convey purpose, boundaries, choices, and consequences—not merely narrate implementation? Can humans and agents quickly understand what matters and act correctly?
Verify claims against source. Flag misleading promises, missing context, repetition, and misplaced detail. Preserve essential caveats. Seek the fewest words that remain genuinely helpful—not brevity at the expense of understanding.
Give an honest verdict and prioritized, concrete findings. Review only; no edits.


@sys.cli
keyboard-delivery.plan.md
- [ ] test(cli): pin buffered keyboard delivery without a wake-up key
- [ ] fix(driver-vite): use managed keyboard input for dev shortcuts

@sys.ui-components
event-view.plan.md
- [ ] chore(ui-components): scaffold EventViewer with the @sys/tmpl UI template
- [ ] refactor(passkey): retain callback occurrences in the pure specimen
- [ ] feat(ui-components): render supplied events with count and list modes
- [ ] feat(passkey): use EventViewer in the Action callbacks readout



@sys.ui
passkey-panel.plan.md
- [x] 08ccc7e82 feat(ui): add passkey diagnostic UI baseline
- [x] 1e48de614 style(ui): refine passkey debug panel labels and intent spacing
- [x] 429560650 chore(ui): scaffold passkey integration spec and view navigation
- [x] bc242cbd3 [link-grammar.plan.md](../@sys.ui-components/link-grammar.plan.md)
- [x] b3659c530 feat(ui): expose composable passkey diagnostic sections
- [x] 5bb4c79dc feat(ui): compose passkey UI in integration specimen
- [x] 8ba1a4939 feat(passkey): add UI-independent WebAuthn ceremonies
- [x] c7e4d6686 feat(passkey): define account service contracts
- [x] aba8774ff feat(http)!: bound unary HttpCmd transport
- [x] ef977e043 chore(deps): add SimpleWebAuthn server 14.1.0
- [x] 06258c98c feat(crypto): add strict Ed25519 public-key validation
- [x] 97fc01381 feat(passkey): add minimal reference account service
- [x] 993d964f4 feat(passkey): add reusable account runtime
- [x] be9dc5bf3 feat(http): add exact method-and-path proxy routes
- [x] 11a8ab2c5 fix(http): invoke native fetch correctly in HttpCmd
- [x] ce2317f14 test(http): prove the default HttpCmd echo in a real browser
- [x] acfcefa49 feat(net): add a pure fixed TCP port predicate
- [x] 527befe6a feat(ui): serve the passkey account endpoint in the sample Cell
- [x] [service-start-order.plan.md](../@sys.cell/service-start-order.plan.md)
- [x] 229253586 feat(http): optionally strip Authorization from root proxy requests
- [x] 498918d2d feat(tools): support strict listener ports in Serve config
- [x] d4095d734 feat(ui): route the sample Cell through one browser origin
- [x] 6ca169135 feat(ui): connect real passkey operations in sample
- [x] ceeb3af68 chore(deps): expose the react-icons/gr subpath
- [x] 5d1fd43f0 feat(ui-components): forward aria-describedby to action buttons
- [x] 52c72957c test(ui): distinguish values from identity in passkey assertions
- [x] bc9f249b8 feat(ui): clarify registration guidance and diagnostics in the passkey sample
- [x] [markdown-admonition-panel.plan.md](../@sys.ui-components/markdown-admonition-panel.plan.md)
- [x] de36c11d3 fix(ui): use the compact accent button for Create Passkey
- [x] f6b1ebd41 fix(ui): keep passkey action focus rings visible at the panel edge
- [x] badd5cb7a fix(ui): shorten the passkey reference sample heading
- [x] 01b9e69eb refactor(ui): unify passkey action row order and emphasis
- [x] fcdf571b8 refactor(ui): simplify passkey panel layout and specimen presentation
- [x] 5bb675e11 feat(ui): show live passkey context in the integration sidebar
- [x] c48d4a6fa refactor(passkey): render live context inside the integration debug panel
- [x] 9f55b108b feat(passkey): expose in-memory account service counts via Cmd
- [x] 78cbfa562 refactor(passkey): clarify AccountRuntime state and action contracts
- [x] de0beb0d5 refactor(passkey): group account runtime and service module paths
- [x] a3999580e refactor(passkey): rename runtime and service Options to CreateOptions
- [ ] refactor(passkey): expose the host-owned panel controller through ui.controller
- [ ] refactor(passkey): expose service counts through runtime.info
- [ ] feat(ui): show account service counts below passkey Context
- [ ] refactor(passkey): pass live context to Debug without an account handle
- [ ] test(passkey): reduce specimen coverage to host-owned behavior


@sys.tmpl
ui-template-maintenance.plan.md
- [x] 1d532c559 fix(std): close signal listener registration on disposal
- [x] 19dc218dd fix(ui-dev): retire specimen attachments before reset publication
- [x] e608035ff fix(ui-dev): close specimen admission during retirement
- [x] fa683998e feat(ui-dev): own specimen attachment lifetimes
- [x] 519b15ea8 fix(tmpl): correct UI scaffold lifecycle ownership
- [x] 41db307d7 feat(ui-react): register stylesheet rules from React
- [x] 917bd0922 fix(tmpl): preserve scoped-style appearance across themes
- [x] 55d4cea12 fix(ui-components): isolate matching scoped styles without changing paint
- [x] 1035f21b7 fix(ui-components): bind Label and Manuscript specimen effects to attachments
- [x] f2a31856b fix(ui-components): bind ActionProbe specimen effects to attachments
- [x] cf117701f fix(ui-components): bind Anchor specimen effects to attachments
- [x] 6d4d9c028 fix(ui-components): bind Bullet and BulletList specimen effects to attachments
- [x] 0f0c14660 fix(ui-components): bind Button family specimen effects to attachments
- [x] bb8f0d129 fix(ui-components): bind Dist and Dist.Browser specimen effects to attachments
- [x] c9b7087de fix(ui-components): bind Chip and Cropmarks specimen effects to attachments
- [x] 15fcd8581 fix(ui-components): bind ErrorBoundary, FadeElement, and Http.Origin specimen effects to attachments
- [x] f7759fb0a fix(ui-components): bind Icon.Swatches, IFrame, and Image.Svg specimen effects to attachments
- [x] 9248652e4 fix(ui-components): bind KeyValue family and Layout.CenterColumn specimen effects to attachments
- [x] 59fae6f31 fix(ui-components): bind RectGrid, SplitPane, Tabs, and TreeHost specimen effects to attachments
- [x] df33406f9 fix(ui-components): bind AudioWaveform and Media.Config specimen effects to attachments
- [x] 7f75f600b fix(ui-components): bind Media.Devices and Media.Recorder specimen effects to attachments
- [x] 78740e2bb fix(ui-components): bind PlaybackDriver and Media.Video specimen effects to attachments
- [x] 13c6bf5de fix(ui-components): bind ObjectView, Ownership, PathView, and video controls specimen effects to attachments
- [x] fa15c1d1f fix(ui-components): bind video deck and element specimen effects to attachments
- [x] 7cfb33b13 fix(ui-components): bind YouTube, Preload, and Prose specimen effects to attachments
- [x] 358cdb877 fix(ui-components): bind Sheet, Slider, Spinners.Bar, and Splash specimen effects to attachments
- [x] c77a41ccb fix(ui-components): bind Text.Ellipsize and Text.Input specimen effects to attachments
- [x] 32af16902 fix(ui-components): bind tree, Vimeo, and Markdown help specimen effects to attachments
- [x] 4c5e626b4 fix(ui-components): bind webfont and CSS specimen effects to attachments
- [x] 6039ece20 fix(ui-components): bind pointer, size observer, and schedule specimen effects to attachments
- [ ] docs(tmpl): inventory UI specimen lifecycle follow-ons across other sys packages
- [ ] fix(ui): bind Files.InfoPanel specimen effects to attachments
- [ ] fix(ui): bind Files.InfoPanel.Config specimen effects to attachments
- [ ] fix(ui-dev): retire the MySample keyboard subscription with its attachment
- [ ] docs(tmpl): inventory UI specimen lifecycle follow-ons across driver packages




@sys
deno-api-containment.plan.md
- [x] 5d789e432 docs(sys): map Deno capability owners and public facades
- [x] b328700ab docs(sys): checkpoint direct Deno usage audit
- [ ] docs(sys): audit direct Deno usage across the repository
- [ ] docs(sys): design capability-sized Deno containment migrations



@sys.tmpl
workspace-authority-discovery.plan.md
- [ ] perf(tmpl): bound local workspace authority discovery to authored inputs



1. workspace-ci-closeout.plan.md
2. workspace-chunking-and-ui-components-bundle.plan.md
3. html-subresource-integrity.plan.md
4. r2-public-delivery.plan.md


@sys.workspace
workspace-ci-closeout.plan.md
- [x] 93dc483cc fix(workspace): skip implicit publish dry runs for private packages
- [x] ec7925589 chore(tmpl): refresh repository template dependency snapshots
- [x] f2a6c3bfb fix(sample.r2): finish delivery presentation without custom asset sources
- [x] f50801189 style(tools): format Dist preview parity assertions
- [x] 7c0a98d8b feat(testing): add scoped temporary-directory helper
- [x] b27b10169 refactor(testing): organize server testing utilities and tests
- [x] 7bd81cdf8 refactor(testing): establish semantic ownership of server helper contracts




@sys.fs
dist-metadata.plan.md
- [ ] [dist-content-identity.plan.md](./dist-content-identity.plan.md)
- [ ] refactor(dist)!: move descriptive metadata into optional .meta

@sample.r2
private-image-delivery.plan.md
- [x] 8498fb608 feat(sample.r2): demonstrate private R2 image delivery



@sys.driver-vite
preview-startup-failure.plan.md
- [ ] fix(net): bound port selection and preserve probe refusal
- [ ] fix(driver-vite): report occupied preview ports with checked retry hints



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
- [x] 9537de5ee fix(tools): contain build coordination in source-owned dev state
- [ ] chore(deploy): isolate the fs.db.team development workflow

@sys.driver-crdt
cmd-first-kernels.plan.md
- [x] 7b0f48ff3 test(driver-crdt): establish isolated native and immutable contract fixtures
- [x] f24076d6c test(driver-crdt): compare async-owner and native-replica mutation paths
- [ ] test(driver-crdt): prove editor reconciliation and boundary failure behavior
- [ ] docs(driver-crdt): specify draft-one contracts from topology evidence



