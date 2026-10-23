@sys.fs
dist-metadata.plan.md
- [x] [dist-content-identity.plan.md](./dist-content-identity.plan.md)
- [ ] refactor(dist)!: move descriptive metadata into optional .meta

## Status and sequencing

Design-stage follow-up: this records the agreed starting baseline, not a complete schema or an
implementation-ready decision. More BMIND/DMIND design and TMIND review are needed to settle field
meaning, ownership, migration and proof before production edits.

The checked Dist prerequisite records its completed bounded source arc and required composition
proofs, not implementation readiness here. Preserve that checked reference after its final snapshot
and archival; any recovery hash must identify the completed plan snapshot, not source or removal.
This is a separate cleanup, not another phase or completion condition of the identity campaign.
The predecessor's follow-up link is informational; dependency runs only from this plan to it.

The opening arc provisionally represents one coherent breaking metadata migration. Refine its
implementation decomposition with the human after design, rather than inventing source cuts now.
This plan grants no implementation, Git mutation, publication, re-signing or evidence-rebinding
authority.

## Agreed baseline

A distribution is an exact payload inventory with a content identity. Package and build context can
be useful without being universal requirements of a content distribution.

- Target two root concerns: required `hash` and optional `'.meta'`.
- Preserve `hash.{scheme,digest,parts}`, `sys.dist/v2`, its encoding, pins and verification
  semantics. Do not rename `hash` to `content` or bump the hash scheme merely to reorganize
  metadata.
- Use `.meta` as the extension container, not `build` as a synonym for all contextual information.
- `.meta.pkg` retains the existing optional `Pkg` grammar, `{ name, version }`, for content
  associated with a package. It is a descriptive label, not a universal requirement or authenticated
  package authority. Covered package declarations such as `pkg/-pkg.json` retain their separate
  role.
- `.meta.vite` holds Vite-owned facts. Preserve the build-time information consumers need, with its
  event and field path settled explicitly rather than silently relabeling computation time.
- Producer-specific types belong to their owners; the generic Dist contract must not depend on Vite.
  Reuse the `.meta` spelling found in `JsonFile` and `Files.Manifest`, not their unrelated
  contracts.
- Do not build a slot registry, plugin framework or universal metadata abstraction. An optional
  container with narrowly owned fields is the starting point.

Core invariant: `hash` describes content identity; `.meta` describes context. Metadata cannot
redefine how content identity is interpreted or verified. Changes to metadata can change exact
manifest checksums and document signatures while leaving the content pin unchanged.

## Why hash stays

`content` is a defensible alternative, and the current descriptor type is named `DistContent`.
`hash` can initially suggest a scalar, so `hash.digest` needs a clear structured-descriptor meaning.
Nevertheless, `scheme`, constituent `parts` and aggregate `digest` form one narrow identity concern.
The grammar is already familiar from `CompositeHash`, without adopting that helper's hashing
protocol. `hash` also discourages unrelated descriptive fields from accumulating beside the
identity.

Retaining the name is justified by its semantics first and avoided migration cost second. The design
quality comes from the explicit boundary, not from claiming that `content` would be inherently
wrong.

## Source anchors and observed constraints

Paths below are repository-relative. Reopen these and refresh consumer discovery when this design
is resumed; the predecessor's landed source is context, not a frozen implementation baseline for
this follow-up.

- `code/sys/types/src/t/t.Pkg.dist.ts`: `DistPkg` currently requires root `type` and `build`; `pkg`
  is already optional. `DistContent` is the separate identity descriptor.
- `code/sys/std/src/m.Pkg/m/m.Dist.Content.ts`: encoding includes the scheme and sorted inventory,
  not root descriptive metadata.
- `code/sys/fs/src/m.Pkg.Dist/u/u.compute.ts`: current `build.time` is computation time; runtime is
  the computing Deno process; builder is caller-supplied. These are not automatically payload-build
  facts. Total bytes are inventory-derived; package bytes use the `/pkg/` path convention.
- `code/sys/fs/src/m.Pkg.Dist/u/u.hash.ts`: producer selection includes caller ignore/filter
  choices. `hash.scheme` defines identity interpretation, not a record of those individual choices.
- `code/sys/fs/src/m.Pkg.Dist/u.verify/u.manifest.ts`: content admission ignores descriptive fields.
  `code/sys/std/src/m.Pkg/m.Is/u.dist.ts` and `code/sys/fs/src/m.Pkg.Dist/u/u.load.ts` still require
  the current observation shape. Metadata cleanup is not automatically reader-compatible.
- `code/sys.driver/driver-vite/src/m.vite/u/u.build.ts`: Vite delegates manifest production and uses
  build-size metadata in presentation. Coordinate producer data with the saved document/checksum.
- `code/sys.driver/driver-signer/src/m.dist/u.run.dist.ts`: canonical signing loads the manifest,
  writes `build.sign`, then signs the whole canonical document. It is not just a content-pin signer.
- `code/sys/fs/src/m.JsonFile/t.ts` and `code/sys.model/model/src/m.files/t.ts`: `.meta` precedent
  is domain-owned, not a shared generic metadata contract.

## Design still required

1. **Metadata contract and ownership.** Settle the public type shape, JSON-compatible extension
   values, unknown-key handling and owner-local validation. Separate observation-shape checks from
   content admission; do not let optional metadata become required for generic content verification.
2. **Time semantics.** Identify Vite consumers and define the timestamp's event, units, producer and
   absence behavior. Distinguish payload build time from manifest generation/recalculation time.
   Decide what, if anything, a non-Vite producer records. No exact timestamp field path is agreed
   yet.
3. **Field disposition.** Decide what earns retention instead of moving the old `build` wholesale:
   - root `pkg` moves to optional `.meta.pkg`; keep package subject distinct from builder identity;
   - root `type` is a versioned TypeScript source link, not the content interpretation authority;
     decide whether to omit it or retain it as optional descriptive context;
   - sizes are derivable; decide whether consumers derive them or need an explicitly owned summary;
   - builder/runtime facts must name the process or tool they actually describe;
   - `build.hash.policy`, ignore rules and `rules:digest` are optional diagnostic information, not
     verifier inputs. The scheme does not preserve custom selection history. Removing their record
     must not remove producer selection behavior or make verification execute metadata;
   - relocate or otherwise resolve `build.sign` with its signer owner, preserving signing semantics.
4. **Producer assembly and propagation.** Decide how owners supply metadata without coupling generic
   FS code to drivers. Finalize it before serialization, save and returned `manifestChecksum`.
   Define whether projections or recomputation retain, replace or omit producer facts; never invent
   a fresh Vite build event merely because a manifest was recalculated.
5. **Migration boundary.** Inventory FS/Std, Vite, Tools, UI, Files/Server, signing, other
   producers, fixtures and docs. Confirm actual supported consumers/artifacts when design resumes.
   Do not invent dual-format adapters or silently assume a real compatibility obligation
   away; bring any concrete external obligation to the human before choosing the migration policy.
6. **Bounded implementation.** Settle the smallest coherent source cuts and verification commands
   against the then-current owning tasks. More design is required before calling this ready; no
   speculative approval gate or review-only opening-arc item is needed.

## Scope and proof requirements

- Preserve all identity vectors, path/size admission, independent pins, resource limits and
  payload-verification behavior. Metadata-only changes must not change the content identity.
- Prove metadata-free, package-labelled and Vite-described distributions through the affected public
  producer/loader/observer surfaces, not only by loosening a type alias.
- For otherwise valid documents within existing bounds, prove absent/changed/extended metadata does
  not alter admitted content evidence. Metadata must not become selection, route or trust authority.
- Preserve exact-document continuity: metadata changes still affect `manifestChecksum`, operation
  fences, staging/publication ownership and canonical whole-document signatures as appropriate. Do
  not repin artifacts, reuse invalid signatures or weaken checks to make fixtures pass.
- Prove Vite timestamp behavior, consumer absence handling, optional package labels, signer
  write-back/load/verify composition and producer failure truth. Preserve own JSON keys through
  metadata handling; no unrelated key-loss regression or broadening of runtime dependencies.
- Keep schema/docs/fixtures and required consumer changes with the migration. Run narrow owner tests
  and checks, then the affected composition proof through authorized owning tasks. Record evidence
  limits; this plan itself is not runtime proof.

Non-goals: reopening content identity, renaming `hash`, changing payload selection, redesigning
trust or signing, creating universal build provenance, unrelated UI polish, or expanding the
predecessor's landing arc. Do not rename the public `Pkg.Dist` family merely because package labels
become optional metadata.

## Return point

Reopen the source anchors and actual consumers, resolve the six design questions, and refine this
plan with the human. Only then assess the bounded implementation item. Keep the identity campaign's
completed contracts as constraints, not another design subject.
