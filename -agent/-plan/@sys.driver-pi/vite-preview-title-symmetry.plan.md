vite-preview-title-symmetry.plan.md
- [x] eb847da61 feat(std): add canonical package-subpath normalization
- [x] ef4098384 feat(cli): support compound package-application headers
- [x] 03b886cb5 feat(server): add package-subpath terminal serve identity
- [x] 25d6e89b1 feat(driver-vite): align dev and serve package-subpath identity
- [x] 4e2dc17c9 refactor(driver-pi): centralize Vite UI identity

## Purpose

Make `deno task dev` and `deno task serve` render one truthful `@sys/driver-pi/ui` application
identity through symmetric upstream APIs. `@sys/driver-pi` owns only the semantic `ui` subpath;
upstream packages own composition, validation, terminal styling, width pressure, and rendering.

## Initial observations (resolved)

Before implementation:

- `deno task dev` passed `--pkg-subpath=ui` directly to `ViteEntry.dev`.
- `ViteEntry.dev` synthesized a new `t.Pkg` whose `name` was `@sys/driver-pi/ui`; the Vite screen
  then parsed that name to bold the package root and dim `/ui`.
- `deno task serve` exposed no parallel package-subpath input. `DistServer.Local.serve` rendered the
  verified Dist package identity, so the header stopped at `@sys/driver-pi`.
- `@sys/driver-vite` and `@sys/server` contained duplicate scoped/unscoped package-name splitting
  and ANSI composition for the same header hierarchy.
- `Cli.Fmt.Header` owned package-backed title pressure, but the committed contract had no compound
  package-application identity or shared package-subpath normalization.
- `Pkg.toFileNamespace` contained an older, stricter subpath-normalization path, confirming that the
  package domain—not a renderer or entrypoint—was the earned owner of the shared normalization
  kernel.

This was not a missing string at the task call site. It was a missing normalized semantic lane
through package parsing, shared header identity, and terminal-entry contracts.

## Max-review decision

Use `pkgSubpath` as the canonical transport noun and `subpath` inside a compound package-application
identity. Do not extend or intersect `t.Pkg`, and do not introduce an arbitrary `title` override
into `DistServer`.

Why:

- `/ui` is specifically a package application subpath, not an unconstrained title.
- `t.Pkg` is truthful package metadata. `t.Pkg & { subpath: string }` remains structurally
  assignable to `t.Pkg`, so presentation state could escape into metadata, verification, build, or
  HTTP APIs.
- Sibling optional fields are wrong at the render boundary: `{ pkgSubpath: 'ui' }` is representable
  without a package and can only be ignored. The header must instead accept either a plain `t.Pkg`
  or a non-assignable compound `{ root: t.Pkg; subpath: string }` identity.
- Raw `pkgSubpath` remains correct at ingress boundaries where the package is derived later: Vite
  entry derives the package from `deno.json`, while Dist serve obtains it only from verified
  evidence. Those boundaries parse the raw value before carrying it inward.
- One pure `Pkg.Subpath.parse` kernel must own absent/invalid/normalized classification. Independent
  public boundaries may invoke it defensively, but no package may reimplement its grammar.
- Package-name splitting, root/subpath styling, compact ownership, and width pressure remain one
  implementation in `Cli.Fmt.Header`; normalization and rendering are related but distinct owners.
- The same semantic input can flow through dev and verified preview modes without preview
  orchestration rediscovering project metadata from an unrelated current directory.

Canonical propagation:

```text
@sys/driver-pi: raw "ui"
  → Pkg.Subpath.parse: { kind: "valid", value: "ui" }
  → ViteEntry dev/serve orchestration: normalized pkgSubpath
  → dev: loaded t.Pkg | serve: verified Dist t.Pkg
  → Cli.Fmt.Header.PackageIdentity: t.Pkg | { root: t.Pkg; subpath: "ui" }
  → @sys/driver-pi/ui
```

The raw field appears only while package authority is unavailable or while crossing a public
ingress. Renderer contracts carry the compound identity, never sibling `pkg` / `pkgSubpath` fields.

### DMIND fit

- **Subject:** one package-backed application identity, not a title string and not a route.
- **Need:** preserve package truth while naming the application surface consistently in dev and
  verified preview terminals.
- **Affordance:** package-only callers keep passing `t.Pkg`; application callers add one explicit
  compound wrapper only when a subpath exists.
- **Constraint:** serve cannot compose the identity until verification reveals the truthful package;
  dev can compose it after loading `deno.json`.
- **Feedback:** invalid ingress fails before side effects, direct formatter misuse falls back to the
  truthful root, and width pressure always retains package ownership.
- **Fit:** raw transport, package normalization, metadata authority, and terminal rendering each
  have one owner and meet only at explicit boundaries.

### Rejected shapes

- `t.Pkg & { subpath: string }` or `subpath?: string` on `t.Pkg`: structurally leaks presentation
  into metadata consumers.
- `Cli.Fmt.Header.Options.pkgSubpath`: admits orphan state and repeats a relation the type can
  contain.
- A global `t.PkgIdentity` / branded subpath framework: generalizes beyond the one earned shared
  primitive and invites routing or metadata reuse.
- Formatter-owned normalization: forces non-rendering ingress validation to depend on presentation.
- Local entry/server normalizers: guarantees semantic drift and leaves `Pkg.toFileNamespace` as a
  third grammar.
- A generic server `title`: widens authority, loses package semantics, and reopens caller-owned
  ANSI.

## Public contract shape

### `@sys/std`

Add one package-owned, pure normalization kernel:

```ts
Pkg.Subpath.parse(input: unknown):
  | { readonly kind: 'absent' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'valid'; readonly value: string };
```

Contract:

- `undefined`, outer-whitespace-only, and slash-only input is `absent`.
- Plain strings are outer-trimmed, empty `/` segments are removed, and remaining segments are joined
  with one `/`; parsing an already-normalized value is idempotent.
- Non-string input and strings containing ANSI/control/format hazards are `invalid`. Reject C0/C1,
  Unicode line/paragraph separators, and invisible Unicode format controls so the subpath lane
  cannot inject row breaks, bidi overrides, or escape sequences.
- Parsing is total, deterministic, allocation-bounded by the input, and never throws or reads object
  properties.
- Parsing does not resolve dot segments, percent-decode, case-fold, infer filesystem paths, or
  create URL/routing authority.
- Return shared frozen `absent` / `invalid` sentinels and a frozen `valid` result.
- Reuse this kernel beneath `Pkg.toFileNamespace`; retain that API's existing stricter namespace
  character validation after canonical subpath parsing.

Do not add `subpath` to `t.Pkg`, add a branded global string, or create a generalized application
identity framework. The earned shared primitive is the package-subpath parser only.

### `@sys/cli`

Replace sibling package/subpath options with one presentation-local union:

```ts
export type PackageIdentity =
  | t.Pkg
  | { readonly root: t.Pkg; readonly subpath: string };

Cli.Fmt.Header.rows({
  pkg: subpath ? { root: pkg, subpath } : pkg,
  width,
  tone,
});
```

Contract:

- `pkg?: PackageIdentity` is the only package-identity field; remove `pkgSubpath` from `Options`.
- Plain `t.Pkg` preserves every existing package-only call without wrapping.
- The compound branch is not structurally assignable to `t.Pkg`, so the subpath cannot masquerade as
  metadata. Project the canonical type as `t.Cli.Fmt.Header.PackageIdentity` for presentation
  consumers; downstream packages may construct values but must not redefine the type shape.
- `root` remains package/version authority. `subpath` is plain, presentation-only input and is
  parsed through `Pkg.Subpath.parse`; an invalid runtime value safely degrades to the truthful root
  package.
- A valid subpath renders as one leading `/` plus normalized content.
- Canonical callers keep the base package in `root.name`. The formatter preserves compatibility for
  already-composed package names by parsing scoped roots after `@scope/name` and unscoped roots
  after the first segment, parsing the embedded suffix through the same `Pkg.Subpath` kernel, and
  joining it with the compound subpath.
- The package root is bold, while the complete `/subpath` suffix is dim in the selected tone.
- Full and compact candidates retain package ownership: `@scope/name/ui` may compact to `name/ui`,
  never to the orphan leaf `ui`.
- Preserve the existing pressure order across full/compact identity and detail/version candidates;
  final ellipsis derives from the complete compact package/subpath identity.
- Existing custom `title` precedence and ANSI-preservation behavior remain unchanged. A custom title
  replaces the left package identity while the root package may still supply the default version.

Move duplicated scoped/unscoped splitting from `@sys/driver-vite` and `@sys/server` into this
formatter. Remove the provisional private CLI normalizer and control scanner. Do not expose a second
public package-title helper; `Header.rows` owns rendering and `Pkg.Subpath.parse` owns
normalization.

### `@sys/server`

Package-subpath identity is terminal presentation, not hosting authority. Keep it out of
non-terminal `start` inputs.

Introduce serve-specific argument surfaces for both authority modes:

```ts
DistServer.serve(args: DistServer.Serve.Args);
DistServer.Local.serve(args: DistServer.Local.ServeArgs);
```

Each extends its corresponding start requirements with raw optional `pkgSubpath`. Pinned and locally
verified terminal serve modes must remain presentation-symmetric. This standalone field is valid
here because the truthful package is not available until verification completes.

Add serve-specific strict snapshots that classify the field with `Pkg.Subpath.parse` before the
first asynchronous boundary and return separate `{ start, pkgSubpath }` data. Preserve own-data
descriptor handling. Reject `invalid`, retain normalized `valid`, treat `absent` as omitted, and
pass only `start` into `startWith` / `startLocalWith`; never widen either start snapshot's allowed
keys.

Carry the normalized value through the terminal loop only. After verified package resolution,
compose `t.Cli.Fmt.Header.PackageIdentity` once and pass it into `DistServeScreen`. The screen
contract carries that identity—not sibling package/subpath fields—and delegates it directly to
`Cli.Fmt.Header`. Delete local package parsing and ANSI assembly.

Do not pass the subpath or compound identity into `HttpServer.start`, service status, verification
evidence, raw startup printing, `Started`, or any hosting lifecycle object. Raw mode must not
compose or render application identity.

### `@sys/driver-vite`

Make package-subpath identity a first-class dev input rather than encoding it inside `t.Pkg.name`:

```ts
Vite.dev({ pkg, pkgSubpath });
ViteEntry.dev({ cmd: 'dev', pkgSubpath });
ViteEntry.serve({ cmd: 'serve', pkgSubpath });
```

Requirements:

- Model `Vite.Dev.Args` as a base options shape intersected with a package-input union: the branch
  without `pkg` declares `pkgSubpath?: never`; the branch with `pkg: t.Pkg` permits optional raw
  `pkgSubpath`. This preserves existing `{ pkg }` calls while making an orphan programmatic subpath
  unrepresentable.
- At runtime, classify the public dev input through `Pkg.Subpath.parse`; reject invalid input and a
  valid orphan supplied from untyped JavaScript before process work begins.
- Keep `pkg` byte-for-byte equal to metadata loaded from `deno.json`; do not synthesize a package
  name containing the subpath or spread presentation fields into it.
- Keep camel-case programmatic input and `pkg-subpath` CLI spelling as one logical option on both
  entry variants. A focused shared entry resolver invokes `Pkg.Subpath.parse` for each present
  alias.
- If either spelling is invalid, fail. If both normalize to distinct valid values, fail. Matching
  normalized values are idempotent; absent plus valid resolves to valid; both absent resolves
  absent.
- Dev forwards the normalized subpath into `Vite.dev`; serve forwards it into
  `DistServer.Local.serve`.
- Compose `t.Cli.Fmt.Header.PackageIdentity` once when the dev reporter is created. Internal screen
  runtime and frame contracts carry an `identity` field, never sibling `pkg` / `pkgSubpath` fields.
- Delete Vite-local package-name splitting and route startup and ready headers directly through
  `Cli.Fmt.Header.rows({ pkg: identity, ... })`.
- Omitting the option preserves existing dev and serve behavior, including raw reporter output.

### `@sys/driver-pi`

The package-local Vite adapter owns one constant:

```ts
const PKG_SUBPATH = 'ui';
```

Replace the immediate side-effect-only `@sys/driver-vite/main` import with a typed adapter around
`ViteEntry.main`. Parse arguments through canonical `Args.parse`, then apply `PKG_SUBPATH` only to
`dev` and `serve` variants. `build` and `info` must remain structurally unchanged.

The adapter must classify caller input through the same `Pkg.Subpath.parse` kernel and reject a
conflicting caller-supplied subpath rather than silently overriding the package-owned identity.
Matching normalized input is idempotent. Remove `--pkg-subpath=ui` from `deno.json`; no task command
may repeat the literal.

`@sys/driver-pi` must not:

- construct `@sys/driver-pi/ui`;
- read or modify Dist metadata;
- parse package names;
- assemble ANSI styling;
- branch on terminal width or reporter mode;
- reach into Vite or server screen internals.

## Commit boundaries

### `feat(std): add canonical package-subpath normalization`

- Add the tri-state `Pkg.Subpath.parse` contract and pure implementation.
- Prove absent, invalid, normalized, nested, repeated-separator, idempotent, ANSI/control/format,
  and hostile non-string cases.
- Reuse the parser beneath `Pkg.toFileNamespace` while preserving its stricter public behavior.

### `feat(cli): support compound package-application headers`

- Replace the provisional sibling field with the canonical `PackageIdentity` union and project it
  through the public CLI type namespace.
- Consume `Pkg.Subpath.parse`; remove the private normalization/control implementation.
- Implement scoped and unscoped root/subpath rendering in `Cli.Fmt.Header` only.
- Lock full, compact, and ellipsized pressure behavior for scoped/unscoped package-only, compound,
  embedded-subpath compatibility, nested-subpath, malformed-runtime, and custom-title cases.
- Preserve all existing package-only and custom-title snapshots.

### `feat(server): add package-subpath terminal serve identity`

- Add distinct pinned/local serve argument types without broadening start APIs.
- Snapshot and validate the presentation field alongside existing strict input authority.
- Carry it through both terminal-owned serve paths into `DistServeScreen` only.
- Delete local package-title parsing and consume `Cli.Fmt.Header` package-subpath support.
- Prove pinned/local parity, raw-mode non-effect, omitted-input compatibility, repaint stability,
  and separation from `name`, status, verification, and HTTP startup options.

### `feat(driver-vite): align dev and serve package-subpath identity`

- Add the core dev and entry serve type surfaces.
- Centralize camel/kebab resolution and normalization.
- Stop mutating `pkg.name` in dev entry orchestration.
- Forward the same semantic subpath to Vite dev reporting and local Dist preview serving.
- Delete Vite-local package-title parsing and consume the canonical CLI header contract.
- Prove exact forwarding, conflict failure, omitted-input compatibility, startup/ready parity, and
  width-pressure behavior.

### `refactor(driver-pi): centralize Vite UI identity`

- Add the typed task adapter and one `ui` constant.
- Remove the inline task flag from `deno.json`.
- Prove dev/serve injection, build/info non-injection, matching-input idempotence, and
  conflicting-input failure.
- Runtime-probe both terminal modes against the package-local tasks.

## Invariants

- Dev and serve show the same bold `@sys/driver-pi` plus dim `/ui` hierarchy at equivalent widths.
- The dev package object and verified Dist package remain truthful base package metadata.
- `t.Pkg` never gains `subpath`, is never intersected with presentation state, and is never
  rewritten to contain `/ui`.
- `Pkg.Subpath.parse` is the only package-subpath normalization grammar. Public boundaries may
  invoke the idempotent parser independently; they may not duplicate its implementation.
- Raw ingress may carry `pkgSubpath` while package authority is unavailable. Renderer contracts
  carry only `t.Cli.Fmt.Header.PackageIdentity`, never sibling package/subpath fields.
- Package subpath affects terminal identity only; it never changes routing, served roots, browser
  paths, document titles, hashes, manifests, verification, authority, status, or HTTP lifecycle
  name.
- Pinned and locally verified terminal serve APIs expose the same presentation capability.
- Invalid public ingress fails before process/hosting work; malformed direct formatter runtime input
  degrades to truthful package-only presentation without throwing.
- Raw/non-interactive output receives no new screen decoration or synthetic package metadata.
- Existing consumers that omit `pkgSubpath` retain their current public behavior.
- Package/subpath splitting and styling have one implementation owner: `Cli.Fmt.Header`.
- `@sys/driver-pi` contains exactly one live `ui` identity literal for this task surface.

## Proof

Run narrow proof in dependency order:

1. `cd /Users/phil/code/org.sys/sys/code/sys/std && deno task test --trace-leaks ./src/m.Pkg`
2. `cd /Users/phil/code/org.sys/sys/code/sys/cli && deno task test --trace-leaks ./src/m.core/m.Fmt/-test/-m.Fmt.Header.test.ts`
3. `cd /Users/phil/code/org.sys/sys/code/sys/server && deno task test --trace-leaks ./src/m.server.dist`
4. `cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite && deno task test --trace-leaks ./src/m.vite/-test/-u.dev.screen.test.ts ./src/m.vite/-test/-u.dev.screen.runtime.test.ts ./src/-entry`
5. `cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-pi && deno task test:unit`

Then run each touched package's `deno task check` and full declared `deno task test` from its owning
module directory.

Runtime proof from `/Users/phil/code/org.sys/sys/code/sys.driver/driver-pi`:

1. Run `deno task dev`; verify `@sys/driver-pi/ui`, existing Vite metadata, resize behavior, and
   keyboard lifecycle.
2. Run `deno task serve`; verify `@sys/driver-pi/ui`, verified Dist metadata, `UNPINNED` authority,
   resize behavior, and keyboard lifecycle.
3. Confirm any version difference remains truthful to each mode's existing package/Dist source; this
   work aligns application identity and does not disguise a stale build.

Residue scan:

```text
rg -n "normalizePkgSubpath|hasControl" /Users/phil/code/org.sys/sys/code/sys/cli/src /Users/phil/code/org.sys/sys/code/sys/server/src /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src /Users/phil/code/org.sys/sys/code/sys.driver/driver-pi/-scripts
rg -n "firstSlash|subpathAt|headerTitle|packageTitle" /Users/phil/code/org.sys/sys/code/sys/cli/src/m.core/m.Fmt /Users/phil/code/org.sys/sys/code/sys/server/src/m.server.dist /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src
rg -n "withSubpath|name:.*subpath|name.*pkgSubpath" /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src /Users/phil/code/org.sys/sys/code/sys/server/src/m.server.dist
rg -n "pkg-subpath=ui" /Users/phil/code/org.sys/sys/code/sys.driver/driver-pi/deno.json /Users/phil/code/org.sys/sys/code/sys.driver/driver-pi/-scripts
rg -n "['\"]ui['\"]" /Users/phil/code/org.sys/sys/code/sys.driver/driver-pi/-scripts
```

The first scan must return no private normalization/control copies. The second must show
package-name splitting only in the canonical CLI implementation. The third must return no
package-name synthesis. The fourth must return no inline task flag. The fifth must show one
package-owned identity literal; tests reuse the exported constant rather than restating it.

## Completion record

### Landed arc

- `eb847da61 feat(std): add canonical package-subpath normalization`
- `ef4098384 feat(cli): support compound package-application headers`
- `03b886cb5 feat(server): add package-subpath terminal serve identity`
- `25d6e89b1 feat(driver-vite): align dev and serve package-subpath identity`
- `4e2dc17c9 refactor(driver-pi): centralize Vite UI identity`

All five commits are reachable from `HEAD` in arc order. The final Driver Pi adapter owns only the
`ui` package-subpath policy; `Pkg.Subpath.parse` remains the normalization owner, `ViteEntry`
remains the generic alias-reconciliation owner, and `Cli.Fmt.Header` remains the rendering owner.

### Verification

- Narrow dependency proofs and checks passed for `@sys/std`, `@sys/cli`, `@sys/server`, and
  `@sys/driver-vite`; the final Driver Vite internal suite passed 63 files / 370 steps.
- Driver Pi adapter proof passed 7 steps. Its final declared suite passed 52 files / 291 steps; the
  profile subset passed 19 files / 148 steps. Driver Pi check, formatting, and diff checks passed.
- Final residue scans found no private subpath grammar, package-name synthesis, inline
  `--pkg-subpath=ui` task flag, or duplicate Driver Pi `ui` identity literal.
- `deno task dev` reached Vite startup, then could not bind its keyboard listener because the probe
  had no TTY (`ENODEV`). `deno task serve` started locally verified Dist and stayed active until the
  bounded probe ended. Both probes were raw/non-TTY, so neither was evidence of decorated terminal
  header rendering.
- The Driver Vite published-consumer external gate remains blocked only by the configured minimum
  dependency age for published `@sys/driver-vite@0.0.474`; no provenance policy was bypassed.

## Non-goals

- No arbitrary Dist-server title or caller-owned ANSI API.
- No `t.Pkg` extension/intersection, global package-identity abstraction, or branded subpath string.
- No generalized application-identity framework.
- No Dist manifest rewrite, synthetic package version, or preview-time project-config discovery.
- No HTTP server `name` reinterpretation.
- No production route, `/ui` URL, browser document-title, build-output, or deployment change.
- No unrelated terminal header redesign.
