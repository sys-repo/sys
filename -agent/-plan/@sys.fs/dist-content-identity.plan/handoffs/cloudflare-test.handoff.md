# Main-thread handoff: Cloudflare test failure during Dist replacement

## Scope and result

Governing plan: `../../dist-content-identity.plan.md`, integrated
`feat(dist)!: unify build pins and verification on canonical content identity`, workstreams E/H.
Diagnosis only: no implementation, existing plan, configuration, or Git state was edited.
This handoff is the only authored file. Observed HEAD: `8d97fe408`; implementation is in the
shared dirty worktree, so re-read relevant files before editing.

Executed from `/Users/phil/code/org.sys/sys`:

```sh
deno task --cwd ./code/sys.driver/driver-cloudflare test
```

Result: exit 1, **51 TypeScript errors**, all reported under
`code/sys.driver/driver-cloudflare/-sample/deploy/`. Failure occurs before tests execute.
The parent task is `deno test -P=test`; its default discovery includes the nested sample's tests.
This is not a provider failure or a demonstrated R2 runtime regression.

```sh
deno task --cwd ./code/sys.driver/driver-cloudflare test --trace-leaks ./src
```

Result: **15 passed (139 steps), 0 failed**, including the migrated `fromDist` admission and
lifecycle tests. This is a fresh terminal receipt, not recovery of an earlier report. It proves
only the library test surface, not the full command, sample, provider, or browser.

## Root cause

The library/FS/Types/Vite contracts have moved to canonical content identity, while the nested
sample still expects exact-manifest pins and authenticated whole-manifest evidence.
The governing plan already identifies this sample migration as outstanding.

Current owner contracts inspected:

- `code/sys/types/src/t/t.Pkg.dist.ts`: `DistPin = { scheme: 'sys.dist/v2', digest }`;
  `DistContent = { scheme, digest, parts }`.
- `code/sys/fs/src/m.Pkg/t.ts`: `Pinned.verify({ dir, pin, limits })`;
  evidence contains `content`, `manifestChecksum`, `manifestBytes`, and derived `assets` totals.
  Projection takes `source.pin`; its selector receives `DistContent`, not `DistPkg`.
  Successful compute exposes `pin` and `manifestChecksum`; failure exposes neither.
- `code/sys.driver/driver-vite/src/m.vite/t.ts`: success is narrowed by `ok: true` and exposes
  `dist`, `pin`, `manifestChecksum`; the old `manifest.integrity` surface is gone.

## Repair map

Paths below are relative to `code/sys.driver/driver-cloudflare/-sample/deploy/`.

1. **Selection/admission:** `src/m.deployment/u.selection.ts` and `u.app.ts`.
   Make `selectionFiles`/`partitionBuild` consume `DistContent.parts`. Pass the captured independent
   pin into verification. Read `evidence.content` in single/batch selection and the R2 policy callback.
   Keep filename policy, public/private separation, input capture, and pre-publication verification.
   Do not fabricate `DistPkg` evidence or broaden the library callback to restore metadata authority.
2. **Build/projection:** `-scripts/task.build.ts` and `-scripts/-test/u.fixture.ts`.
   Replace the local builder seam's optional `manifest.integrity` with the actual success/failure
   content-pin contract; narrow success before consuming authority. Use `source.pin = built.pin`.
   Derive the bundle total from admitted part lengths using the Part owner, not `content.build` or
   descriptive metadata. Preserve refusal-before-record-write. The fixture must check compute
   success before returning a successful builder result.
3. **Status/formatting:** `-scripts/u.status.ts`, `u.fmt.ts`, their tests, and
   `-scripts/-test/u.fixture.status.ts`.
   Display `evidence.content.digest` and recorded content pins. Replace the `Manifest` pin heading
   with truthful content-identity wording. Full scheme/digest must survive record/copy boundaries.
4. **Fixtures:** `src/-test/u.fixture.ts`, `-selection.test.ts`, `-ui.load.test.ts`,
   `-ui.render.test.tsx`, `-bootstrap.test.ts`, `-push.test.ts`, plus script tests above.
   Do not merely add a scheme to `CompositeHash.digest(parts)`: that is the wrong preimage.
   Use real compute where appropriate, or `Hash.sha256(Pkg.Dist.Content.encode(parts))` for bounded
   synthetic descriptors. The migrated library fixture at
   `code/sys.driver/driver-cloudflare/src/m.r2/-test/u.fixture.fromDist.ts` demonstrates this shape.
   Empty inventories are not valid v2 positive fixtures. Retain old/mixed shapes only as explicit
   refusal cases, not accepted fixtures or compatibility aliases.

## Non-mechanical traps

### Preserve byte-level proof separately

`-scripts/task.proof.local.ts::prepareProof` compares the snapshot of `dist.json` against the old
pin checksum, and payload snapshots against `evidence.dist.hash.parts`. Under v2:

- Manifest snapshot checksum must use the initially verified `evidence.manifestChecksum`.
- Payload checksums come from `evidence.content.parts` through `Pkg.Dist.Part`.
- Generic `Fetch.blob(..., { checksum: Hash.sha256(bytes) })` remains a **response-byte checksum**.
  Never put the content digest there.
- Both the post-capture and end-of-live-proof `verify()` calls currently check only `kind`.
  Previously the closed-over byte pin also rejected metadata-only document replacement. A naive
  switch to content pins loses that enclosing-operation fence. Retain the initial document checksum
  and require it on successful rechecks; add a metadata-only mutation regression with equal content
  identity plus an unchanged-document positive control.
- Proof receipts currently call the selected expectation `integrity`; report the content pin and
  explicitly named document diagnostics separately.

The fence issue is source-derived, not an executed runtime counterexample in this diagnosis.

### Fix semantic residue that the compiler does not catch

`src/ui/u.load.ts` observes remote manifest shape and hashes received bytes; it does not have an
independent pin or verify payload execution. `src/ui/ui.App.tsx` still has two identity rows and
instructs readers to compare the document checksum with `deno task build`'s audience pin.
That instruction becomes false once build output displays content identity. Reconcile the table,
loader callback, tests, and active documentation: one primary content identity per distribution;
any document checksum is an explicitly secondary byte diagnostic. Keep observation assurance honest.

### Preserve ownership and execution boundaries

The main plan names shared R2/SRI ownership as unresolved. Coordinate sample edits with that owner;
preserve the separate image/SRI work rather than reconstructing its state from this handoff.
`buildSample` removes `dist`, `dist.private`, `dist.public`, and existing selection records before
building. No real build, clean, push, live proof, credential load, remote publication, or evidence
rebinding was run here. Do not regenerate real pins merely to obtain green tests. Publication must
continue to publish the selected build without silently rebuilding or repinning.

## Verification for the implementing thread

After coordinated edits, run the sample's declared unit task, then the original parent command:

```sh
deno task --cwd ./code/sys.driver/driver-cloudflare/-sample/deploy test
deno task --cwd ./code/sys.driver/driver-cloudflare test
deno task --cwd ./code/sys.driver/driver-cloudflare check
```

Inspect task/config freshness first. Do not add exclusions, skip type-checking, weaken admission,
change permission presets, or restore old APIs to hide the errors. These commands do not by
themselves complete the plan's two-real-build projection/materialization/serve proof.

Recommended next pass: `gpt-6-astra` at `high`; the repair spans producer success narrowing,
independent inventory authority, exact-document continuity, and truthful display semantics.
