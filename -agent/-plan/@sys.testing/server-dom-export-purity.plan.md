server-dom-export-purity.plan.md
- [x] 148ce7608 feat(testing): expose explicit server DOM entry
- [x] e4346b2b8 refactor(testing): migrate DomMock consumers to explicit entry
- [x] 6b17833d6 refactor(testing): remove DomMock from broad server surfaces
- [x] abdacf7ea refactor(testing): remove redundant Bdd runtime facade

## Purpose

Make server-side DOM emulation an explicit capability without changing `DomMock` behavior, identity,
or low-level ownership.

The target import grammar is:

```text
@sys/std/testing/server/dom → low-level DomMock substrate
@sys/testing/server/dom     → preferred system testing facade
```

The broad server surfaces become DOM-emulation-free:

```text
@sys/std/testing/server     → BDD and server testing primitives
@sys/testing/server         → server, filesystem, browser, and BDD helpers
```

`@sys/testing/web` remains the host-neutral Web Standards fixture lane. It must not import or
re-export `DomMock` or `happy-dom`.

## Design decision

Keep the implementation in `@sys/std`; isolate its export.

Reachable history establishes the ownership sequence:

- `135decf806193e5110b36453f7efdd1115cbf7e2` introduced the dedicated `DomMock` module in
  `@sys/testing` after moving the concern out of `@sys/ui-dom`.
- `c838ed98e809799aaa487a6db184a344d095e618` moved that implementation into `@sys/std` while
  aligning `Is.browser()` with the `__SYS_BROWSER_MOCK__` test-environment marker.
- The current dependency direction is `@sys/testing → @sys/std`; moving the implementation back
  would invert that direction, create a test-layer cycle, or duplicate the primitive.

Physical ownership in `@sys/std` is therefore a justified low-level testing exception. Public
placement on the broad server barrel is not required by that ownership and is the boundary this plan
corrects.

## Review result

The refactor is warranted, but only as an export-boundary and consumer-migration campaign.

Material findings incorporated into this plan:

1. Moving `DomMock` to `@sys/testing/web` would make a host-neutral entry depend on a server DOM
   emulator and is rejected.
2. Keeping a compatibility re-export on either broad server surface would retain the static
   `happy-dom` graph and defeat the final purity claim.
3. The new `@sys/testing/server/dom` value surface requires a matching `@sys/testing/t` contract
   bridge.
4. Generic test templates currently expose `DomMock` without demonstrated need and must stop
   propagating that default.
5. Live deploy consumers are part of the migration boundary; a `code/`-only sweep is incomplete.
6. Archived material under `-tmp/-archive` is historical evidence and must not be rewritten.
7. At plan authoring, `code/sys.driver/driver-pi/src/-test/mod.ts` contained unrelated live deltas;
   implementation must re-observe that path, preserve any surviving unrelated bytes, and report it
   as mixed deltas only if overlap still exists.

## 100-year invariants

### Honest import semantics

- Importing a broad server testing surface must not imply DOM emulation.
- Importing `server/dom` explicitly opts into the `happy-dom` module graph and process-global DOM
  lifecycle.
- An API consumer should be able to infer the exceptional capability from the specifier alone.

### Runtime identity and behavior

- `DomMock` remains the same frozen object exported by `code/sys/std/src/m.Testing.DomMock/mod.ts`.
- `init`, `polyfill`, `unpolyfill`, `isPolyfilled`, `Fake`, `Keyboard`, and `Mouse` retain their
  current contracts.
- No wrapper, proxy, clone, or second namespace identity is introduced.
- No asynchronous lazy-loading layer is introduced; `polyfill()` remains synchronous.
- No global is mutated merely by the @sys module code importing the dedicated entry.

### Lifecycle truth

The current implementation imports `happy-dom` and captures original globals at module evaluation,
then mutates globals only when `polyfill()` or `init()` runs. Restoration therefore targets the
module's captured baseline, and overlapping DOM owners remain unsupported.

This plan makes that exceptional lifecycle explicit at import time. It does not redesign snapshot
semantics, add nesting, or claim concurrency safety that the implementation does not provide.

### Type-plane truth

- `@sys/std/t` remains the defining type authority for `DomMock`.
- `@sys/testing/t` re-exports the complete semantic owner and required public support type rather
  than reconstructing or flattening the contract.
- `t.ts` and `types.ts` changes remain type-only.

### Compatibility truth

- Removing `DomMock` from the broad server entries is an intentional public API break.
- The workspace migrates atomically before broad removal.
- No deprecated broad alias survives the final item because static ESM re-export would preserve the
  dependency graph.
- Release/version composition remains owned by the normal workspace release process; implementation
  does not hand-edit generated package metadata.

## Target surfaces

### `@sys/std`

Add:

```text
@sys/std/testing/server/dom
```

Use an explicit JSR-facing export module, following the existing `src/-exports/` grammar, that
re-exports the canonical `DomMock` value from `m.Testing.DomMock/mod.ts`.

Keep clean:

```text
@sys/std
@sys/std/testing
@sys/std/testing/server
```

The root and universal testing entries already exclude `DomMock`; the final item removes it from the
broad server entry.

### `@sys/testing`

Add:

```text
@sys/testing/server/dom
```

The entry is a thin facade over `@sys/std/testing/server/dom`. Add only the module files earned by
that public boundary:

```text
src/m.server/m.DomMock/mod.ts
src/m.server/m.DomMock/t.ts
```

Expose the type bridge from `src/types.ts`. Preserve the dependency's semantic names:

```ts
t.DomMock.Lib;
t.DomMockInitArgs;
```

Do not duplicate the type definitions locally.

## Commit 1 — explicit entry

`feat(testing): expose explicit server DOM entry`

### Changes

1. Add `./testing/server/dom` to `code/sys/std/deno.json` through a dedicated
   `src/-exports/-testing.server.dom.ts` module.
2. Add `./server/dom` to `code/sys/testing/deno.json` through `src/m.server/m.DomMock/mod.ts`.
3. Add the type-only dependency bridge in `src/m.server/m.DomMock/t.ts` and export it from
   `code/sys/testing/src/types.ts`.
4. Add identity and type-contract tests at both package boundaries, and add the facade value to the
   `@sys/testing` namespace-freeze contract.
5. Update public module examples and `code/sys/testing/README.md` to teach the explicit entry.
6. Retain the old broad exports temporarily so this additive commit remains independently green.

### Proof

- Before the export-map changes, imports from both new specifiers fail for the intended
  missing-entry reason.
- After the change, both new entries resolve to the canonical frozen `DomMock` object by identity.
- `@sys/testing/t` exposes the same `DomMock.Lib` contract as `@sys/std/t`.
- Package checks, tests, and publish dry-runs pass for `@sys/std` and `@sys/testing`.

## Commit 2 — consumer migration

`refactor(testing): migrate DomMock consumers to explicit entry`

Every live consumer must either import `DomMock` from the explicit entry or stop exporting it. Do
not mechanically preserve speculative test-barrel surface.

### Repoint demonstrated consumers

Split `DomMock` from the broad server export in these live owners:

```text
code/sys.ui/ui-dom/src/-test.ts
code/sys.ui/ui-css/src/-test/mod.ts
code/sys.ui/ui-dev/src/ui.react.devharness/-test/mod.ts
code/sys.ui/ui-react/src/-test.ts
code/sys.ui/ui-react/src/m.testing.server/common.ts
code/sys.ui/ui-components/src/-test/mod.ts
code/sys.ui/ui/src/-test/mod.ts
code/sys.driver/driver-monaco/src/-test/mod.ts
deploy/@tdb.slc/src/ui.content/ui/-test/-u.VideoWarmup.test.ts
```

`@sys/ui-react/testing/server` intentionally remains a higher-level server rendering surface that
exports `DomMock`; its internal source changes to the dedicated upstream entry while its own public
contract remains stable.

### Remove speculative barrel exports

Remove `DomMock` rather than repointing it where the live workspace contains no use beyond the
barrel:

```text
code/sys.tools/src/-test/mod.ts
code/sys/event/src/-test/mod.ts
code/sys/cell/src/-test/mod.ts
code/sys/web/src/-test/mod.ts
code/sys/server/src/-test/mod.ts
code/sys.model/model-slug/src/-test/mod.ts
code/sys.driver/driver-automerge/src/-test/mod.ts
code/sys.driver/driver-cloudflare/src/-test/mod.ts
code/sys.driver/driver-pi/src/-test/mod.ts
code/sys.driver/driver-prosemirror/src/-test/mod.ts
code/sys.driver/driver-signer/src/-test/mod.ts
code/sys.driver/driver-stripe/src/-test/mod.ts
deploy/@draft.shell/src/-test/mod.ts
deploy/@tdb.data/src/-test/mod.ts
deploy/@tdb.edu.slug/src/-test/mod.ts
deploy/@tdb.edu.slug/src/m.slug.compiler/-test.ts
deploy/@tdb.slc.std/src/-test/mod.ts
```

If fresh live evidence establishes a real consumer in one of these owners, repoint that owner
instead of deleting its local surface. Path proximity or historical use is not evidence.

### Correct templates

Remove speculative `DomMock` exports from:

```text
code/-tmpl/-templates/tmpl.pkg/src/-test/mod.ts
code/-tmpl/-templates/tmpl.repo/code/common/-test.ts
```

Do not add the dedicated import to a generic template. A generated package opts in only when a real
DOM test earns the capability.

### Internal std test lane

Remove `DomMock` from `code/sys/std/src/-test.ts` after the small number of std tests that need it
import the canonical internal module directly. This prevents unrelated std tests from inheriting the
same `happy-dom` graph through the internal convenience barrel.

### Proof

- Existing DOM suites retain behavior without test-body rewrites.
- Dead-barrel removals type-check, proving no live consumer depended on the speculative surface.
- Template tests prove newly materialized package/repository test barrels omit `DomMock`.
- No live `code/` or `deploy/` source imports `DomMock` from either broad server entry.
- No file under `-tmp/-archive` changes.

## Commit 3 — broad removal

`refactor(testing): remove DomMock from broad server surfaces`

### Changes

1. Remove the `DomMock` re-export from `code/sys/std/src/m.Testing.Server/mod.ts`.
2. Remove the `DomMock` re-export from `code/sys/testing/src/m.server/common.ts`.
3. Update the existing std `DomMock` public-entry test to use `@sys/std/testing/server/dom`.
4. Add negative surface tests proving `DomMock` is absent from both broad server modules.
5. Rescan module docs, README examples, templates, package barrels, and deploy tests for stale broad
   imports.

### Negative contract

The final public shape must make these observations true:

```ts
'DomMock' in (await import('@sys/std/testing/server')) === false;
'DomMock' in (await import('@sys/testing/server')) === false;
```

The dedicated imports must still return the canonical object by identity.

### Graph proof

From `/Users/phil/code/org.sys/sys`, inspect all four graphs:

```sh
deno info @sys/std/testing/server
deno info @sys/testing/server
deno info @sys/std/testing/server/dom
deno info @sys/testing/server/dom
```

Required result:

- neither broad graph contains `happy-dom` or `m.Testing.DomMock`;
- both dedicated graphs contain the canonical `DomMock` implementation and `happy-dom`; and
- `@sys/testing/web` remains independent of both.

Do not claim graph purity from export-name tests alone; retain the direct graph observation in the
implementation proof report.

## Commit 4 — remove redundant Bdd runtime facade

`refactor(testing): remove redundant Bdd runtime facade`

### Changes

1. Retain the Deno-native BDD runner and its `Bdd` type namespace in `@sys/types/testing`; it owns
   suite registration, hooks, contexts, focus, policy forwarding, and rollback semantics.
2. Remove only the redundant frozen `Bdd` value aggregate, `Testing.Bdd` property, and `t.Bdd.Lib`
   facade contract from `@sys/std/testing`, its broad server surface, and `@sys/testing/server`.
3. Migrate the demonstrated `Testing.Bdd.afterEach(...)` consumers in the `HttpPull` tests to the
   direct `afterEach` export. Route `afterEach` and existing `WebFixture` dependencies through the
   package-global `code/sys/http/src/-test.ts` barrel rather than importing `@sys/testing` directly
   below that boundary.
4. Remove identity and namespace-freeze assertions whose only purpose is to prove the deleted value
   facade. Preserve runner behavior and contract tests at `@sys/types/testing`.
5. Do not retain a compatibility alias: the direct BDD function exports are the sole runtime
   surface.

### Proof

- The type/export surface excludes the deleted `Bdd` value from `@sys/std/testing`,
  `@sys/std/testing/server`, and `@sys/testing/server`; direct `describe`, `it`, hooks, `expect`,
  and `expectError` retain their canonical identities across the public entries.
- No redundant runtime negative assertions such as `'Bdd' in module` are retained; export/type
  checking and positive direct-symbol identity tests own this contract.
- `@sys/types/testing` continues to expose and prove the Deno-native runner and its `Bdd` type
  namespace.
- Repository scans find no runtime `Testing.Bdd` access, `Bdd` value re-export, or direct
  `@sys/testing` import below the `@sys/http` package test barrel after migration.
- Package checks, tests, and publish dry-runs pass for `@sys/std` and `@sys/testing`; the affected
  `@sys/http` test surface passes through its declared task authority.

## Verification

### Narrow package authority

Run from each owning module using its declared tasks:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/std
deno task check
deno task test
deno task dry

cd /Users/phil/code/org.sys/sys/code/sys/testing
deno task check
deno task test
deno task dry

cd /Users/phil/code/org.sys/sys/code/-tmpl
deno task check
deno task test
```

Run `deno task check` and the narrowest relevant `deno task test` from each demonstrated consumer
package changed by the migration. The minimum behavioral set includes:

```text
@sys/ui-dom
@sys/ui-css
@sys/ui-dev
@sys/ui-react
@sys/ui-components
@sys/ui
@sys/driver-monaco
```

Run the direct deploy proof from its owning module:

```sh
cd /Users/phil/code/org.sys/sys/deploy/@tdb.slc
deno task check
deno task test --trace-leaks ./src/ui.content/ui/-test/-u.VideoWarmup.test.ts
```

### Final workspace proof

After narrow proof is green, run from `/Users/phil/code/org.sys/sys`:

```sh
deno task check
deno task test
deno task dry
```

If a full task exposes unrelated concurrent failures, report them separately with exact paths and
retain the completed narrow proof. Do not weaken or bypass checks.

## Acceptance criteria

- `@sys/std/testing/server/dom` is the sole public std runtime entry for `DomMock`.
- `@sys/testing/server/dom` is the preferred public system entry for `DomMock`.
- `@sys/testing/t` exposes the public `DomMock` contract without duplicating it.
- Broad std/testing server imports do not resolve or evaluate the `happy-dom` graph.
- Dedicated entries preserve runtime object identity, namespace freezing, and lifecycle behavior.
- `@sys/testing/web` remains host-neutral and unchanged in purpose.
- All live workspace and deploy consumers use the explicit entry or no longer expose `DomMock`.
- Generic templates do not preinstall DOM emulation into test barrels.
- README and module examples teach the dedicated entry exclusively.
- No compatibility proxy, lazy wrapper, duplicate implementation, or second `DomMock` identity
  remains.
- No stale imports, comments, or examples contradict the final boundary.
- No archived or unrelated concurrent work is modified.

## Failure and rollback discipline

Each implementation commit must remain independently checkable:

1. the additive entry can land while broad compatibility still exists;
2. consumer migration can be reverted without changing implementation behavior; and
3. broad removal occurs only after every live consumer is proven migrated.

If an external compatibility requirement emerges before the final item, stop and replan the release
boundary. Do not preserve source compatibility by inventing a lazy proxy or by claiming purity while
a broad static re-export remains.

## Non-goals

- Do not move the implementation out of `@sys/std`.
- Do not move `DomMock` under `@sys/testing/web`.
- Do not rename `DomMock` or its members.
- Do not split `Keyboard`, `Mouse`, or `Fake.Media` into new public owners.
- Do not redesign import-time baseline capture, nested polyfills, concurrency, or restoration.
- Do not alter `Is.browser()` or the `__SYS_BROWSER_MOCK__` marker contract.
- Do not change `happy-dom` versions or dependency authority.
- Do not edit generated `pkg.ts`, dependency outputs, lockfiles, or release versions by hand.
- Do not perform Git staging, commits, publication, or remote mutations as part of implementation
  unless separately and explicitly authorized.

## Concurrent-work preservation

At plan authoring, repository status showed unrelated active changes in
`code/sys.driver/driver-pi/src/-test/mod.ts`. Re-observe live status before implementation; this
historical observation is not a gate and must not become stale execution authority.

If the overlap remains, either wait for a human-provided safe boundary or make only the surgical
`DomMock` migration while preserving every unrelated byte. Report the path as mixed deltas only when
the final observed file still contains both work units. This plan grants no Git mutation or isolated
worktree creation.
