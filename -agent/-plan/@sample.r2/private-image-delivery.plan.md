@sample.r2
private-image-delivery.plan.md
- [x] 8498fb608 feat(sample.r2): demonstrate private R2 image delivery
- [x] 4bc6fbea2 fix(sample.r2): preserve the page when opening reference links
- [x] c38ef6a31 refactor(sample.r2): restore React-owned layout and factor the Page module

## Intent

Demonstrate the same artwork through three explicit build naming and delivery paths, using existing
primitives. Preserve the reference-link behavior, then correct the page's split ownership: minimal
HTML bootstrap, one React-owned layout, and a small, cohesive Page module.

The human explicitly rejected the static-footer exception and requested this refactor and module
factoring. Subsequent naming review selected Page for this delivery-demonstration page. Independent
image presentation when the React bundle fails is not a requirement. Do not invent another fallback,
rendering mode, or framework to preserve that earlier agent-chosen design.

The human also selected `wax-seal.png` in both source locations: manual revisioning is not part of
this demonstration. Historical design/proof sections retain the earlier `.v1.png` spelling; current
refactor requirements below use the simplified name.

Sample root: `code/sys.driver/driver-cloudflare/-sample/deploy/`. Paths below are relative to it.
Planning does not authorize implementation, Git mutation, credential access, or live R2 operations.

## Existing work and observed boundary

[public-image-delivery.plan.md](public-image-delivery.plan.md) records the original public image.
Its paired-image successor is landed in
[html-subresource-integrity.plan.md](../@sys.driver-vite/html-subresource-integrity.plan.md).
Neither covers this third private-delivery example; do not reopen their completed items.

At the planning baseline, the two images used direct public R2 URLs, not presigned browser URLs. The
private relay exposed `index.html` and `dist.json`; `deno.json` configures tasks, not a delivered
example. `appFrom` admits the private manifest through `R2.ReadRoute.fromDist`; `routesFor` maps
nested filenames under `/ui/`. Signing and bounded byte acquisition belong to the existing R2 owner.

## Original image-delivery design (historical)

This section records the first image unit's design, not instructions for the refactor. The static
footer, HTML asset references, and prohibition on a React image component are superseded by the
React-owned layout below. Preserve the delivery policy, not the rejected rendering ownership.

- Reuse the accepted `public/images/wax-seal.v1.png` bytes. Project the existing built
  `images/wax-seal.v1.png` into `dist.private` as well as `dist.public`. Preserve both public
  outputs and their URLs. No third authored PNG, independent upload, or post-build copy.
- Extend the sample-owned private filename policy to admit this one exact PNG alongside
  `index.html`; retain the required HTML and diagnostic manifest. Do not admit arbitrary images,
  scripts, or other files to the private relay. Require the selected PNG in the real sample build.
- Reuse `routesFor` and the existing `/ui/` mount. The browser requests
  `/ui/images/wax-seal.v1.png`; the server authorizes, signs a private R2 GET internally, and
  returns PNG bytes. No new HTTP handler, redirect, browser signed URL, or storage API.
- Add a third native figure in `src/ui/index.html`, outside React's root, with
  `<img vite-ignore src="/ui/images/wax-seal.v1.png" width="64" height="64" alt="Red wax seal" />`.
  The inspected Vite HTML processor supports `vite-ignore` on asset elements: it removes the marker
  and leaves the URL untouched. Prove that behavior in the actual sample build.
- Caption: **Private file**, **Preserved filename**, **Private R2 ↗**, then
  `images/wax-seal.v1.png`. Link the delivery label to
  `https://developers.cloudflare.com/r2/api/tokens/`, matching `ui.App.tsx`. The private filename
  links directly to `/ui/images/wax-seal.v1.png`; both public filename labels stay plain text. This
  link and the three caption documentation links use native `target="_blank"` and
  `rel="noopener noreferrer"`. No helper, custom HTML asset source, or HTML environment
  substitution.
- Make only the figure-width adjustment needed in `src/ui/styles.css` for three columns within the
  existing 44rem page; retain centered wrapping and the existing visual grammar.
- Update the existing delivery paragraph in `src/ui/ui.App.tsx` and the image/delivery sections in
  `README.md` so they distinguish public assets from the private image. No new tutorial section or
  React image component. Private means private bucket backing, not authenticated application access.

## Invariants

Keep anonymous authorization explicit, signed URLs and credentials server-only, exact manifest route
admission, existing byte/time/concurrency limits, private `no-store`/`nosniff`, and public-asset
refusals. Unknown image paths must not cause storage reads. Private image delivery consumes
application-server bandwidth; do not extend the public-image egress claim to it. The seal is not an
authenticity badge and images have no SRI coverage.

The private projection now deliberately shares one payload with the public projection. The existing
build-size value remains the original build total; adding the two audience totals can double-count
that payload. Preserve content pins and document checksums as separate concepts.

## Original implementation proof (historical)

- Extend existing filename, projection, native-markup, and HTTP integration tests. Pin identical PNG
  bytes in both audiences; prove the admitted private PNG's GET/HEAD bytes, MIME, length, no-store
  headers, exact private key, and absence of signed redirects. Keep refusals for public managed
  assets and unselected paths. Use synthetic credentials and the existing storage fixture.
- Update `-scripts/-test/-html-integrity.build.ts` for the enlarged private inventory and three
  emitted image URLs while preserving its JS/CSS SRI assertions. Existing `proof:local` already
  iterates the admitted private inventory; retain it, with fixture expectations aligned as needed.
- From the sample root, use focused `deno task test --filter` runs, then `deno task test` and
  `deno task test:integrity`. Inspect actual generated HTML and inventories: first two URLs under
  `publicAssetBase`, third exactly `/ui/images/wax-seal.v1.png`, identical PNG bytes, valid content
  pins, no inlining or signed URL exposure. Check formatting only for exact touched files.
- Obtain wide/narrow rendering evidence and one network observation showing the third PNG at the
  application origin. Screenshot appearance alone does not prove its delivery path or bucket
  exposure. Any publication or live read requires separate human authorization; report unperformed
  checks rather than inventing them. No new browser/proof framework or expanded permission presets.

## Original implementation evidence (historical)

These observations describe the original image unit and its caption-link refinement. They do not
prove the planned React-owned product or make the static-footer design a requirement.

The new filename, shared-projection, native-markup, and private-PNG HTTP cases failed against the
previous implementation, then passed after the sample change. Full sample `deno task test` passed 27
tests with 137 steps; `deno task test:integrity` built the actual sample and passed its written-byte
check. Exact-file formatting (14 files), lint (11 TypeScript files), and `git diff --check` passed.
After the native-link refinement, both tasks passed again; the written-build check also verifies
four new-tab links, the exact private image href, and unlinked public filename labels. Formatting
and lint passed for the refinement's exact files. Vite configuration and SRI guards are unchanged.

Written HTML contains two public-base PNG URLs and exactly `/ui/images/wax-seal.v1.png` for the
third; `vite-ignore` is absent. Both preserved copies and the fingerprinted image match the source
bytes: 58,841 bytes, SHA-256 `9a110325ca0d22eb23c6c88d60960fdd3c9d9b9c5ccaa331b0ac27679239d83a`.
Both projected pins verify, and the existing HTML-linked JS/CSS SRI checks still pass.
Fixture-backed HTTP integration verifies private GET/HEAD, headers, internal signing, no redirects,
and refusal before storage for unselected paths. Routing, signing, publication, and `proof:local`
remain unchanged.

Agent validation performed no live R2 reads, publication, credential access, or browser rendering.
Human-supplied cropped screenshots show the three seals and captions in a wide row. They do not
prove the request URLs or bucket exposure. Narrow-viewport checks and a real application-origin PNG
network observation remain unobserved; local tests do not substitute for that evidence.

## Reference-link refinement evidence (historical)

The subsequent link refinement established purpose-based navigation: application home and
`index.html` stay in the current tab; manifests, raw API JSON, the private image, and documentation
open alongside the sample. Reference anchors have one `↗` cue, `target="_blank"`,
`rel="noopener noreferrer"`, and an "Opens in a new tab" title. Public image filename labels remain
unlinked. Preserve this behavior when the captions move into React; share the renderer rather than
maintain separate HTML and JSX conventions.

Its local proof passed `deno task test` (27 tests / 137 steps), `deno task test:integrity`,
exact-file formatting (6 files), lint (4 TypeScript files), and `git diff --check`. The rendering
test inspected all 13 React anchors; the written-build check inspected all 6 static anchors and
retained the written-byte JS/CSS SRI and PNG projection checks. These are historical local
observations, not live R2 or browser proof.

## Refactor: one layout owner, obvious Page sections

### Design and scope

Native browser image delivery does not require authoring images in static HTML. Public versus
private describes the request destination and storage policy, not which renderer creates the
`<img>`. React owns all visible sample layout and captions. Do not introduce SSR, hydration,
prerendering, request-time HTML rewriting, or a second rendering path.

Keep `src/ui/index.html` recognizable as a minimal sample entry: doctype, document/head/body tags,
language, charset, viewport, title, favicon and stylesheet references, an empty `#root`, and the
entry-module script. Remove the fallback `<main>`, footer, figures, captions, and diagnostic links.
No authored page content, inline runtime, `vite-ignore`, or HTML environment substitution. The UI
requires its client bundle; do not replace the removed fallback with another unrequested feature.

Factor the existing one-off root into `m.Page/`, exporting `Page` with `t.Page.Props`. Use the
existing local module grammar, not a new reusable component library or an extra App wrapper:

```text
src/ui/
  index.html
  -entry.tsx
  common.ts
  t.ts
  styles.css
  u.load.ts
  images/wax-seal.png
  m.Page/
    mod.ts
    common.ts
    t.ts
    ui.Page.tsx
    ui.Introduction.tsx
    ui.Content.tsx
    ui.ImageExamples.tsx
    ui.ReferenceLink.tsx
```

- `m.Page/ui.Page.tsx`: root container and composition. Retain the existing state/effect and
  cancellation boundary around `startFetches`; render the introduction, same-origin API result,
  content section, and image footer beneath one React root. Keep the small API-result block here.
  Preserve `<main>` followed by `<footer>` without unnecessary wrappers or layout changes.
- `ui.Introduction.tsx`: headings and delivery explanation. Keep origin annotation as a local
  helper; no separate component for that fragment.
- `ui.Content.tsx`: build total, public-first manifest table, and checksum disclosure. Keep row and
  digest helpers local; do not create separate files for individual cells, rows, or checksum labels.
- `ui.ImageExamples.tsx`: the three figures and captions, using ordinary `<img>` elements. Preserve
  order, dimensions, alternative text, filename roles, and existing links. No image loader,
  click-handler machinery, generic asset registry, or new delivery abstraction.
- `ui.ReferenceLink.tsx`: the existing reference-link behavior, shared by the root and sections.
  Navigation anchors remain ordinary same-tab links. Do not infer link intent from origin.
- `t.ts`: explicit module-owned props and readonly presentation snapshots used across these files.
  `common.ts` re-exports the parent lane and exposes these types through local `t`; `mod.ts` exposes
  the narrow Page entry. Do not promote internal view types into deployment contracts or manufacture
  a Lib/controller framework for this sample.
- `src/ui/t.ts`: scoped loader arguments and manifest observations shared by transport and Page.
  Re-export them through the UI common chain, not package-root deployment types.

Leaf sections are pure props-to-markup renderers. Keep transport in the existing `u.load.ts`; do not
add subscriptions, independent fetches, duplicated state, or ambient asset resolution to them. This
is a composition and ownership correction, not a fetch-runtime rewrite. Reuse `styles.css`; no
styling-system migration, visual redesign, new dependencies, DevHarness, or template scaffolding.

Update `src/ui/-entry.tsx` and rendering-test imports to the module entry. Remove the old flat
`src/ui/ui.App.tsx`; do not leave a compatibility wrapper or a second page implementation. Use the
wrapper-owned move/remove tools for implementation moves and stale-file cleanup.

### Assets and delivery stay explicit

- Import `./images/wax-seal.png?no-inline` in the Vite-only `src/ui/-entry.tsx`, using the ordinary
  Vite asset-import mechanism. Pass its emitted managed-image URL into Page through an explicit
  prop. Render tests supply a fixture URL; they must not need to import PNGs or emulate Vite.
- Continue passing `import.meta.env.BASE_URL` as `publicAssetBase`. Resolve the preserved public PNG
  against this configured base, as already done for the public manifest. Do not hard-code the R2
  hostname, derive the public base from the application origin, or add another config source.
- Keep the private image source exactly `/ui/images/wax-seal.png`. A JSX URL value does not need the
  HTML processor's `vite-ignore` escape. Its filename link uses the same exact destination.
- Keep both existing source PNGs byte-identical and external, with two public PNG outputs and the
  preserved PNG also projected privately. No new image, inlining, post-build mutation, upload path,
  or filename-policy expansion. Rename the exact admitted image along with its source paths.
- Keep routing, anonymous authorization, exact private admission, server-only signing, response
  limits, publication, content pins, and SRI coverage unchanged. Legitimate rebuilt resource names
  and digests may change. Do not weaken integrity guards or add custom HTML asset sources to make
  the refactor work; report any genuine upstream blocker instead.

### Proof follows the corrected ownership

1. Replace the static-footer ownership assertions in `-scripts/-test/-ui.images.test.ts` with a
   minimal-shell contract; rename it to `-html.shell.test.ts` using the move tool. Assert an empty
   root and entry script, with no authored body layout, image examples, or fallback links. Retain
   source/build checks against unsupported HTML substitutions and custom runtime markup.
2. Extend `src/-test/-ui.render.test.tsx` to inspect all three figures inside the rendered Page,
   including their order, exact URL roles, 64 by 64 dimensions, alternative text, captions, and
   linked/unlinked filename labels. Reuse its existing renderer and fetch fixtures, supplying an
   explicit managed-image URL. Cover the whole page's reference versus navigation behavior, with the
   caption links using the same safe-anchor contract and one `↗` cue.
3. Retain loading, isolated manifest failures, zero-byte totals, document checksums, and disposal
   regressions. Keep `src/-test/-ui.load.test.ts` and the HTTP/projection tests authoritative for
   their existing boundaries; do not duplicate transport tests in leaf components.
4. Adapt `-scripts/-test/-html-integrity.build.ts`: written HTML must now be a minimal shell, not a
   source of rendered image/caption assertions. Preserve actual written-byte JS/CSS SRI,
   cross-origin settings, content pins, admitted inventories, and byte-identical PNG checks. Verify
   the normal Vite build emits and references the managed PNG; compare rendered URL roles against
   the emitted managed path and configured public base. Use the existing renderer/build lane, not
   SSR or an ad hoc browser-bundle executor. Distinguish composition/build evidence from actual
   browser execution.
5. Update README to describe React-owned examples and ordinary asset imports. Remove claims of
   images/fallback links surviving entry-module failure, HTML-only URL rewriting, and `vite-ignore`.
   Remove or correct the entry-blocking diagnostic that currently expects those static elements.
   Preserve link intent, exact private-filename guidance, request destinations, SRI coverage limits,
   and publication/cache warnings.
6. Run focused regressions red → green, then `deno task test` and `deno task test:integrity` from
   the sample root. Check formatting/lint only for the exact implementation files and run
   `git diff --check`. Keep the plan's identity/arc lines in canonical form even if the Markdown
   formatter requests merging them.
7. Inspect wide/narrow presentation and keyboard navigation when an authorized browser surface is
   available. Preserve the previously recorded limits on live network/cache observations. Neither
   this plan nor successful local proof authorizes credentials, publication, or live R2 operations.

Acceptance: one minimal HTML entry, one React layout owner, a root Page that reads as composition,
cohesive child files with explicit props, and unchanged observable image delivery/link behavior. No
static layout alongside React, duplicated reference-link policy, stale flat App file, compatibility
scaffold, or speculative framework. Tests must prove delivery and presentation without enshrining
the rejected HTML ownership again.

## Initial React-owned composition proof (before image filename simplification)

The minimal-shell and React-owned image cases first failed against the previous implementation: the
source body still had a footer, and the rendered App had neither that footer nor its four reference
links. After the refactor, the focused cases passed. The full sample suite passed `deno task test`
with 27 tests / 138 steps. `deno task test:integrity` rebuilt the actual sample and passed its
written-byte check. Exact-file formatting (14 files), lint (12 TypeScript files), and
`git diff --check` passed.

- Source `src/ui/index.html` is a 14-line bootstrap with an empty root. Written
  `dist.private/index.html` has no authored body content beyond that root; its module and stylesheet
  references retain verified SHA-256 SRI and anonymous CORS metadata.
- The Page module owns `<main>` and `<footer>` through the three agreed presentation sections. Its
  scoped type surface supplies explicit props and observed snapshots. The existing fetch/state
  lifecycle remains at the root; `u.load.ts`, Vite configuration, and delivery policy have no
  target-attributed changes. The stylesheet is reused with the arrow-font refinement below. The old
  flat App and native-image test filenames are absent.
- Rendering tests inspect all three images and all 17 page anchors. Build inspection confirms the
  ordinary entry import emits the fingerprinted PNG and references its public URL in JavaScript.
  Composition using that emitted URL preserves both public destinations and exactly
  `/ui/images/wax-seal.v1.png` for the private image. All projected PNG bytes still agree, and both
  content pins verify. This is local build/composition evidence, not browser-bundle execution.
- README describes the React-owned layout and asset import, retains revision/private-admission
  guidance, and removes the no-JavaScript fallback claims and obsolete entry-blocking diagnostic.

No live R2 reads, publication, or agent-operated browser/network checks were performed. A
human-supplied wide screenshot shows the API result, content table, and three figures together. That
is appearance evidence, not proof of request destinations, delivered asset versions, or bucket
exposure. Narrow presentation, keyboard interaction, and provider headers remain unobserved. The
opening arc remains the sole landing ledger.

### Page naming follow-through

After the human selected Page, moved `src/ui/ui.App/` to `src/ui/m.Page/` and renamed the root to
`ui.Page.tsx`, exporting `Page` with `t.Page.Props`. Updated entry/test imports, local type
references, and README. No compatibility App wrapper, new abstraction, or behavior change was
introduced.

Re-ran `deno task test` (27 tests / 138 steps) and `deno task test:integrity`; both passed.
Exact-file formatting (14 files), lint (12 TypeScript files), and `git diff --check` passed again.
The old `ui.App/` directory and implementation-lane App references are absent.

### Review-driven test residue pass

The human-supplied blind review found no correctness/security blocker. Its test-residue finding was
accepted: remove obsolete phrase/attribute prohibitions and rigid caption-child ordering; retain one
image and caption per figure, URL roles, meaningful labels, and whole-page link safety. Keep
emitted-URL composition in the build test, but leave caption/link details to the rendering test.
Require an entry module and stylesheet, then verify every covered resource rather than fixing the
resource count at two.

Temporary test-only probes confirmed that a wrong private-image URL, missing link protection, and
corrupted in-memory SRI value each fail. An additional valid in-memory modulepreload passed the
written-byte checks. All probes were removed; no runtime source or stored build payload was
corrupted. The final `deno task test` passed 27 tests / 138 steps, and `deno task test:integrity`
passed. Exact-file formatting/lint (2 files) and `git diff --check` passed. Resource digests and
content pins remained unchanged from the preceding Page build.

Keep the existing Fetch and local ReferenceLink. Narrower Fetch packaging and lifecycle imports
belong to a separate `@sys/http` investigation, not this sample refactor. The ownership opportunity
is supported, but removable bundle bytes are unmeasured; require owner-level policy/lifecycle
compatibility and an equivalent measured build before claiming an improvement.

### Arrow typography refinement

Human screenshots exposed the monospace arrow inherited when the complete ReferenceLink sits inside
code. Keep the shared renderer; wrap only its arrow in `span.reference-link-arrow` and use
`font-family: system-ui, sans-serif`. Do not alter the value's font, link color, font size, or
navigation/reference behavior. No new icon component, variant API, or dependency is needed.

The isolated-arrow regression failed before the change. Afterward, all 17 page anchors retain their
text and safe-navigation contract, with one separately styled arrow per reference and none on
navigation links. The caption-label selector now distinguishes its direct text spans from nested
arrow spans. `deno task test` passed 27 tests / 138 steps; `deno task test:integrity` passed with
legitimately rebuilt JS/CSS digests and unchanged PNG URL roles/bytes. Formatting (3 files), lint (2
TypeScript files), and `git diff --check` passed. Actual browser glyph appearance after the change
remains unobserved; local DOM/build checks do not prove font rendering. No publication was
performed.

### Image filename simplification

The human selected `wax-seal.png` rather than `.v1.png`: the demonstration compares build treatment
and delivery, not manual revision management. Moved both existing source PNGs without changing their
bytes. Updated the entry import, public/private URL references and captions, exact private
admission, projection/HTTP/render/build regressions, and README. Keep the ordinary source-import and
public-copy lanes; do not add an asset registry, copy task, filename alias, or third source image.

The new-path filename-policy case failed against the old exact admission, then passed after the
rename. Tests also refuse the old `.v1.png` private inventory and GET/HEAD route, even when the old
object remains in fixture storage, without reading it. Both source copies and all projected PNGs
retain the original checksum. The written build still emits two public PNGs, now preserving
`images/wax-seal.png`, and privately admits only that PNG beside the HTML and diagnostic manifest.
The managed PNG remains `pkg/a.BscawNaH.png`; resource names and content pins legitimately rebuild.

Focused tests passed 7 tests / 32 steps. Final `deno task test` passed 27 tests / 138 steps;
`deno task test:integrity`, exact-file formatting (9 files), lint (8 TypeScript files), and
`git diff --check` passed. The only remaining old spelling in sample source is deliberate negative
test input. Browser/network behavior remains unobserved; no publication or live R2 work was
performed.

### Loader call-site and loading-text refinement

Keep ReferenceLink as the shared reference-policy renderer. The two remaining native anchors are
ordinary same-tab navigation with no repeated reference setup; a generic Link wrapper adds no useful
behavior.

The human requested a cleaner `startFetches` boundary: one named argument bag with `onMessage`,
`onManifest`, and `onBundleSize`, and a readonly manifest snapshot instead of four positional
callback fields. Page stores the snapshot directly with a functional state update. Scope
`StartFetchesArgs` and `ManifestObservation` under `src/ui/t.ts`; Page's manifest type aliases that
observation, avoiding duplicate runtime contracts without promoting UI types into deployment.
Capture the destinations and callbacks at entry; preserve all four independent requests, limits,
credential/redirect refusal, schema recognition, diagnostic checksums, failures, and disposal.

Page now defines one `LOADING = 'Loading…'` for every runtime loading value. Keep literal wording
assertions independent in rendering tests rather than making those tests share the implementation
constant. No new state hook, loader/controller framework, or public package API is introduced.

The named-call fixture first failed type checking against the old five-argument signature. After the
adapter change, focused loading/rendering tests passed 2 tests / 21 steps. Final `deno task test`
passed 27 tests / 138 steps; `deno task test:integrity`, exact-file formatting/lint (6 files), and
`git diff --check` passed. Existing regressions retain isolated failures, independent completion,
zero sizes, late-response suppression, all-request aborts, loading text, and link safety. The
written build preserves all three image destinations and PNG bytes, with legitimately rebuilt JS/SRI
and content pins. No browser/network validation, live R2 operations, or publication occurred.

### Final boundary review and proof

BMIND review inspected the exact reachable commit diff against its parent, independently of its
subject. It contains only the intended sample changes: 27 changed-file entries, representing the
29-path boundary with both sides of two byte-identical PNG renames. The minimal shell, direct Page
mount, section boundaries, shared reference policy, named loader arguments, one runtime loading
constant, exact PNG admission, retained refusals, and removed stale implementations all agree. No
in-scope correctness or security blocker was found.

The arrow span also uses `display: inline-block` to keep its contents outside the anchor's
propagated underline while remaining inside the clickable link. No markup or navigation policy
changed. Rendering regressions passed 1 test / 6 steps after that CSS refinement, and the real
written build retained SRI and all three PNG destinations.

Fresh validation after the commit passed `deno task test` (27 tests / 138 steps),
`deno task test:integrity`, exact-file formatting (23 files), lint (20 TypeScript files), and the
commit whitespace check. The private inventory remains the HTML, diagnostic manifest, and exact
`images/wax-seal.png`; all PNG bytes still agree. Earlier arc subjects and commit identities were
also checked against reachable history. The opening arc remains the sole landing ledger.

This closes the bounded source implementation and local proof, not deployment or live delivery.
Browser glyph/underline painting, narrow layout, keyboard operation, and provider/network behavior
remain unobserved. No new publication, credential access, live R2 work, Git mutation, or plan
retirement was performed during this review.
