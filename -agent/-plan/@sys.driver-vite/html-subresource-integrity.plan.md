@sys.driver-vite
html-subresource-integrity.plan.md
- [x] d449229f6 feat(crypto): add Base64 digest output to Hash
- [x] e29b7c596 feat(driver-vite): add opt-in integrity for HTML-linked assets
- [x] 2ea133e7c feat(driver-cloudflare): compare image asset paths in the R2 sample
- [x] d83cf2a44 feat(driver-cloudflare): enable subresource integrity in the R2 sample
- [x] 49d43914c feat(driver-vite): add managed HTML integrity for app builds
- [x] 6ca3259dc feat(driver-vite): enable HTML integrity by default for app builds
- [x] 7e20c4949 feat(driver-vite): adopt HTML integrity in templates and eligible apps
- [x] fa1a9a9e9 feat(driver-vite): add integrity to dependency modulepreloads

## Purpose

Make browser-enforced asset integrity the default for `Vite.Config.app` production HTML builds.
Applications inherit that policy; deliberate exceptions use `plugins: { htmlIntegrity: false }`. The
driver owns the machinery, not the sample or a repeated per-package opt-in.

Dependency-only modulepreload links receive SHA-256 SRI through the same build-owned finalization
path as entry scripts and stylesheets. Real-build tests observe the dependency's ordinary static
import under normal timing and after completed preload failure, with original, tampered, and
matching-rehash controls. Preload rejection alone does not prove import enforcement; the recorded
Chromium results establish only the tested loading conditions. This is a bounded native-SRI change,
not a whole-application loading redesign.

## Upstream hashing prerequisite

- Add reusable Base64 digest output to `@sys/crypto`'s existing `Hash` surface. Preserve the current
  hex default, prefix behavior, and input conversion semantics for existing callers.
- Encode the raw digest bytes using standard Base64, not Base64 of hexadecimal text. Keep encoding
  in the crypto primitive; HTML ownership, SRI policy, and browser integration stay in the driver.
- Keep this first commit independently landable: crypto contracts, implementation, and known-vector
  tests only. Land it separately before adopting the capability in the driver and its fixtures.
- Prove unchanged default output and explicit Base64 output with fixed expected vectors, including
  empty input, text, Unicode, and binary input. Do not derive expected vectors through the helper
  under test.
- The driver item replaces its repeated hex-to-bytes-to-Base64 expressions with the shared
  capability. Retain independent written-byte recomputation and real-browser enforcement proof;
  independence does not require duplicating the encoding expression.
- Remove superseded reviewer scratch after its findings have permanent regression coverage. Finish
  driver verification after adoption, then freeze the candidate during independent review.

## Sample image prerequisite

This item is landed. Its implementation and proof details below retain their historical scope;
presentation refinements do not reopen it or establish SRI adoption.

Land the image comparison before sample integrity adoption. The earlier footer used `%BASE_URL%` for
its image and direct-file caption link. This is valid Vite syntax, but the integrity plugin refuses
environment expansion after authored-input validation. Resolve that mismatch through native asset
references, not weaker validation or a sample-owned HTML transformer.

The image item is independently useful: same artwork, two build treatments, one public delivery
path. It owns the PNG copy, native markup, presentation, documentation, and image-specific proof.
Keep integrity opt-in out of this commit; the final sample item owns that integration.

Paths in this section are relative to `code/sys.driver/driver-cloudflare/-sample/deploy/`:

- Preserve `public/images/wax-seal.v1.png` and add a byte-identical `src/ui/images/wax-seal.v1.png`.
  The revision identifies the artwork, not the delivery mode. Tests must pin the accepted bytes and
  reject drift between the copies.
- Reference the source-managed copy as `./images/wax-seal.v1.png?no-inline`. Vite emits
  `pkg/a.[hash].png`; explicit non-inlining prevents PNG bytes entering private HTML even if a
  future export is small.
- Reference the public copy as `/images/wax-seal.v1.png`. Vite preserves its output name and
  rewrites this recognized image attribute using the resolved public base. Do not confuse the
  authored root-relative reference with its emitted absolute public URL.
- Both emitted PNGs belong in `dist.public`; only HTML is a private payload. No image proxy,
  fallback, publication-policy change, separate upload, or new image abstraction is needed.
- Keep both native images outside React's root with explicit 64 by 64 dimensions and meaningful
  alternative text. Show them side by side when space permits and wrap at narrow widths. Captions
  distinguish "Vite-managed image" from "Public file" and show output naming patterns.
- Replace the direct-PNG caption link with explanatory text; retain one public-R2 documentation
  link. Ordinary `a[href]` is not a default Vite asset reference. Do not introduce custom asset
  sources, environment substitutions, or runtime link repair solely for this convenience link.
- Describe the duplicate payload as a deliberate comparison, not a production optimization. The
  footer states the benefit: direct public R2 delivery avoids application-server egress fees for
  image delivery. Storage and request costs are not eliminated. Keep the SRI reference in README,
  not the image footer. Fingerprints, revision names, and seal artwork do not establish
  authenticity, browser integrity checks, cache policy, or retention of older releases.

## Current sample baseline

- Continue from the canonical content-pin migration (`c64c8bf77`) and delivery-presentation
  follow-up (`f2a6c3bfb`), not the earlier image screenshots. Preserve the current
  application-server wording, public-first content table, native image references, and two "Public
  R2 ↗" caption links. Do not restore the old image footer paragraph or add custom HTML asset
  sources.
- Build/projection now uses `Vite.build`'s `pin`, `Pkg.Dist.project`'s `source.pin`, and
  `dist.pins.json` with `sys.dist/v2` content pins. Manifest document checksums remain separate. SRI
  adoption must preserve these contracts, not reintroduce the legacy manifest-integrity API.
- Workspace dependencies now declare Vite 8.3.2. The recorded Vite 8.3.0 proof is historical; record
  the toolchain actually exercised by fresh verification rather than assuming compatibility.

## Initial HTML-resource contract and ownership (historical)

- `@sys/driver-vite` owns one no-options plugin factory on its existing `/plugins` surface. The
  landed sample composes it through `Vite.Config.app`'s `vitePlugins`; preparatory managed app
  composition retains default-off behavior and the direct factory. The default-on follow-on changes
  omission semantics. No second switch in `Vite.build` or algorithm selector.
- Apply only to production client HTML builds. The app default becomes on; development and worker
  plugin factories remain unchanged. Generic Vite configurations without the factory remain outside
  this default. Reject known unsupported output rather than automatically disabling integrity.
- Generate SHA-256 SRI from finalized emitted JavaScript and CSS, then add `integrity` to their
  module-script and stylesheet tags in generated HTML. Complete HTML changes before `dist.json`.
- Reuse the upstream `Hash` Base64 digest capability for production and fixture calculations. SRI
  requires `sha256-` followed by Base64 of the digest bytes; do not repeat hex conversion chains in
  the driver or its tests.
- Preserve resource URLs and anonymous cross-origin loading. Fail when an owned asset cannot be
  resolved or hashed; leave unrelated external references unchanged without claiming coverage.
- The landed sample opts in through `vite.config.ts` and documents the limited guarantee. Its
  default-on migration removes the redundant factory while preserving that behavior; image
  presentation belongs to the preceding item. No sample-owned hashing, HTML rewriting, relay,
  credential, or publication-policy changes.

## Finalization and supported composition

- Vite's HTML post-transform is not final-byte authority: build import analysis can subsequently
  rewrite chunk bytes. Plugin-level `enforce: 'post'` is not equivalent to hook-level ordering.
- Use a late `generateBundle` with hook-level `order: 'post'`, inspecting emitted HTML assets after
  supported Vite and caller transformations. Establish correctness against written files, including
  dynamic-import preload rewrites and supported sourcemap modes; the hook name alone is not proof.
- Input validation must be the last user pre HTML hook in resolved plugin order; refuse a later pre
  HTML hook. Refuse resolved HTML environment substitutions and custom HTML asset sources rather
  than validate different semantics from those Vite consumes.
- All supported asset/HTML mutations must precede integrity finalization. Later `generateBundle`,
  `writeBundle`, `closeBundle`, and external post-build byte rewriting are outside this version's
  composition contract. Do not claim that the plugin detects or refuses arbitrary later writes.
- Terminal disk validation before Dist computation is deliberately excluded. Supporting later
  writers with guaranteed refusal would require an explicit design/scope revision owned by the
  driver.
- Manifest success alone is insufficient: it can describe an inconsistent HTML/asset pair
  faithfully.

## Resource ownership and authored attributes

Resolve against Vite's resolved configuration: `Vite.build` can override the base through CLI args.
Never fetch remote assets to compute integrity.

- Relative bases (`./` or empty): resolve from each emitted HTML file's directory.
- Root-relative bases: match the normalized base directory boundary before output lookup.
- Absolute CDN bases: match both origin and base pathname boundary. Do not treat every absolute URL
  as external or map unrelated origins by pathname alone.
- Preserve queries/fragments in HTML; omit them only for file lookup. Preserve their distinction
  when reasoning about browser module identity.
- Decode paths predictably once; reject malformed or ambiguous separator/traversal encodings.
- Missing owned outputs fail with HTML filename, original URL, and attempted output identity.
- Reject owned `public/` JS/CSS absent from emitted bundle inventory; no arbitrary filesystem
  fallback.
- Reject `<base href>` or custom `experimental.renderBuiltUrl` semantics that prevent supported
  matching, rather than silently omitting integrity.
- Inspect authored attributes before Vite consumes bundled input tags. Never silently discard
  conflicting integrity or credential requirements; final-tag inspection alone cannot prove this.
  Input traversal includes template/noscript content, foreign and inline module scripts, and CSS
  links consumed irrespective of `rel`. Use Vite's public CSS classifier, not a private import. Vite
  consumption is independent of deployment ownership: resolver-backed source identifiers, including
  scheme-bearing module and CSS requests, must not evade authored-constraint validation. Preserve
  metadata on unrelated external references that Vite actually retains.
- Keep browser-active output classification separate. Refuse static HTML select elements, including
  option-only selects, until parser/browser parity is established: parse5 can discard resource tags
  Chromium retains. This does not extend output coverage into inert templates or runtime-created
  DOM.
- Refuse any HTML template bearing `shadowrootmode` reached in active output traversal, regardless
  of mode value or host eligibility. Declarative shadow roots can load stylesheets immediately;
  open, closed, and nested roots cannot be classified as ordinary inert templates. Keep ordinary
  inert template content and raw text untouched, including shadow syntax stored there.
- On retained final tags, accept absent or matching integrity and reject conflicting metadata. Do
  not append a valid SHA-256 digest to conflicting stronger integrity metadata.
- Missing, empty, or boolean `crossorigin` must yield anonymous loading; reject `use-credentials` on
  covered resources. Unrelated external tags remain untouched. Anonymous means same-origin
  credentials, not credential omission for all requests.

## Initial module loading boundary (historical)

The overlap-only scope below describes the initial integration. The dependency-modulepreload
extension expands HTML-link coverage, not the import graph.

- HTML `modulepreload` references overlapping a covered module URL must receive the same integrity
  and compatible anonymous credentials mode, or cause build refusal.
- This closes another loading path to the same resource, not the module graph. Dependency-only
  preloads, static/dynamic descendants, and CSS imports remain outside the guarantee.
- A later integrity-bearing tag must not be assumed to revalidate an existing module-map entry.
  Covered modules must not first enter that map through an unprotected loading path. The plugin
  cannot universally enforce this runtime condition; document it and prove the controlled cases.
- Keep HTTP-cache reuse and document module-map reuse distinct in both tests and claims.

## Proof

The crypto item owns fixed-vector encoding proof and backward compatibility of existing `Hash`
callers. The driver item owns emission, compatibility, manifest-ordering, and browser-enforcement
proof:

- Recompute integrity from written files for dynamic imports, CSS, supported sourcemap modes, and
  caller mutations before finalization. Do not promise refusal of out-of-contract later writers.
- Prove unchanged generic builds without a factory, managed app default-on/explicit-off behavior,
  development behavior, each supported base form, nested HTML, unrelated origins, queries/fragments,
  encoded-path refusals, missing outputs, and unsupported build configurations.
- Separately test authored input tags consumed by Vite and retained final tags, including
  conflicting integrity/credentials. Final `dist.json` must describe the integrity-bearing HTML.
- Record actual child Vite/Rolldown versions. The workspace lock alone does not establish a
  temporary consumer's resolved toolchain; version-sensitive ordering proof must identify what
  executed.
- Own PostCSS configuration in isolated fixtures with `css: { postcss: { plugins: [] } }`. Vite's
  background config discovery can outlive `dev.close()` in transform-only development tests.
  Repeated independently sanitized server lifecycles must complete without pending filesystem work;
  sleeps or disabled leak checks are not a correction.
- Use existing `Browser.load` and `Testing.Http.server` through declared tasks, with two controlled
  local origins and an independent trusted reporter. No new general browser-control API.
- Keep browser loading, select, and shadow specifications separate behind the existing integrity
  task entry. Name fixture build/attestation phases and trusted reporter programs. Specify expected
  observations independently of stimulus application; share transport mechanics, not a scenario
  framework. Refusal assertions follow browser controls so successful builds cannot hide a bypass.
- Browser matrix: original JS/CSS succeed; altered valid JS is refused while CSS still applies;
  altered valid CSS is refused while JS still executes; the same altered bytes with recalculated
  matching integrity succeed. Keep transport, CORS, and MIME valid in the tamper cases.
- Include separate CORS, MIME, and missing-resource controls. Require positive reporter completion,
  execution markers, computed-style observations, and target-specific failure evidence; a timeout,
  absent UI, or generic browser failure is not SRI proof.
- Preserve a written-build/browser select control: unprotected original/altered CSS load; matching
  integrity loads; stale integrity blocks with a target-specific diagnostic; rehashed altered bytes
  load. The same caller mutation with integrity enabled must refuse the build. Parser-only proof is
  insufficient for this boundary.
- Retain written-build/browser declarative-shadow controls for open, closed, and nested roots:
  unprotected original and altered CSS apply, matching integrity loads, stale integrity blocks with
  a target-specific diagnostic, and rehashed altered bytes load. Observe effective metadata and
  computed style inside the actual roots; enabled builds must refuse the same source.
- Prove source-constraint refusal through real Vite consumption, testing integrity and credentials
  separately, including resolver-backed module/CSS identifiers, environment-introduced markup, and
  adjacent pre-hook/asset-source boundaries. Use opt-out consumption controls, an unconstrained
  resolver-backed success case, and preserved external-reference controls.
- Test overlapping entry preloads before delayed script insertion, plus HTTP-cache reuse separately.
  The module-map counterexample requires executable browser evidence, not just a specification
  claim.

The sample image item owns the comparison and its delivery proof:

- Prove identical source PNG bytes, distinct native source references, non-inlining intent, footer
  placement outside React, readable labels, and the documentation-link target with offline tests.
- Prove byte-preserving public projection and private GET/HEAD refusal for both filename shapes.
  Fixture-generated filenames establish projection policy, not Vite's actual rewriting.
- Run the real sample build. Inspect written HTML and both inventories: two separate public PNG URLs
  under the configured origin and prefix, matching source hashes, no data URLs or unresolved
  substitutions, and no PNG payload in the private projection.
- Confirm both images render with readable captions at wide and narrow widths. For this native-HTML
  comparison, keyboard, blocked-resource, and network-panel checks are optional delivery
  diagnostics, not commit prerequisites. Do not infer those observations or live R2 headers from
  screenshots, or publish merely to obtain browser evidence.

Historical local image proof from the paired-image implementation, not rerun by plan reconciliation:

- `deno task test`: 27 tests / 127 steps passed after targeted red → green checks. Exact-file
  formatting checks, scoped lint, and tracked whitespace checks passed.
- `deno task build`: Vite 8.3.0 emitted `pkg/a.BscawNaH.png` and preserved `images/wax-seal.v1.png`.
  Both public manifest entries recorded 58,841 bytes and SHA-256
  `9a110325ca0d22eb23c6c88d60960fdd3c9d9b9c5ccaa331b0ac27679239d83a`; the private payload inventory
  contained only `index.html`. Written HTML referenced both assets under the configured public base
  without inlining or environment tokens.
- These observations establish local build/test evidence, not browser layout, blocked-module
  behavior, or live R2 delivery. Those browser observations were not performed in that pass.
- Subsequent human-provided browser screenshots showed both images rendered with readable captions,
  side by side at wide width and stacked at narrow width. The human rejected the additional manual
  controls as disproportionate for this image-only change. Those controls remain unverified; this
  does not relax the separate SRI enforcement proof.
- Final copy refinements retained the two native references and public-only projection. The scoped
  native-image test passed (1 test / 1 step), with exact-file formatting and whitespace checks. The
  footer explains application-server egress savings; the W3C SRI citation remains in README. These
  copy checks were not another full-suite, build, or browser run.

## Sample integrity adoption

This item landed as `d83cf2a44`. Its contract and proof remain below as the boundary for the landed
sample behavior; the follow-on adoption item does not reopen it.

The sample item owns integrity adoption and delivery compatibility:

- Compose `VitePlugins.HtmlIntegrity.plugin()` from `@sys/driver-vite/plugins` through
  `Vite.Config.app({ vitePlugins: [...] })` in `vite.config.ts`. Preserve `sample-no-workers`, the
  resolved public base, and development behavior. No sample-owned production hashing or HTML
  rewriting.
- Rebuild with integrity enabled and verify private/public projection preserves the
  integrity-bearing HTML and asset bytes. Independently recompute each covered JS/CSS digest from
  `dist.public` bytes and compare with `dist.private/index.html`; require anonymous cross-origin
  attributes and URLs under the configured public base. Verify the new private/public content pins
  against their payloads; a valid Dist pin alone does not prove SRI consistency.
- Retain both image URLs and PNG bytes without claiming image SRI coverage. Keep `index.html` as the
  only private payload. The preceding image build is not proof of the enabled sample build.
- Exercise delivery with the offline sample response tests: private HTML/manifest GET and HEAD
  continue working; public JS/CSS/PNG routes remain refused without storage access. Do not broaden
  private relay routes or require live R2 to complete this integration.
- Verify provider CORS separately if live delivery proof is requested; configuration is not header
  evidence. Do not run `proof:local`, `serve`, or push tasks for this local proof. Live R2 access
  and publication require separate human authority.
- Finish the same implementation item with a DMIND copy pass based on verified behavior, without a
  separate docs commit, new section, or expanded tutorial. Append one short sentence to the top
  paragraph in `ui.App.tsx`: "Browsers verify HTML-linked scripts and styles using Subresource
  Integrity (SRI)." Make "Subresource Integrity (SRI)" an `<a>` link to
  `https://www.w3.org/TR/2016/REC-SRI-20160623/`. Keep the current image footer unchanged.
- Keep README guidance brief: production HTML-linked resources are covered, not transitive imports
  or images, and trusted HTML is required. Scope the existing "browser does not ... verify payload
  bytes" caveat to content-table reporting so it does not contradict SRI. Avoid duplicating the SRI
  explanation; update the rendered-copy regression for the sentence and canonical link.
- Final verification covers the completed copy changes: run `deno task test` and `deno task build`
  from `code/sys.driver/driver-cloudflare/-sample/deploy`, inspect the written projections as above,
  and check only touched files for formatting/lint. Record fresh results, not historical counts.
- Refresh the version-sensitive driver proof with `deno task test:integrity` from
  `code/sys.driver/driver-vite`. Its written-byte and controlled-browser checks establish the
  current toolchain's ordering/enforcement; sample projection proof establishes the adoption. Reuse
  this existing proof rather than adding a sample browser framework. No dependency downgrade,
  permission bypass, or weakened validation to obtain a pass; report an upstream failure separately.

Landed sample proof (`d83cf2a44`):

- Sample `deno task test`: 27 tests / 135 steps passed, including the rendered SRI link and
  integrity-bearing projection regression.
- Sample `deno task build`: Vite 8.3.2 emitted integrity-bearing private HTML and public JS/CSS. The
  post-build public manifest's exact-byte hashes independently converted to the two HTML SRI values.
  Private payload remained only `index.html`; both PNG URLs and identical 58,841-byte PNG hashes
  remained public. Build payload was 619,806 bytes: 617,519 public and 2,287 private.
- Driver `deno task test:integrity`: 11 tests / 186 steps passed on Vite 8.3.2, Rolldown 1.2.12, and
  HeadlessChrome 154.0.0.0.
- Exact-file formatting passed for the five touched sample files and the driver README; lint passed
  for the four touched TypeScript files; tracked whitespace checks passed. No live R2 access,
  publication, or deployment was performed.
- Blind independent review returned GO with no material correctness or scope defect. Its one low,
  non-blocking observation was that the fixture regression proves projection, not opt-in. No extra
  config-name assertion was added: the real production build is the sample integration authority,
  while the driver matrix owns enforcement. After that review, the driver README's exact Vite
  version claim was removed as transient evidence; the landed commit contains the durable wording.

## Default-on app policy and workspace migration

The default-on decision supersedes the preparatory managed composition's default-off behavior, not
its factory or security boundary. The default-on follow-on removes the need for per-package `true`
for normal app builds.

The source/history-only blind review at `c08a1b1b1` identified a template-proof gap: successful
check/build can hide an old driver, and generation consumes an embedded bundle rather than live
source files. Default-on does not remove version skew or embedded-artifact drift. The revised
acceptance below tests those failure paths without assuming a missing opt-in is still a failure.

### TMIND design decisions

- **Reach:** source inventory found 15 active app configs, one package-template config, and 10
  checked-in driver fixture configs. Every one calls `Vite.Config.app` or its shared
  `ViteConfig.app` surface; zero active apps bypass it. The inventory excludes generated products,
  vendor trees, and archives. Calling the helper is not proof of which driver revision actually
  executes.
- **Safe default:** omission must enable integrity, including when callers supply another plugin
  flag such as `react: false`. Unsupported builds must not silently fall back to unprotected output.
  A consumer-owned explicit `false` is an exception, not an automatically inferred compatibility
  mode.
- **Compatibility:** this intentionally changes production HTML and rejects inputs that previously
  built without integrity. Existing app-plus-factory callers must migrate or explicitly disable the
  managed instance. Describe that behavior change honestly; do not silently deduplicate or weaken
  input validation to hide it.
- **Bounded refusal:** current refusal families include SSR/library/non-client or non-ESM output,
  absent emitted HTML, custom URL/HTML asset-source behavior, resolved HTML environment
  substitution, conflicting authored metadata, missing owned outputs, and static
  select/declarative-shadow parser boundaries. This is a source-level risk inventory, not evidence
  that an active app fails. Prefer correcting an incompatible source; otherwise record the narrow
  exception and its reason.
- **Finality:** default-on does not detect arbitrary later disk writers. Known unsupported cases
  fail closed; the established later-writer counterexample remains a coverage limit, not a claim of
  universal fail-safe delivery. Monaco's separate `vs/` emission is not a blanket exemption.
- **Proof:** production output, not the absence of an opt-out, closes adoption. Account for every
  active app with written-byte evidence or a concrete exception. Do not infer CORS/MIME/CDN behavior
  from local builds or disable SRI merely to bypass missing deployment evidence.
- **Review:** a review of the default-off candidate cannot approve the changed omission semantics.
  Adjudicate that report against its original bounded source/test target; verify the default-on
  delta and migration separately. Preserve useful coverage without carrying forward stale
  assertions.

### Commit ownership and release sequence

1. `feat(driver-vite): add managed HTML integrity for app builds` owns the default-off managed
   boolean, app-only placement, caller-factory preservation, resolved duplicate refusal, diagnostics,
   and build-proof refactor. It includes effective-attribute and setup-write controls, the test-local
   fixture type, and exact main/optional-worker input construction without type erasure. It does not
   switch omission semantics or establish template/app adoption.
2. `feat(driver-vite): enable HTML integrity by default for app builds` owns the API/default,
   lifecycle refusal, documentation, and driver proof. Include the required R2 factory removal so
   the default change does not knowingly leave the sample with duplicate plugins. Preserve its
   worker refusal and rerun its projection proof.
3. `feat(driver-vite): adopt HTML integrity in templates and eligible apps` owns template check and
   bundle regeneration, long-tail compatibility corrections, explicit exceptions, generated-product
   proof, and the per-app acceptance inventory. Leave already-compatible configs unchanged; do not
   stamp `true` into every file.

The central default affects callers immediately; separate commits do not defer that effect. The
modulepreload follow-on extends HTML-resource coverage to dependency-only links and tests their
actual import path. Earlier template/app acceptance does not establish that extension. Publication
and deployment retain their separate release conditions; neither is implicit in any item.

### Durable app API

- Keep `htmlIntegrity?: boolean` in `t.ViteConfig.CommonPlugins`. Normal
  `Vite.Config.app({ paths })` builds inherit SRI for owned HTML-linked JS/CSS, not HTML
  authenticity. Explicit `true` remains valid; `false` disables only the managed instance. Do not
  add aliases, a policy namespace, or an algorithm selector.
- Default through `options.plugins?.htmlIntegrity ?? true`, still gated by `includeAppPlugins`.
  Omission and `true` add one managed instance; `false` adds none. Existing plugin defaults remain
  unchanged. Document defaults per field on `CommonPlugins` and `Options.plugins`.
- Keep `Vite.Config.define` an identity wrapper: it accepts arbitrary configurations outside the app
  contract. Do not add a switch to `Vite.build` or change native Vite's defaults.
- Create the managed instance after caller `vitePlugins` and before OXC-preflight and the optional
  last visualizer, never in worker factories. Preserve `enforce: 'post'` and post-ordered
  `generateBundle`; placement alone does not establish finality. Retain the
  [supported-composition boundary](#finalization-and-supported-composition).
- Keep `VitePlugins.HtmlIntegrity.plugin()` public for custom composition and focused driver
  fixtures. Within `app`, advanced explicit composition uses `plugins: { htmlIntegrity: false }`
  plus one factory. Do not remove a caller's factory when the managed instance is disabled.
- Refuse duplicates, including an omitted/true default plus an explicit factory. Require exactly one
  resolved reserved-name entry while preserving factory-instance identity. Count resolved entries,
  not unique objects or unresolved arrays. Diagnostics must explain both corrections: remove the
  explicit factory, or disable the managed instance and retain one factory. This does not promise
  detection of renamed wrappers or later environment injection.
- The boolean wraps one implementation with fixed SHA-256, not a reduced security contract. No
  speculative options packet or heuristic enablement detector is needed.

### Adoption inventory

- Keep `code/-tmpl/-templates/tmpl.pkg/vite.config.ts` on ordinary app composition, inheriting the
  default without an integrity import or redundant `true`. Extend the generated package's declared
  `check` task in `code/-tmpl/-templates/tmpl.pkg/-deno.json` to include `./vite.config.ts`
  explicitly; its current source/script targets do not check that file.
- Regenerate the embedded template bundle through the owning prep surface, after inspecting its
  formatting and generation scope. Do not hand-patch generated artifacts, broaden formatting, or add
  a `/plugins` mapping. Local candidate proof and published-dependency proof have different
  authority; follow the release conditions below rather than fabricating a future version.
- The API/default item removes R2's explicit `VitePlugins` import and factory. The workspace item
  preserves that migration's HTML, projection, worker refusal, documentation, and proof boundaries;
  do not reintroduce an explicit `true` merely to establish adoption.
- Audit these active non-test candidates individually:
  - `code/sys.dev/vite.config.ts`;
  - `code/sys.ui/ui/vite.config.ts`, `code/sys.ui/ui-components/vite.config.ts`, and
    `code/sys.ui/ui-dev/vite.config.ts`;
  - `code/sys.driver/driver-automerge/vite.config.ts`,
    `code/sys.driver/driver-monaco/vite.config.ts`, `code/sys.driver/driver-pi/vite.config.ts`,
    `code/sys.driver/driver-prosemirror/vite.config.ts`, and
    `code/sys.driver/driver-stripe/vite.config.ts`;
  - `deploy/@draft.shell/vite.config.ts`, `deploy/@tdb.data/vite.config.ts`,
    `deploy/@tdb.edu.slug/vite.config.ts`, `deploy/@tdb.slc/vite.config.ts`, and
    `deploy/@tdb.slc.std/vite.config.ts`.
- Verify inherited integrity for supported client HTML whose covered HTML/JS/CSS bytes are unchanged
  after finalization. Inspect environment-expanded HTML, custom asset sources, base/render URL
  behavior, authored metadata, select/shadow boundaries, and later writers. A separate uncovered
  asset writer is not itself a disqualification: prove it does not modify covered outputs.
  Automerge's external font stylesheet, Monaco's runtime-loaded `vs/` tree, and Stripe's runtime
  loader remain uncovered.
- Record each candidate's evidence or concrete exception. An explicit `false` must have a concise
  source-level reason and a named app owner in the acceptance record; no blanket compatibility
  opt-outs. For cross-origin delivery with unresolved CORS/MIME requirements, withhold deployment
  pending evidence rather than assuming headers. R2 preserves already-enabled local behavior, not
  verified provider CORS. No live-provider access is required or authorized by this item.
- Exclude fixtures and archives from the product adoption count, but account for changed fixture
  semantics. Local app fixtures inherit the candidate default; three published-baseline fixtures
  intentionally pin driver `0.0.480`. Preserve their isolated historical authority and verify what
  actually executes; a source pin alone is not runtime proof. Preserve generic direct-factory
  controls. App fixtures requiring unprotected output must explicitly disable the managed instance;
  do not bulk-rewrite evidence that owns another contract.

### Build-proof acceptance corrections

The bounded opt-in candidate review exposed two inherited test-reliability defects, accepted against
live source. These corrections belong to the driver test owner and precede default-on acceptance;
they do not require changing production integrity semantics.

- **Effective attributes:** the prior `expectWritten` in the integrity test's `u.fixture.ts`
  accepted `data-integrity` and `data-crossorigin` through substring matching. Require actual
  attribute-name boundaries for resource URLs, integrity, and crossorigin within the controlled
  fixture tags, without adding a general HTML framework or reusing the production parser. Closing
  proof: unchanged output passes; independently renaming either security attribute to its `data-*`
  form fails. Preserve the stale-written-byte counterexample.
- **Successful setup:** `Fs.write` defaults to returning errors; prior fixture and scenario writes
  ignored their results. Require `{ throw: true }` or explicit error handling for every relevant
  write in `u.fixture.ts` and the build specifications, including the later disk writer. Closing
  proof: a bounded simulated setup-write failure rejects with the original error and awaits cleanup;
  successful scenarios still pass. Retain setup/cleanup error preservation; no sleeps or weakened
  leak/permission checks.
- **Internal contract:** move the shared `BuildFixture` type out of runtime `u.fixture.ts` into the
  test-internal type plane. Keep it out of package exports; do not add public API or a larger type
  hierarchy for this organizational correction. Close with scoped type checking and build proof.

Reviewer-reported test results establish their stated bounded scope, not execution in the source
adjudication. Neither those results nor these dispositions approve the changed default or certify
application/template/provider behavior.

Test-helper correction proof, executed on Deno 2.9.7 / TypeScript 6.0.3:

- From `code/sys.driver/driver-vite`,
  `deno task test:run --trace-leaks ./src/m.vite.plugins/m.HtmlIntegrity/-test/-html-integrity.fixture.build.ts`
  demonstrated five intended red steps, then five green steps after the corrections. Each
  independent `data-integrity`, `data-crossorigin`, `data-src`, and `data-href` mutation failed
  written-output attestation; restoring the original HTML passed against unchanged assets. The
  write-fault case exercised the real `Fs.write` error policy and held cleanup behind an explicit
  promise barrier: setup stayed unsettled until cleanup completed, preserved the original error, and
  removed the root. Both intercepted Deno operations were restored in `finally`; no sleeps or
  relaxed sanitizers.
- Owning `deno task check` passed, including the internal `t.fixture.ts` contract and call sites.
  `deno task test` passed 62 tests / 517 steps, including diagnostics and test-lane checks.
  `deno task test:integrity:build` passed 8 tests / 95 steps, including the existing
  stale-written-byte counterexample and four independently leak-checked development lifecycles.
- Exact-file formatting and lint passed for the six test/type files; scoped tracked whitespace
  checks passed. Production diagnostics and managed default-off behavior were not changed by this
  correction. Browser enforcement, Dist integration, app/template adoption, and provider behavior
  were not reverified by these commands.

### Driver and application proof

- The driver owner proves omission/true enablement, explicit-false disablement, partial plugin
  options inheriting the default, preserved other defaults, app plugin placement, terminal plugin
  positions, and integrity-free worker factories. Preserve identity between `Vite.Config` and
  `/config`'s `ViteConfig`; there is no separate alias implementation.
- Exercise real Vite resolution/build refusal for omission/true plus an explicit factory, two
  distinct factories with managed integrity disabled, repeated identity, and nested/promise
  duplicates. Prove false plus one explicit factory succeeds. Plugin-name-only assertions cannot
  replace lifecycle tests; development remains unchanged because the factory is build-only.
- Prove inherited and explicit-true paths in real JS/CSS builds, including a caller post-ordered
  `generateBundle` mutation before integrity. The explicit-false control must build without managed
  metadata. Independently recompute final written-byte digests. Retain the bounded later-writer
  `writeBundle` counterexample showing stale SRI despite build success; it documents unsupported
  composition, not a requirement to detect arbitrary writers.
- For every adopted app, run its declared checks and production build, then attest covered output
  using the criteria below. Preserve R2 projection and worker-refusal proof. Reuse the existing
  driver written-byte/browser matrix; do not duplicate browser tamper infrastructure per app.

### Default-on verification

Executed against the default-on source with Deno 2.9.7 / TypeScript 6.0.3:

- Driver `deno task check` and `deno task test` passed: 62 tests / 520 steps. Config proof covers
  omission, undefined, true, false, empty/partial plugin options, preserved other defaults, caller
  placement, terminal plugins, and integrity-free worker factories. Scoped red → green preceded the
  default change; broader checks exposed and corrected two stale plugin-order/HTML assertions.
- Driver `deno task test:integrity` passed 15 tests / 209 steps, including real app builds, duplicate
  refusals, false-plus-factory composition, inherited library refusal, unchanged development, and
  the existing later-writer counterexample. Chromium enforcement used an app fixture inheriting the
  default, not an explicit factory. The child toolchain was Vite 8.3.2 / Rolldown 1.2.12; browser
  evidence identified HeadlessChrome 154.0.0.0.
- Scoped workspace-composition and `deno task test:dist:pipeline` each passed 1 test / 1 step. These
  exercise inherited app integrity through the child build and Dist content pipeline; they are not
  generated-template acceptance.
- From `code/sys.driver/driver-cloudflare/-sample/deploy`, `deno task test` passed 27 tests / 135
  steps. New `deno task test:integrity` rebuilt the actual sample and passed 1 test / 1 step:
  independently enumerated private HTML references matched written public JS/CSS SHA-256 SRI,
  anonymous CORS attributes, configured public-base URLs, and verified content-pinned projections.
  Private payload remained only `index.html`; both public PNG outputs matched source bytes. The
  recorded total remained 619,806 bytes. The config retains `sample-no-workers` and removes only
  the redundant integrity import/factory.
- These commands establish local default-on and sample compatibility proof, not independent review,
  template materialization, long-tail app acceptance, published dependency authority, or provider
  CORS/MIME evidence. Adoption and dependency-preload proofs are recorded separately below;
  publication and provider evidence retain their separate release conditions.

### Generated-template acceptance

The template owner must prove the generated product, not just the authored template. An older driver
accepts the unchanged ordinary app call but does not inherit the new default. `makeTmpl` loads
`src/m.tmpl/-bundle.json`; source edits alone do not refresh the product.

1. Generate an isolated package through normal materialization from the refreshed embedded bundle.
   Do not copy live template files or inject an option/plugin into the positive fixture. Resolve the
   local workspace driver candidate explicitly and record that proof-only authority.
2. Run the generated declared check, including `vite.config.ts`, and production build. Verify that
   the declared check actually includes the config and record the generated dependency authority.
3. Independently enumerate owned module scripts, stylesheets, and overlapping modulepreloads from
   written HTML. Require nonempty module coverage, SHA-256 SRI on every covered reference, anonymous
   cross-origin mode, and exact matches to written JS/CSS bytes. Missing metadata must fail rather
   than vanish from an integrity-only query. Check every covered stylesheet actually emitted; do not
   invent CSS coverage when none is emitted.
4. Old-driver control: materialize the same ordinary generated config with a verified pre-default
   driver. Checking may succeed because no new option is used; a successful build must fail the
   independent SRI attestation for missing metadata. Unsupported-option type errors are not the
   expected failure for this control. Restore candidate authority and require a positive result.
5. Stale-bundle control: materialize the pre-change embedded product with candidate driver
   authority. Generated-product acceptance must reject its missing config-check target even if SRI
   attestation succeeds. A stale config lacking an explicit opt-in can correctly inherit SRI; do not
   demand an SRI failure from that composition. Restore the refreshed artifact and require the same
   product acceptance to pass. Keep driver-authority and bundle controls separate.

Unrelated resolution, permission, or transport failures do not count as negative-control proof. Keep
controls isolated; do not roll back live work.

Record the driver authority, embedded artifact identity, executed Deno/Vite/Rolldown versions,
commands, output reference inventory, digest comparisons, and negative-control diagnostics. Reuse
narrow test helpers where useful, but do not use the production HTML finalizer to generate expected
metadata or patch output into compliance. These are required local proofs, not observations already
established by the source-only review.

### Adoption implementation acceptance (local)

- The app acceptance lane `deno task test:integrity:apps` passed all 15 individual app steps:
  the 14 active candidates listed above plus R2. Each ran its declared check and production build,
  then independently attested final written HTML-linked resources. No config opt-ins, opt-outs,
  or compatibility exceptions were needed. Monaco's late `vs/` emission retained valid covered
  bytes and emitted `vs/loader.js`; that runtime tree, Stripe's loader, and Automerge's external
  Google Fonts stylesheet remain uncovered. This lane is explicit, not full external/CI acceptance.
  The inspected app log is
  `/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/pi-bash-66931e4ee9c438e8.log`.
- Final bounded verification after exact-file cleanup passed: formatting for 12 authored/config
  files, lint for nine TypeScript files, and scoped tracked whitespace checks. Current-byte backups
  remain in `.tmp/html-integrity-adoption-format-a689a54c6/`. The touched internal template builder
  and its synchronous processor no longer carry unnecessary `async`; package exports are unchanged.
- From `code/-tmpl`, owning `deno task check` passed. Scoped CLI/package regression via
  `deno task test --trace-leaks ./src/m.tmpl/-test/-m.cli.test.ts ./src/-tests/-pkg.deno.test.ts`
  passed 2 tests / 13 steps. From the driver, scoped attestation regression via
  `deno task test:run --trace-leaks ./src/m.vite/-test/-html-integrity.attest.test.ts`
  passed 1 test / 1 step. No leak sanitizers were weakened.
- One final `code/-tmpl` `deno task test:integrity` passed 1 test / 1 step in 2m52s, with complete
  output inspected. It materialized the embedded product through the normal fixture and built an
  unchanged ordinary app config. Candidate authority was local
  `code/sys.driver/driver-vite/src/mod.ts`; embedded-map identity was
  `sha256-5eef431fc420096df2f9a7c87085845cea2c727ae197f3721633c3a30b8cd0a6`.
  The run reported Deno 2.9.7 / TypeScript 6.0.3 / Vite 8.3.2 and initialized Rolldown 1.2.12.
  Its covered inventory contained one owned module, `pkg/-entry.DAzMTIKc.js`, with independently
  recomputed `sha256-NNMojSdkiuaKyx8kVkfkb7TgWoWg2LDiL8n1iArfep4=`; no stylesheet was emitted.
- Independent controls passed in that same run: config-only TS2322 failed the generated declared
  check and exact restoration passed; reachable pre-default driver
  `49d43914c782d7f7e6ad79de9cf9c7f526801752` checked/built successfully but failed attestation
  specifically for `Missing effective integrity`; restored candidate authority checked/built and
  attested successfully with exact config/manifest bytes preserved. Historical app source was
  canonically resolved and matched
  `sha256-b24e1f0609f9ab469fd41874b2bbf902b86b860dbd05b4c3e9752e6fee68404c`.
- Separately, embedded blob `ef6e6526bb8678036dbf2e1a34faf2b21ea671ea` built with valid inherited
  SRI but failed acceptance for `Missing generated config-check target`. The refreshed product
  subsequently checked/built and attested successfully. Ignored-import warnings during the old
  control did not substitute for proof: resolved historical source plus successful native output
  lacking SRI established its bounded authority. Published-pin experiments establish no claim.
- The complete final green run above establishes local acceptance; prior failed or incomplete logs
  do not. App builds were not repeated in the finish pass. Publication, standalone published
  dependency authority, release authorization, deployment, and provider CORS/MIME/CDN verification
  remain separate holds below.
- Independent adoption review reported no material blockers and freshly reproduced the owning
  template check, scoped attestation (1 test / 1 step), CLI/package regressions (2 tests / 13 steps),
  and one generated-template capstone (1 test / 1 step, 2m51s). App results were historical, not
  rerun. Source adjudication corroborated nearest-package alias retention in native startup;
  config-graph resolution alone is not its authority proof. These observations support the bounded
  adoption contract, not executable dependency integrity or published/deployed compatibility.

### Publication boundary and release ownership

Local candidate acceptance can complete this implementation item; it cannot establish standalone
published compatibility. The human release owner for `@sys/driver-vite` and `@sys/tmpl` must carry
this publication hold into the release handoff, independently of local implementation completion.

At the reviewed baseline, `tmpl.repo` pins driver `0.0.480`; root `tmplPrepArgs` selects published
versions; `assertPublishedImportExports` checks export paths, not support for an option. The
`publish_12` matrix in `.github/workflows/jsr.yaml` includes both packages in parallel. Normal prep
or a shared publish invocation therefore does not enforce the required chronology.

Before authorizing publication of the changed `@sys/tmpl`, the release owner must establish:

1. A published and verified driver revision containing the default-on app behavior, not merely the
   option or factory.
2. Template dependency authority and embedded artifacts refreshed against that published revision
   through the owning generator, with the actual selected revision recorded.
3. A fresh standalone repository/package generated from that release-candidate bundle, outside local
   workspace resolution, passing config checking, production build, and the same written-output SRI
   attestation above. Use actual published dependency pins: no local import-map rewrites, workspace
   aliases, or linked candidate sources may stand in for them.
4. An explicit tmpl publication authorization based on that evidence. If any condition fails or the
   driver revision is unavailable, hold tmpl publication; do not substitute export checks, invent a
   version, or use the existing parallel matrix as sequencing evidence.

No publication, release-automation rewrite, provider access, or remote mutation belongs to this
implementation item. Recheck release machinery at handoff; source/history evidence is not registry
or provider evidence.

### Documentation and finish

- Make inherited app integrity the primary README setup, explicit `false` the deliberate escape
  hatch, and direct factory composition the advanced path. Document app-plus-factory migration and
  the intentional behavior change. Keep coverage and later-writer limits prominent; do not imply
  HTML authenticity, full-graph protection, or verified provider headers. Document defaults per
  field rather than as a blanket plugin policy.
- Inspect all touched files for superseded `/plugins` imports, transitional aliases, duplicate
  spellings, stale version claims, generated noise, and unrelated formatting. Account for every
  active candidate and preserve justified exclusions. Keep formatting checks exact-file scoped.

## Dependency modulepreload integrity

Owned by `feat(driver-vite): add integrity to dependency modulepreloads`.

This replaces the broader executable-dependency proposal. Fix the missing attributes and test their
enforcement; do not turn this item into a new application-security architecture. Earlier
overlap-only coverage descriptions record landed behavior, not the target for this item.

### The change

- In `finalizeIntegrityHtml`, remove the restriction that an owned modulepreload must also appear as
  a module-script URL. Cover every build-owned modulepreload in emitted HTML, including links whose
  only consumer is another module's import.
- Use the existing SHA-256 Base64 hashing and finalization path. Insert `integrity` for each link's
  emitted chunk; preserve its URL and anonymous `crossorigin`. Retain owned-output lookup, missing
  output refusal, conflicting metadata checks, and applicable authored-input validation. Unrelated
  external links remain outside build-owned coverage.
- Extend the independent output attestation to require integrity on dependency-only preloads too. It
  must enumerate links before checking metadata, not repeat the production overlap-only filter.
  Compare attributes against actual written chunk bytes; missing integrity must fail attestation.
- Preserve existing entry-script and stylesheet SRI, default-on/explicit-off behavior, finalization
  ordering, Dist hashes/content pins, and R2 projection. Update the brief coverage documentation. No
  new public option or per-app opt-in.

### Accepted review constraint

A preload's integrity is not a permanent URL-to-hash binding for later imports. The returned blind
review identified failed module-map entry eviction followed by an ordinary import with no integrity
metadata. This is a failure route for the same dependency, not an excluded worker or runtime loader.
Local source inspection confirmed that Vite 8.3.2 constructs the entry script before dependency
preloads and that our finalizer changes attributes, not import semantics. The review's platform
finding motivated the completed-preload schedule below. The recorded Chromium runs did not observe
an unchecked retry; they do not establish permanent integrity binding for later imports.

The relevant specification anchors are
[fetch a single module script](https://html.spec.whatwg.org/multipage/webappapis.html#fetch-a-single-module-script)
and
[descendant fetch options](https://html.spec.whatwg.org/multipage/webappapis.html#get-the-descendant-script-fetch-options).
A passing run on one browser does not override a platform-permitted retry or establish protection on
other versions.

### One focused browser fixture

Use a real Vite build with an entry importing a separate dependency chunk and Vite's generated
modulepreload link for that chunk. Preserve emitted tag order, URLs, and normal static imports. Do
not insert or reorder module scripts, add an integrity-bearing dependency script, or use a custom
loader. Reuse transport and trusted-reporting mechanics, not the existing fixture's manufactured
entry preload or delayed script insertion.

Use two response schedules in this one fixture:

- **Ordinary:** serve normally and record the observed outcome. Do not label it an in-flight join
  without evidence; a green result here alone does not close the timing question.
- **Preload completes before import:** hold only the unchanged entry response. Serve the dependency
  preload, then release the entry after the trusted observer reports that link's `load` or `error`.
  In the tampered case, require completed integrity failure before entry release. The ordinary
  static import can then reuse a module-map result or retry the same URL; observe which occurs.

Control the second schedule with an event/request handshake, not sleeps. The preload event must
release the entry before document completion; waiting for window load would deadlock. Bound every
wait and report an unobserved sequence as a test failure, never as SRI refusal. Use isolated browser
runs and valid no-store asset responses so prior cache state does not hide a retry. Keep server
request/release ordering, preload settlement, integrity diagnostics, and execution markers in the
result. A server having sent the dependency response is not proof that its preload has settled.

Exercise the same three byte/hash cases under both schedules:

1. **Original:** unchanged HTML and assets load; the dependency's execution marker is observed.
2. **Tampered:** serve valid changed dependency JavaScript with unchanged trusted HTML and hash. The
   changed code must not execute through the actual preload-to-import path. Require a
   dependency-specific integrity failure and completion from the independent trusted observer. An
   SRI error and subsequent execution can coexist: a failed preload or browser error alone must not
   pass this case.
3. **Rehashed:** serve those same changed bytes and update only their expected integrity in HTML.
   The changed dependency executes, proving the previous refusal was the hash mismatch rather than
   invalid JavaScript, a broken import, CORS, MIME, or an unavailable resource.

Add the narrow written-output regression for dependency-only coverage, including removing only a
protected dependency link's integrity and requiring attestation failure. Record browser and build
versions. Run affected driver checks, not another full app or generated-template campaign. Preserve
existing unrelated tests and permission/leak checks.

The earlier
[design-only platform probe](./html-subresource-integrity.plan/-integrity-platform.browser.test.ts)
stopped at `NotCapable` for `127.0.0.1:0`, before browser launch. It establishes no browser result
and its denied invocation was not retried. The package-owned regression below uses the driver's
existing declared task and permissions, with no grant changes. Its successful execution does not
authorize retrying the denied scratch probe.

### Result and stop rule

- Attribute coverage and matching written bytes establish native SRI for the covered preload
  requests. They do not alone establish dependency execution refusal.
- If altered dependency code executes in either schedule, record the counterexample and stop before
  claiming this item complete. Do not weaken the assertion, change production timing to hide the
  failure, or silently substitute the narrower preload-request benefit for the agreed goal.
- If both schedules pass, record only the tested browser version and conditions. Do not claim
  timing-independent enforcement across browsers or recursive integrity for later imports.
- If native import retries defeat the goal, bring back the smallest standards-based correction for a
  separate design decision. URL-keyed import-map integrity is a candidate because it supplies
  metadata to the import itself; it is not implemented, proven, or automatically authorized here.

No runtime `dist.json` verifier, import interception, worker removal/redesign, Monaco/Stripe loader
migration, WASM policy, or new browser-control framework belongs to this item. Those separate
loading paths are not protected by this change and are not prerequisites for this test.

Review acceptance depends on real-build evidence, not attribute presence or repeated verdicts. A
changed enforcement design or new concrete loading risk requires fresh review.

### Local dependency-preload evidence

Executed against HEAD `2c9d4289eb5d8e657b3c678be97c626c8128bf7e` plus the scoped coverage changes:

- Coverage/attestation regressions first failed on the intended omissions: four finalizer/input steps
  and the independent inventory step. After removing both overlap-only filters, they passed.
- A native Vite build using managed `Vite.Config.app` integrity emitted one module entry and one
  separate statically imported dependency preload. Independent attestation compared both HTML hashes
  against written bytes; no preload was manufactured and no entry tag was moved or inserted.
- Toolchain: Deno 2.9.7, Vite 8.3.2, Rolldown 1.2.12, HeadlessChrome 154.0.0.0. The emitted entry was
  `assets/index-DsEL0GsP.js`, with `sha256-O4/NSq0RoTsZPURkOWyX+PCZkcsiSFkLD+ENpjgjxl4=`. The
  dependency was `assets/dependency-B4lpkj8D.js`, with
  `sha256-ZtIaPFyQIO1J8x34zAvIcb4VqLKDJ8iG+Kk4SEN8MZw=`.
- All six byte/hash and response-schedule cases passed. Original and rehashed dependency markers
  were observed, with entry value 7. Both tampered cases produced the dependency-specific integrity
  diagnostic; dependency and entry markers were null. Every trusted observer completed once.
- In the held-entry tamper case, recorded ordering was entry request, dependency response,
  browser-confirmed preload error, then entry release. Only one dependency GET occurred: this
  browser did not perform the review's proposed unchecked retry in this run. The same altered
  bytes executed after updating their expected hash to
  `sha256-wmHYfTWd8gXMHj4TeFuE8Nn7wKhXuNeuzkaElAAyAFg=`. CORS, MIME, and HTTP availability remained
  valid; asset responses used no-store and browser runs used isolated profiles.
- Final owning command from `code/sys.driver/driver-vite`:
  `deno task test:run --trace-leaks ./src/m.vite.plugins/m.HtmlIntegrity/-test/-u.htmlIntegrity.test.ts ./src/m.vite/-test/-html-integrity.attest.test.ts ./src/m.vite/-test.external/-html-integrity.dependency.chromium.ts`
  passed 4 tests / 102 steps in 8 seconds. The browser fixture is wired into the existing integrity
  entry. Owning `deno task check`, seven exact-file format checks, six-file lint, and scoped tracked
  whitespace checks passed. Formatting backups remain in
  `.tmp/html-integrity-dependency-format-2c9d4289e/`.
- These observations establish the tested preload-to-static-import layout on this browser, not
  timing-independent enforcement across all browsers, dynamic/unpreloaded imports, workers, or
  application-wide integrity. No app/template campaign, provider verification, publication, or
  deployment was performed. The smaller preload-request guarantee remains the portable claim.

### Final review and refinement evidence

- Independent post-implementation review reported GO with no material findings and freshly
  reproduced 4 tests / 102 steps in 9 seconds, including all six dependency browser cases. Its
  conclusion was limited to native preload-request integrity and the observed Chromium topology.
- Documentation aligns README, public API comments, transport ownership, and R2 guidance. It states
  the guarantee boundary rather than presenting an unchecked retry as a local browser observation.
  Published-driver acceptance remains explicitly unverified.
- Final test-readability refinements name HTML inputs and digests, keep assertions together, and
  align `Str.dedent` fixtures. The focused leak-checked run passed 4 tests / 102 steps in 9 seconds;
  all six browser cases passed with the same emitted chunk identities and hashes. Five exact-file
  format checks, three-file lint, and scoped tracked whitespace checks passed. No full CI,
  publication, or provider proof was added by this finish pass.

## Closeout boundary

The opening arc reconciles to eight uniquely reachable commits in its recorded order. The final
commit's parent-to-commit diff contains the 11-file implementation, documentation, and readability
delta. This inspection establishes history and scope, not a fresh test run after landing.

Preserve this plan and its companion directory together in a truthful `plan(done)` snapshot before
removing them through the separate `plan(archived)` lifecycle. The companion probe is historical
blocked evidence, not an active implementation obligation or browser acceptance result. Do not
remove unrelated plans or formatting backups during closeout.

The human release owner retains the [publication hold](#publication-boundary-and-release-ownership):
verify a published default-on driver, refresh template authority and embedded artifacts, prove a
standalone generated product using published dependencies, and separately authorize template
publication. Provider CORS/MIME/CDN and deployment evidence remain outside local completion. Carry
these conditions into the release handoff; archiving this implementation plan does not resolve them.
No Git mutation, publication, deployment, or plan removal is authorized by reconciliation.

## Remaining non-goals

The modulepreload item extends the existing HTML-resource scope; it does not replace these limits.

- Whole-module-graph integrity.
- Recursive integrity beyond covered HTML references, or worker, image, or font integrity.
- HTML authenticity or protection against replacement of both HTML and assets.
- New runtime infrastructure or generalized security policy.
- Detecting arbitrary post-finalization mutations or adding a terminal disk-validation subsystem.
- Claiming application-wide protection against compromise of unprotected public-bucket assets.
- Changing R2 access policy, credentials, or deployment routing.
- Enabling integrity in generic `define`/`Vite.build` calls, auto-disabling it on incompatible
  input, or treating old published-driver consumers as upgraded by a local default change.

## Source anchors

- `code/sys.driver/driver-vite/src/m.vite.config/t.app.ts`: application configuration contract.
- `code/sys.driver/driver-vite/src/m.vite.config/u/u.app.ts`: plugin composition and asset naming.
- `code/sys.driver/driver-vite/src/m.vite/u/u.build.ts`: Vite execution and final Dist computation.
- `code/sys.driver/driver-vite/src/m.vite/u/u.wrangle.ts`: child toolchain and CLI base authority.
- `code/sys.driver/driver-vite/src/m.vite.plugins/mod.ts`: driver-owned plugin surface.
- `code/sys.driver/driver-vite/src/m.vite.plugins/m.HtmlIntegrity/m.HtmlIntegrity.ts`: build-only
  lifecycle and instance identity; owner of the duplicate-refusal invariant.
- `code/sys.driver/driver-vite/src/m.vite.plugins/m.HtmlIntegrity/u.html.ts`: HTML coverage, owned
  modulepreload coverage, attribute validation, and digest insertion.
- `code/sys.driver/driver-vite/src/m.vite/-test.external/u.html-integrity.attest.ts`: independent
  written-byte attestation, including dependency-only preloads.
- `code/sys.driver/driver-vite/src/m.vite/-test.external/-html-integrity.dependency.chromium.ts`:
  real-build dependency imports under ordinary and completed-preload-before-import schedules.
- `code/sys.driver/driver-vite/src/m.vite/-test.external/-html-integrity.loading.chromium.ts`:
  existing browser loading tests; delayed entry insertion is not the dependency-test choreography.
- `code/sys.driver/driver-vite/src/m.vite/-test.external/u.html-integrity.browser.ts`: shared
  transport, trusted completion, and resource-specific integrity diagnostics.
- `code/sys.driver/driver-vite/src/m.vite/-test.external/u.html-integrity.project.ts`: existing
  manufactured entry preload; do not reuse it as evidence for the dependency-import path.
- `code/sys.driver/driver-vite/src/m.vite/-test/-build.test.ts`: build and manifest proof.
- `code/sys.driver/driver-vite/src/m.vite/-test.external/-html-integrity.chromium.ts`: browser proof
  entry.
- `code/sys.driver/driver-vite/src/m.vite/-test.external/u.html-integrity.fixture.ts`: written
  fixture attestation.
- `code/sys.driver/driver-vite/src/m.vite.plugins/m.HtmlIntegrity/-test/-html-integrity.build.test.ts`:
  written-byte, source-consumption, and development-lifecycle proof.
- `code/sys/crypto/src/m.Hash/t.ts`: public hash options and output contracts.
- `code/sys/crypto/src/m.Hash/u.hash.ts`: digest generation and output encoding.
- `code/sys/crypto/src/m.Hash/-test/-digest.test.ts`: fixed-vector and default-compatibility proof.
- `code/sys.driver/driver-cloudflare/-sample/deploy/src/ui/index.html`: native image comparison and
  asset references.
- `code/sys.driver/driver-cloudflare/-sample/deploy/src/ui/styles.css`: image comparison layout.
- `code/sys.driver/driver-cloudflare/-sample/deploy/src/ui/ui.App.tsx`: delivery introduction and
  brief linked SRI explanation.
- `code/sys.driver/driver-cloudflare/-sample/deploy/src/-test/-ui.render.test.tsx`: rendered copy
  contract.
- `code/sys.driver/driver-cloudflare/-sample/deploy/src/ui/images/wax-seal.v1.png`: managed source
  image.
- `code/sys.driver/driver-cloudflare/-sample/deploy/public/images/wax-seal.v1.png`: public-file
  image.
- `code/sys.driver/driver-cloudflare/-sample/deploy/-scripts/-test/-ui.images.test.ts`: native
  markup contracts.
- `code/sys.driver/driver-cloudflare/-sample/deploy/-scripts/-test/-u.build.test.ts`: source byte
  equality and projection proof.
- `code/sys.driver/driver-cloudflare/-sample/deploy/src/-test/-app.test.ts`: private relay refusals.
- `code/sys.driver/driver-cloudflare/-sample/deploy/README.md`: delivery, content reporting, and
  bounded SRI guidance.
- `code/sys.driver/driver-cloudflare/-sample/deploy/vite.config.ts`: inherited app integrity and
  sample-owned worker refusal.
- `code/sys.driver/driver-cloudflare/-sample/deploy/-scripts/task.build.ts`: projection and build
  pins.
- `code/sys.driver/driver-cloudflare/-sample/deploy/src/m.deployment/u.selection.ts`: canonical
  content-pin verification and private/public payload policy.
- `code/sys.driver/driver-vite/src/m.vite.config/m.ViteConfig.ts`: generic `define` identity
  wrapper.
- `code/sys.driver/driver-vite/src/m.vite.config/t.ts`: driver-managed plugin option contract.
- `code/sys.driver/driver-vite/src/m.vite.config/-test/-app.test.ts` and `-u.app.test.ts`: app
  plugin ordering and worker composition proof.
- `code/sys.driver/driver-vite/src/m.vite.config/-test/-.test.ts`: shared config surface identity.
- `code/-tmpl/-templates/tmpl.pkg/vite.config.ts` and `-deno.json`: inherited app policy and
  generated config-check ownership.
- `code/-tmpl/src/m.tmpl/u.makeTmpl.ts`, `-bundle.ts`, and `-bundle.json`: actual template
  materialization and embedded artifact authority.
- `code/-tmpl/-templates/tmpl.repo/imports.json` and `-deps.yaml`: generated-repository dependency
  inputs/outputs; published resolution must be proven separately.
- `code/-tmpl/-scripts/task.prep.ts` and `code/-tmpl/-scripts/-prep.u.ts`: template preparation and
  export-only compatibility checks.
- `code/-tmpl/src/m.tmpl/u.makeBundle.ts`: embedded bundle generation.
- `-scripts/task.prep.ts` (`tmplPrepArgs`) and `.github/workflows/jsr.yaml` (`publish_12`): release
  chronology evidence, not an automatic driver-before-template publication guarantee.
- `code/sys.driver/driver-vite/README.md`: inherited app default, deliberate opt-out, advanced
  direct composition, and coverage boundaries.

Paths above are relative to the workspace root. Plans describe intended work, not runtime truth. The
image and sample-integrity items retain separate proof boundaries; `d83cf2a44` supplies the landed
sample adoption evidence. Preparatory managed composition preserves default-off behavior. The
default-on and adoption items separate API/sample compatibility from application/template
acceptance. The modulepreload follow-on fills the dependency-only HTML-link coverage gap and tests
its enforcement without rewriting historical proof boundaries. Migrating the sample's composition
preserves rather than reopens its landed behavior. Planning and review authorize neither
implementation nor Git or remote mutation.
