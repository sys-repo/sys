canonical-media-type-authority.plan.md
- [x] cb95733a7 feat(std): establish canonical media-type authority
- [x] b8750e4c8 refactor(fs): delegate FileMap media-type semantics
- [x] ac6c880e6 refactor(http): use canonical file media types
- [x] bd130d33fc refactor(tools): remove duplicate MIME resolution
- [x] 2e48ef136 refactor(cli): centralize data-URI media classification
- [x] 63fe2dc04 refactor(model-slug): use canonical content types
- [x] e9ad76ee3 refactor(driver-cloudflare): centralize textual media classification

## Sequence and closure evidence

The opening arc is the sole ledger for landing state and commit identity. Final verification covered
focused migration proofs, full touched-package test and check tasks, exact touched-file format and
lint checks, dependency preparation, and migration-residue scans. The workspace capstone passed
checks for all 53 packages and 11,048 tests across the same 53-package workspace.

The landed `feat(http): emit constrained file byte responses` work remains a separate work unit.
This arc rewrote its MIME dependency before resuming
`feat(server): compose pinned local Dist hosting`, so the Server composition consumes the final HTTP
surface rather than participating in media-type policy.

Planning this arc did not itself authorize implementation, Git mutation, staging, or commits.

## Position

`@sys/std/media-type` becomes the sole first-party authority for MIME media-type resolution,
normalization, data-URI extraction, Content-Type formatting, and textual/binary classification.
Callers own only explicit domain policy such as an unknown-value fallback or selection of a named
source-file profile.

The implementation is backed by `@std/media-types`; first-party modules do not import
`@std/media-types`, `hono/utils/mime`, or another MIME database directly. They do not maintain a
parallel general-purpose extension table, parse Content-Type parameters ad hoc, or reproduce
text-like MIME predicates.

This centralizes mechanism without pretending every use has the same policy:

```text
one registry and parser: @sys/std/media-type
  → HTTP unknown-path fallback: application/octet-stream
  → FileMap unknown-path fallback: text/plain
  → source-file profile: explicit TypeScript extension disambiguation
  → caller-provided MIME metadata: preserved, parsed, or classified rather than re-derived
```

Known protocol constants are not duplicate resolution. A JSON command endpoint may still state its
known `application/json` Content-Type directly; a GitHub request may still use a vendor-specific
`Accept` value; MediaRecorder may still negotiate codec-bearing MIME values against browser
capability. The authority rule applies when Sys derives, parses, normalizes, validates, or
classifies a media type.

## Canonical public surface

Add the leaf export `@sys/std/media-type`; keep the minimal `@sys/std` root runtime barrel
unchanged. The public runtime object is frozen and typed through the package type plane:

```ts
MediaType.fromExtension(extension, options?) → StringMimeType | undefined
MediaType.fromPath(path, options?) → StringMimeType | undefined
MediaType.fromDataUri(uri) → StringMimeType | undefined
MediaType.toContentType(mediaType) → StringContentType | undefined
MediaType.Is.valid(input) → boolean
MediaType.Is.text(input) → boolean
MediaType.Is.binary(input) → boolean
MediaType.Fallback.binary → 'application/octet-stream'
MediaType.Fallback.text → 'text/plain'
```

Public contracts live under `t.MediaType` with `Lib` first. Use a named resolution profile rather
than arbitrary local MIME maps:

```ts
type MediaType.Resolve.Profile = 'standard' | 'source';
type MediaType.Resolve.Options = {
  profile?: MediaType.Resolve.Profile;
};
```

Do not export the dependency's database or a mutable extension map. Do not add direct helper aliases
until a callsite proves they improve the leaf API.

Target module shape:

```text
code/sys/std/src/m.MediaType/
├── -test/-.test.ts
├── common.ts
├── m.Fallback.ts
├── m.Is.ts
├── m.MediaType.ts
├── mod.ts
├── t.ts
└── u/
    └── focused u.*.ts resolution, parsing, formatting, and classification kernels
```

Add `./media-type` to `code/sys/std/deno.json` and export `t.MediaType` through
`code/sys/std/src/types.ts`.

## Semantic contract

### Media type versus Content-Type

A media type is the normalized bare type, for example `text/html`. A Content-Type value may include
parameters, for example `text/html; charset=UTF-8`.

- `fromExtension`, `fromPath`, and `fromDataUri` return a bare normalized media type.
- `toContentType` formats a header value and adds the canonical charset where `@std/media-types`
  defines one.
- Callers storing `mediaType` metadata use the bare value.
- HTTP response shapers use `toContentType` after path resolution and fallback selection.
- Parsing and predicates accept parameters but compare the normalized bare type.

Do not perpetuate the existing accidental interchangeability between MIME values and complete
Content-Type header values in new APIs.

### Resolution

Use `@std/media-types@1.1.0` as the pinned registry and parser mechanism. It vendors jshttp
`mime-db`, whose data combines IANA, Apache, nginx, and other ecosystem records; extension lookup is
a deterministic convention, not a claim that IANA standardizes filename extensions. Keep that
provenance behind this facade so a future registry replacement does not alter callers.

- Extension lookup is case-insensitive and accepts a leading period.
- Path lookup considers only the final filename segment and final extension.
- Preserve extension-only dotfile behavior such as `.json` where the complete basename is a known
  extension.
- A path is not a URL parser: callers pass an admitted path or URL pathname, not query or fragment
  text.
- Unknown extensions return `undefined`; fallback is explicit at the owner.
- Inputs are pure strings and no filesystem operation occurs.

The `standard` profile follows `@std/media-types` without a local shadow table. The `source` profile
is the one centralized exception for extension ambiguity:

```text
.ts, .mts, .cts → application/typescript
.tsx             → application/typescript+jsx
```

All other source-profile extensions fall through to the standard registry. This preserves FileMap's
TypeScript text semantics without globally claiming that every `.ts` path is TypeScript; the IANA
registry maps the ambiguous standard `.ts` extension to `video/mp2t`.

### Parsing and classification

`fromDataUri` parses only the media-type portion of an RFC 2397 data URI. It normalizes valid input,
uses the RFC default `text/plain` when the type is omitted, and returns `undefined` for malformed or
non-data input. It does not decode payload bytes or require base64; encoding ownership remains with
the caller.

`Is.valid` means syntactically valid concrete media-type grammar, not proof of IANA registration. It
never throws. Reject wildcard media ranges and malformed parameter assignments at the facade before
delegating to the permissive upstream parser; this is a narrow contract guard, not a second media
type database. `Is.text` first parses and normalizes, then recognizes:

- `text/*`;
- JSON, XML, and YAML application types and structured suffixes;
- JavaScript media types;
- the centralized TypeScript source-profile values;
- SVG through its XML structured suffix.

A parameter cannot turn `application/octet-stream` into text. `Is.binary` is valid media-type input
that is not classified as text. Malformed or empty input is neither text nor binary.

### Fallbacks

Fallbacks are constants but remain caller-selected policy:

- `MediaType.Fallback.binary` for HTTP/static/object publication;
- `MediaType.Fallback.text` for FileMap's legacy unknown-file behavior;
- no implicit fallback in the canonical resolver.

## Compatibility decisions

The migration intentionally converges existing differences:

| Input           | Canonical standard media type | Source profile               | HTTP Content-Type                 |
| --------------- | ----------------------------- | ---------------------------- | --------------------------------- |
| `.html`         | `text/html`                   | same                         | `text/html; charset=UTF-8`        |
| `.js`, `.mjs`   | `text/javascript`             | same                         | `text/javascript; charset=UTF-8`  |
| `.json`         | `application/json`            | same                         | `application/json; charset=UTF-8` |
| `.yaml`, `.yml` | `text/yaml`                   | same                         | `text/yaml; charset=UTF-8`        |
| `.md`           | `text/markdown`               | same                         | `text/markdown; charset=UTF-8`    |
| `.svg`          | `image/svg+xml`               | same                         | `image/svg+xml`                   |
| `.ts`           | `video/mp2t`                  | `application/typescript`     | profile-dependent                 |
| `.tsx`          | `undefined`                   | `application/typescript+jsx` | profile-dependent                 |
| unknown         | `undefined`                   | `undefined`                  | owner fallback                    |

Consequences that must be test-pinned rather than hidden:

- HTTP may gain canonical charset parameters where Hono's small table omitted them.
- Sys Tools changes JavaScript from `application/javascript` to `text/javascript` and YAML from
  `application/yaml` to `text/yaml` when deriving from paths.
- FileMap recognizes the standard registry beyond its current small table while retaining the source
  profile and `text/plain` unknown fallback.
- FileMap MIME validation becomes syntactic rather than a private allow-list; valid custom media
  types may be encoded, with unknown textual classification defaulting to binary.
- Explicit caller-provided metadata is not silently rewritten merely because a path suggests a
  different type.

## Workspace scan

The scan covered authored source and dependency authority under:

```text
code/sys
code/sys.*
code/sys.tools
code/-tmpl
deps.yaml
imports.json
```

Generated `dist`, `.pi`, `.tmp`, `node_modules`, and `-tmp/-archive` material was inspected only as
search noise and is not migration authority. Generated artifacts are regenerated from their owners;
they are not hand-patched.

### Required migrations: resolution and response shaping

#### `@sys/http`

- `code/sys/http/src/http.server/m.HttpServer/u/u.serveFileBytes.ts`
  - replace `hono/utils/mime` with `MediaType.fromPath` plus binary fallback and
    `MediaType.toContentType`;
  - keep the primitive filesystem- and crypto-free.
- `code/sys/http/src/http.server/m.HttpServer/common.ts`
  - remove the Hono MIME re-export and route `MediaType` through the common lane.
- `code/sys/http/src/http.server/m.HttpServer/u/u.serveFileWithEtag.ts`
  - make the final emitted Content-Type canonical through `MediaType`, while preserving body, Range,
    status, and ETag behavior.
- `code/sys/http/src/http.server/m.HttpServer/u/u.serveStatic.ts`
  - remove the unexported, unused `serveStaticHono` alternate and its hidden Hono MIME authority;
  - retain the public `serveStatic` and `serveFileWithEtag` behavior.
- `code/sys/http/src/http.server/m.HttpServer/t.ts`
  - remove the unused `ServeStatic.Options.mimes` injection surface; the public implementation does
    not consume it, no authored callsite supplies it, and canonical media policy must not advertise
    a bypass map.
- Update focused file-response/static tests to assert exact canonical values and unknown fallback.
- Remove `hono/utils/mime` from `deps.yaml` and `imports.json` after its final reference is gone.

#### `@sys/fs` FileMap

- `code/sys/fs/src/m.FileMap/common.ts`
  - retire the private general extension registry and structured-text sets.
- `code/sys/fs/src/m.FileMap/m.Data.ts`
  - delegate path and data-URI media derivation to `MediaType`;
  - use the `source` profile and explicit text fallback for paths.
- `code/sys/fs/src/m.FileMap/m.Is.ts`
  - delegate validity and text/binary classification to `MediaType.Is`.
- Keep `FileMap.Data.contentType.*` and `FileMap.Is.contentType.*` as domain-compatible facades in
  this arc; do not force every FileMap consumer to import `@sys/std` directly.
- Update `m.FileMap/-test` for standard registry coverage, source ambiguity, parameters, custom
  valid values, malformed values, and unchanged text/binary round trips.

#### `@sys/tools` Serve and deploy

- `code/sys.tools/src/cli.serve/m.server/u.serve.route.ts`
  - resolve JSON-view media metadata through `MediaType`;
  - stop overriding the canonical Content-Type returned by `serveFileWithEtag` with a private bare
    MIME value.
- Retire:
  - `code/sys.tools/src/cli.serve/m.server/u.mime.ts`;
  - `code/sys.tools/src/cli.serve/m.server/-test/-u.mime.test.ts`;
  - the internal `Mime` export from `m.server/mod.ts`;
  - the closed MIME union in `cli.serve/t.mime.ts` and its aggregation when no references remain.
- Replace the deleted table test with route-level behavior proofs for canonical known and unknown
  extensions.
- `code/sys.tools/src/cli.deploy/u.providers/provider.r2/u.push.ts`
  - replace the `Mime.extensionMap` plus `FileMap` fallback chain with one canonical
    `MediaType.fromPath` plus binary fallback;
  - preserve explicit `entry.mediaType` authority.

#### `@sys/model-slug`

- `code/sys.model/model-slug/src/m.bundle/m.Transform/u.kind.tree-fs/u.path.ts`
  - replace the Markdown-only `toContentType` switch with canonical path resolution plus binary
    fallback.
- Update `u.policy.file-content.ts` tests to cover Markdown, another registered textual type,
  binary, and unknown paths.

### Required migrations: parsing and textual classification

#### `@sys/cli`

- `code/sys/cli/src/m.core/m.Fmt.Chapters/m.Resources.ts`
  - replace manual data-URI MIME slicing and `isTextMime` with `MediaType.fromDataUri` and
    `MediaType.Is.text`;
  - retain the explicit base64 requirement and payload decoding in the Resources owner.
- Extend `m.Fmt.Chapters/-test/-.test.ts` with MIME parameters, structured suffixes, malformed data
  URIs, and binary rejection.

#### `@sys/driver-cloudflare`

- `code/sys.driver/driver-cloudflare/src/m.r2/m.Files/u.cmd/read.ts`
  - replace `isTextualMediaType` and the hard-coded textual extension list with `MediaType.Is.text`
    and canonical path resolution;
  - preserve explicit object metadata precedence, URL-ref behavior, byte bounds, fatal UTF-8 decode,
    and binary refusal.
- Extend `m.r2/-test/-m.Files.test.ts` for parameterized MIME values, structured suffixes,
  source-profile values where explicitly supplied, path-derived text, and binary rejection.

### Inspected and deliberately retained

These sites mention MIME or Content-Type but do not derive or classify it and therefore should not
be mechanically rewritten:

- `code/sys/types/src/t/t.String.ts` and `t/t.Binary.ts`: global vocabulary and documentation.
- `code/sys.model/model/src/m.files*` and `code/sys/fs/src/m.Fs.capability/t.ts`: media-type fields,
  caller authority, and pass-through metadata.
- `code/sys.driver/driver-cloudflare/src/m.r2/u/u.metadata.ts` and R2 write/entry helpers: transport
  metadata pass-through.
- `code/sys/http/src/http.client/m.HttpFetch`: known body-kind defaults and caller header policy.
- `code/sys/http/src/http.cmd` and `code/sys/server/src/m.server.files/m.Http/m.manifest.ts`: known
  JSON protocol responses.
- `code/sys/http/src/http.client/m.HttpCache`: validation of received response headers, not path
  resolution.
- `code/sys.tools/src/cli.pull/u.github/u.pull.ts`: vendor-specific HTTP `Accept` constants.
- `code/sys.ui/ui-dom/src/m.File` and driver Automerge download helpers: caller/browser-provided
  Blob media types and binary fallback, with no extension database.
- `code/sys.ui/ui-components/src/ui.react/ui/Media.Recorder`: browser codec negotiation via
  `MediaRecorder.isTypeSupported`, not file MIME resolution.
- `code/sys.ui/ui-components/src/ui.react/ui/Media/m.Is.ts`: MediaStream structural guards; “media”
  does not mean MIME.
- `code/sys.driver/driver-vite/src/m.vite.transport`: Deno loader categories named “media type”, not
  MIME media types.
- Tests and fixtures containing explicit MIME literals remain literals unless their owning runtime
  behavior changes.
- Removed legacy `contentTypes` YAML migration tests in Sys Tools remain historical schema behavior.

If implementation discovers another authored first-party extension table, data-URI media parser, or
text/binary MIME predicate, add it to the appropriate unchecked commit before editing it. Do not
silently expand a commit or leave a fourth kernel.

## Commit boundaries

### 1. `feat(std): establish canonical media-type authority`

- Add the types-first `m.MediaType` leaf module and behavior tests.
- Add `@std/media-types@1.1.0` to dependency authority.
- Prove standard/source profiles, dotfiles, casing, unknowns, data URIs, Content-Type formatting,
  malformed input, parameters, and text/binary classification.
- No downstream migration in this commit.

### 2. `refactor(fs): delegate FileMap media-type semantics`

- Replace FileMap's private registry, parser, and predicates through its existing public facade.
- Pin every intentional compatibility change and preserve encoding/write behavior.
- Keep the commit green in `@sys/fs` without relying on later consumers.

### 3. `refactor(http): use canonical file media types`

- Migrate constrained bytes and ETag/static response shaping.
- Remove the unused Hono static alternate, dead `ServeStatic.Options.mimes` type surface, and
  `hono/utils/mime` subpath.
- Preserve `serveFileWithEtag`, Range, streaming, ETag, and constrained-response contracts.

### 4. `refactor(tools): remove duplicate MIME resolution`

- Retire Sys Tools Serve's MIME table/type residue.
- Migrate Serve route metadata and R2 deploy publication.
- Preserve explicit caller metadata and static-server lifecycle behavior.

### 5. `refactor(cli): centralize data-URI media classification`

- Migrate chapter resources to canonical parsing/classification.
- Keep base64 and chapter error contracts owned by CLI.

### 6. `refactor(model-slug): use canonical content types`

- Migrate tree-fs file-content derivation.
- Pin the broadened standard mapping and binary fallback.

### 7. `refactor(driver-cloudflare): centralize textual media classification`

- Migrate R2 Files inline-read admission.
- Preserve all storage, URL-ref, limit, and UTF-8 failure semantics.

Every commit includes its own tests and module check. Do not land a red test-only commit. Do not
combine this arc with Dist Server composition.

## Required proof

### Canonical kernel

- exact leaf export identity and frozen `MediaType` surface;
- standard and source profile behavior;
- extension, extension-only dotfile, path, case, and unknown handling;
- bare media type versus formatted Content-Type separation;
- RFC data-URI default and malformed-input refusal;
- parameter normalization without parameter-based binary-to-text escalation;
- JSON/XML/YAML structured suffixes, JavaScript, TypeScript source values, SVG, ordinary text,
  binary, and malformed classification;
- no filesystem, HTTP, Hono, browser, or Deno runtime authority in `m.MediaType`.

### Migration residue

After the final commit, authored first-party source must contain:

- no `hono/utils/mime` import;
- no Sys Tools `Mime.extensionMap`;
- no FileMap general-purpose extension-to-MIME table;
- no ad-hoc `isTextMime` or `isTextualMediaType` predicate;
- no path-to-Content-Type switch in model-slug;
- no direct first-party `@std/media-types` import outside `@sys/std/m.MediaType`.

Hard-coded known protocol values and explicit domain fallback values are not residue.

## Verification

Run narrow proofs first from each owner.

From `code/sys/std`:

```sh
deno task test --trace-leaks ./src/m.MediaType
deno task check
```

From `code/sys/fs`:

```sh
deno task test --trace-leaks ./src/m.FileMap
deno task check
```

From `code/sys/http`:

```sh
deno task test --trace-leaks ./src/http.server/m.HttpServer/-test/-u.serveFileBytes.test.ts
deno task test --trace-leaks ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts
deno task test
deno task check
```

From `code/sys.tools`:

```sh
deno task test:serve
deno task test:deploy
deno task check
```

From `code/sys/cli`:

```sh
deno task test --trace-leaks ./src/m.core/m.Fmt.Chapters/-test/-.test.ts
deno task check
```

From `code/sys.model/model-slug`:

```sh
deno task test --trace-leaks ./src/m.bundle/m.Transform/u.kind.tree-fs/-test/-u.policy.file-content.test.ts
deno task check
```

From `code/sys.driver/driver-cloudflare`:

```sh
deno task test --trace-leaks ./src/m.r2/-test/-m.Files.test.ts
deno task check
```

Then run full tests for every touched package and the final workspace checks through declared root
tasks. Run formatting and lint only over touched source and generated dependency surfaces before the
final workspace pass. Clean-tree publish dry-runs belong to the later release boundary; do not use
an `--allow-dirty` publishing path to validate this WIP.

Run canonical dependency preparation after dependency edits and retain only generator output caused
by this arc. Do not absorb unrelated template drift.

## Non-goals

- no implementation while authoring or reviewing this plan;
- no MIME sniffing from bytes;
- no filesystem reads in `@sys/std/media-type`;
- no content negotiation, `Accept` matching, compression selection, or upload policy;
- no rewrite of explicit caller-provided media metadata from a filename;
- no global replacement of known `Content-Type` or `Accept` literals;
- no change to MediaRecorder codec negotiation or Deno loader categories;
- no hand-editing generated caches, package `dist`, `.tmp`, `.pi`, `node_modules`, or archives;
- no Dist Server composition in this arc;
- no arbitrary public extension-map injection until a real consumer proves named profiles are
  insufficient.
