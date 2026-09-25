@sample.r2
public-image-delivery.plan.md
- [ ] feat(sample.r2): demonstrate direct public R2 image delivery

## Intent and boundary

Add one image to `@sample/r2` as a minimal, inspectable example of native Web asset delivery. The
browser loads PNG bytes directly from public R2; Deno continues to serve the API and the private
HTML/manifest relay. Teach the existing architecture, not an image-rendering system.

Repository: `/Users/phil/code/org.sys/sys`. Sample root:
`code/sys.driver/driver-cloudflare/-sample/deploy/`. Paths below are relative to that sample root
unless explicitly repository-relative.

One implementation item covers the accepted asset, native markup and styling, documentation, scoped
regression tests, and actual build/browser proof. This plan does not authorize implementation, Git
mutation, remote publication, bucket changes, or credential access. Review is read-only.

## Asset and presentation

- The human supplied and accepted `public/images/wax-seal.png`: a 200 by 200 PNG intended to have
  transparency. The preview was opened; its appearance is accepted. Alpha/profile metadata has not
  been independently audited. Do not reopen the accepted streaks/appearance question or alter
  pixels.
- During implementation, rename that export to `public/images/wax-seal.v1.png`, preserving its
  bytes. The explicit revision names the cache identity; it is not a density suffix. Keep editable
  masters outside `public/`, because that directory is publishable input.
- Render one native `<img>` at 64 by 64 CSS pixels with explicit HTML width/height attributes and
  `alt="Red wax seal"`. Preserve aspect ratio and shadow; no cropping, animation, or duplicate
  image.
- Place a centered, restrained figure in a footer after `#root` in `src/ui/index.html`. It appears
  beneath the React-rendered comparison table but is not owned or replaced by React. The static
  image needs no component, props, hook, controller, or JavaScript asset loader.
- Use the lowercase caption "image delivered directly from public R2". Link only "image" to the PNG;
  link "public R2" to `https://developers.cloudflare.com/r2/buckets/public-buckets/`, matching the
  documentation link in `ui.App.tsx`. Keep the connecting words unlinked and the image itself
  unwrapped; the two text links have distinct destinations.
- Use the existing `src/ui/styles.css` for spacing and alignment. Retain legibility and keyboard
  focus for both caption links at narrow widths. No preload, fetch-priority override, lazy-loader,
  `srcset`, `<picture>`, conversion service, or image framework is needed for this small fixed
  image.
- The seal is an image, not a verified/trusted status badge. Do not connect it to the private digest
  as evidence of authenticity, signatures, or browser-side integrity verification.

## Delivery and cache decisions

Use Vite's native HTML `%BASE_URL%` replacement for both the image `src` and PNG-link `href`,
followed by `images/wax-seal.v1.png`. The existing build sets Vite's base from validated
`publicAssetBase`. Prove the emitted URLs rather than assuming that source syntax establishes the
final behavior.

Expected path:

```text
public/images/wax-seal.v1.png
  → dist/images/wax-seal.v1.png
  → dist.public/images/wax-seal.v1.png + public inventory entry
  → configured public R2 prefix/images/wax-seal.v1.png
  → browser image request
```

- PNG bytes remain external even though the referencing markup lives in privately relayed HTML. "Not
  embedded" means no data URL or image bytes in HTML/JavaScript, not "Vite must never touch it".
- Do not import the PNG into JavaScript, hard-code the R2 hostname, use a leading application-origin
  `/images/` URL, expose `r2.config.json`, or add an image route/fallback to Deno.
- Copy-through `public/` assets are not automatically fingerprinted. `v1` must always denote the
  same bytes once published; a changed export gets a new filename and matching HTML references. This
  is an explicit authoring convention, not an enforced immutable-object feature.
- Keep publication on the existing manifest-owned flow. Do not side-upload or append files after
  manifest capture. Do not widen the current filename policy, response limits, or bucket grants.
- Do not claim `Cache-Control: immutable`, a particular TTL, CDN cache hits, or automatic cache
  invalidation. The inspected publisher passes media type to `Files.writeBytes`; it does not supply
  a cache policy there. Observe actual response headers during browser proof. No cache-policy API
  extension is needed merely to display this revisioned image.
- Preserve the documented limitation: push prunes objects absent from the selected inventory.
  Revisioned filenames prevent reuse of a URL for changed bytes; they do not retain old releases.
  Older pages can lose assets after publication. Do not silently add retention or rollout machinery.
- Describe the benefit as direct R2 delivery with no Deno egress for the PNG. Do not equate that
  with zero storage/operation costs. Keep the current `r2.dev` demo setup; production-domain
  provisioning is outside this change.

## Ownership: thin sample, earned upstream primitives

Sample-owned material is the image, semantic markup, presentation, explanatory copy, and explicit
composition of existing contracts. Do not add sample-owned reusable delivery infrastructure.

For each proposed mechanism:

1. Remove it if native HTML/CSS or existing Vite behavior already solves the need.
2. Use the existing canonical `@sys` surface when it owns the semantics.
3. If a genuine gap remains, report the concrete consumer and lowest truthful upstream owner before
   implementing a workaround. Define a narrow contract, owner-level behavior tests, and immediate
   sample adoption; do not promote a framework for hypothetical reuse.
4. If that requires another implementation unit, stop and obtain explicit plan-scope approval before
   changing the arc. Do not bury the gap in the sample or invent an upstream placeholder commit now.

Existing owners to inspect, not duplicate:

- `@sys/driver-vite`: build base, public-directory handling, output inventory generation.
- `@sys/std` / `@sys/fs` distribution surfaces: verified inventory projection and pins.
- `@sys/tools/deploy`: manifest-owned publication, media-type selection, and pruning.
- `@sys/driver-cloudflare`: R2 transport and bounded private reads.

No new upstream primitive is presumed necessary. Reusability alone does not justify abstraction.

## Source anchors and expected delta

Expected sample edits: asset rename, `src/ui/index.html`, `src/ui/styles.css`, the existing delivery
sentence in `src/ui/ui.App.tsx` to include images, `README.md`, and narrowly relevant tests. Do not
redesign terminal status or change private-digest semantics.

Read these current boundaries before implementation or review:

- `vite.config.ts`, `-scripts/task.build.ts`, `src/m.deployment/u.selection.ts`.
- `-scripts/task.push.ts`, `src/m.app/u.routes.ts`, `src/m.app/u.http.ts`.
- `-scripts/-test/-u.build.test.ts`, `src/-test/-app.test.ts`, `src/-test/-push.test.ts`.
- Repository-relative `code/sys.driver/driver-vite/src/m.vite.config/u/u.app.ts` and
  `code/sys.driver/driver-vite/src/m.vite/u/u.build.ts`.
- Repository-relative `code/sys.tools/src/cli.deploy/u.providers/provider.r2/u.push.ts`.

The inspected Vite driver points `publicDir` at the module's `public/`; its build computes Dist
after Vite output. The sample's partition already accepts PNG and selects only HTML as private
payload. These are source observations, not proof that the new image has been built or published.

## Verification and completion evidence

Use the sample's declared tasks from its owning directory. Prefer narrow regression runs through
that task surface; do not substitute a repository-wide test campaign for this bounded change.

1. Extend existing projection coverage with real binary PNG bytes: the public output preserves bytes
   and has the matching inventory entry; the private payload remains only `index.html`. Reuse the
   existing tamper/pin coverage rather than duplicate the distribution implementation.
2. Extend the HTTP route test with image paths at `/images/wax-seal.v1.png` and
   `/ui/images/wax-seal.v1.png`: GET/HEAD must not fetch PNG bytes through private storage or
   redirect to a signed URL. Existing API/private routes remain unchanged.
3. Run `deno task test` and `deno task build`. Inspect actual generated HTML, inventories, and PNG
   bytes through authorized IO. Require identical source/public PNG bytes, the configured absolute
   public URL in the image/PNG-link attributes, the documentation URL on "public R2", no unresolved
   `%BASE_URL%`, no embedded image data, and no PNG in the private payload. A fixture builder alone
   cannot prove Vite's real transformation.
4. After the declared build, record artifact-inspection evidence for item 3 in this plan's proof
   notes: the command, exact output paths, emitted image/link URLs, byte-comparison evidence, and
   public/private inventory membership. Use existing authorized tooling; report unavailable evidence
   rather than infer a pass. Keep ordinary sample tests offline, self-contained, and independent of
   prebuilt output. Do not broaden test permissions, add a verification harness, or extend
   `task.proof.local.ts` beyond its private-delivery scope for this item.
5. After separate human authorization for the existing destructive publication task, use the same
   build for publish/serve and inspect a cold browser load without a controlling service worker:
   - one distinct successful PNG request, final URL under `publicAssetBase`, type `image/png`;
   - document/API/private manifest at the application origin; no Deno PNG response;
   - actual cache headers recorded without inferred provider guarantees;
   - image/link placement and reserved dimensions correct; both caption links keyboard-accessible;
   - block only the image request: UI/API still work and the caption remains meaningful;
   - block only the entry module: the existing HTML notice and static image remain independently
     available when their own resources load. Remove request blocks afterward.
6. Update README with source ownership, 200-pixel export/64-pixel display, explicit filename
   revision policy, and the PNG-specific network check. Keep existing prune/partial-publication
   warnings.

Prefer red → green for the new regression cases; explain any impractical red step. Record commands,
observed outcomes, and unperformed checks truthfully. Local tests/build are not live R2/browser
proof; missing publication authority or browser access leaves that proof outstanding, not implicitly
passed.

## Local proof record

Commands ran from `code/sys.driver/driver-cloudflare/-sample/deploy/`:

```sh
deno task test --filter 'R2 deployment sample: one-build publication projections'
deno task test --filter 'R2 deployment sample: HTTP adapter integration'
deno task build
deno task test
```

- Red → green: the projection suite first failed because the required revisioned source filename did
  not exist; after the byte-preserving rename it passed all 8 steps. The route suite passed both
  steps, including image GET/HEAD refusal without storage access. These refusal cases exercise
  existing policy, so no deliberately broken route implementation was introduced for a red step.
- Final sample suite: 25 tests, 115 steps, zero failures. Tests remain independent of generated
  output and use the unchanged permission preset.
- Vite 8.3.0 build succeeded. `dist.private/index.html` contains a footer outside `#root`, explicit
  64 by 64 image dimensions, and the same absolute URL for the image and PNG link:
  `https://pub-72d4e716dcae492f9e174c58866d5533.r2.dev/tmp.sys.driver-cloudflare/r2-proof-ui/images/wax-seal.v1.png`.
  The caption refinement was rebuilt and inspected: "image" links to that PNG; "public R2" links
  to `https://developers.cloudflare.com/r2/buckets/public-buckets/`, matching `ui.App.tsx`.
  Neither unresolved `%BASE_URL%` nor embedded image data appears in that HTML.
- `dist/dist.json` and `dist.public/dist.json` both inventory `images/wax-seal.v1.png` at 58,841
  bytes, with SHA-256 `9a110325ca0d22eb23c6c88d60960fdd3c9d9b9c5ccaa331b0ac27679239d83a`. The
  offline PNG test independently hashes `public/images/wax-seal.v1.png` to that same digest and
  checks exact projected byte equality. The existing pinned build projection verifies output parts.
  This establishes source/output content agreement without a new verification harness.
- `dist.private/dist.json` inventories only `index.html` as payload; the PNG is public-only.
  `dist.public/images/wax-seal.v1.png` was also opened visually.

These observations are local build/test evidence only. No publication, live service, or browser
check was performed. Actual R2 MIME/cache headers, cold-load requests, narrow-layout/focus behavior,
and request-blocking behavior remain unobserved acceptance evidence. Publication needs separate
human authorization; browser observations require a browser-capable session or human confirmation.

## Non-goals and review question

No independent media deployment, image framework, resize API, custom URL resolver, service worker,
Deno image proxy, additional bucket, credential change, cache-control framework, release-retention
system, or extra terminal output. No reconstruction or refactoring of the existing sample machinery.

A fresh blind TMIND + DMIND review should challenge whether this is the simplest native-Web shape,
whether each mechanism has the correct owner, and whether the proof distinguishes direct delivery
from merely rendering an image. Review live source and reachable history independently; this plan is
a proposal, not evidence of its own correctness. A smaller design or a clean review is valid.
