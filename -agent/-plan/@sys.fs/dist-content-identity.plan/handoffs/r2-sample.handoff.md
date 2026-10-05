# R2 sample debug handoff

Governing plan: [dist-content-identity.plan.md](../../dist-content-identity.plan.md).
Target: `feat(dist)!: unify build pins and verification on canonical content identity`,
workstream H's R2 sample integration with C/E. This is a diagnostic handoff, not a new arc item.

## Executed evidence

From `/Users/phil/code/org.sys/sys`:

```sh
deno task --cwd ./code/sys.driver/driver-cloudflare/-sample/deploy test
```

Exit 1: **51 TypeScript errors; no test bodies ran**. The sample still consumes the old Dist
contract while FS/Types/Vite/R2 have the replacement. This reproduces the governing plan's recorded
sample integration gap; it is not a credentials or provider failure.

Control run:

```sh
deno task --cwd ./code/sys.driver/driver-cloudflare test ./src/m.r2/-test/-m.ReadRoute.fromDist.test.ts ./src/m.r2/-test/-m.ReadRoute.fromDist.lifecycle.test.ts
```

Exit 0: **2 tests / 20 steps passed**. This covers migrated R2 admission and lifecycle behavior,
not the sample, the whole Cloudflare package, or real provider/browser delivery.

No implementation, tests, governing plan, generated output, config, or Git state was edited by this
pass. Only this handoff was created. The sample subtree had no tracked/untracked changes in the
scoped status checks. Other threads have extensive open changes; reopen files before editing.
No build, clean, push, serve, live proof, credential access, or permission change was performed.

## Current owner contracts

Read these live surfaces before implementation:

- `code/sys/types/src/t/t.Pkg.dist.ts`: referenced by compiler diagnostics; not opened in this pass.
- `code/sys/fs/src/m.Pkg/t.ts`: compute success has `kind: 'computed'`, `dist`, `pin`, and
  `manifestChecksum`; failure has no manifest/pin. Project uses `source: { dir, pin }` and
  `select(content: DistContent)`. Verify takes `pin`; evidence exposes `content`,
  `manifestChecksum`, `manifestBytes`, and observed `assets` totals, not `dist` or `integrity`.
- `code/sys.driver/driver-vite/src/m.vite/t.ts`: build response is discriminated by `ok`;
  success exposes `dist`, `pin`, `manifestChecksum`. No `manifest.integrity`.
- `code/sys/std/src/m.Pkg/m/m.Dist.Content.ts`: supported scheme is `sys.dist/v2`;
  `Hash.sha256(Pkg.Dist.Content.encode(parts))` is the fixture content digest, not
  `CompositeHash.digest(parts)` or a hash of manifest bytes. Empty inventories are refused.
- `code/sys/std/src/m.Pkg/m/m.Dist.Pins.ts`: shared capture validates exact pin fields and freezes
  owned `{ scheme, digest }` snapshots.
- `code/sys/fs/src/m.Pkg.Dist/u.verify/u.manifest.ts`: recomputes inventory identity; inconsistent
  self-report is `malformed`, a different valid descriptor against a stale pin is `pin-mismatch`.
  Descriptive root/build metadata is not admitted authority.
- `code/sys.driver/driver-cloudflare/src/m.r2/-test/u.fixture.fromDist.ts`: concrete migrated
  fixture pattern. Route callbacks receive `DistContent`, not a whole manifest.

## Sample correction map

All paths below are relative to `code/sys.driver/driver-cloudflare/-sample/deploy/`.

| Surface | Required correction |
| --- | --- |
| `-scripts/task.build.ts` | Replace local builder seam's optional `manifest.integrity` with success-narrowed content pin; project with `source.pin`. `select` gets content only. Derive bundle bytes from admitted part sizes through the existing Part owner, not excluded `dist.build.size`. Preserve refusal before recording pins. |
| `src/m.deployment/u.selection.ts` | `partitionBuild` / `selectionFiles` take content and inspect `content.parts`. `selectBuild` supplies a captured pin to `Pinned.verify`; named verification consumes `evidence.content`. Keep the existing audience filename policy. |
| `src/m.deployment/u.app.ts` | Route selection already receives the migrated R2 callback value; adapt `selectionFiles`, never fabricate a full authenticated Dist. |
| `-scripts/u.status.ts` | Render `selected.evidence.content.digest`, the same digest as the selected pin. |
| `-scripts/u.fmt.ts` | Print content identities, not manifest checksums; replace old Manifest/checksum vocabulary. Keep full scheme/digest at copy/comparison boundaries. |
| `-scripts/task.proof.local.ts` | Separate selected content pin from retained document checksum. See the continuity warning below. Change receipt identity vocabulary without changing generic HTTP checksum semantics. |
| `src/-test/u.fixture.ts` | Replace byte pins and generic composite digests with supported content fixtures. Preserve synthetic credentials and mocked storage. |
| `-scripts/-test/u.fixture.ts` | Check `computed.kind` before extracting the pin; do not report unconditional build success on compute refusal. |
| `-scripts/-test/u.fixture.status.ts` | Obtain the fixture expectation from successful producer output; use evidence content/manifest checksum separately. |
| `src/-test/-selection.test.ts` | Replace positive old-pin fixtures and whole-manifest selection inputs. Keep explicit old/mixed-format refusal tests. Empty filename-policy negative fixtures need not become valid production Dist candidates. |
| `src/-test/-bootstrap.test.ts` | Rework semantic failure cases, not just type casts. See below. |
| `src/-test/-push.test.ts` | Replace old computed-manifest pins and stale-pin fixtures; preserve publish-selected-build and no-publish-on-refusal controls. |
| `-scripts/-test/-u.status.test.ts` | Pin digest now equals displayed digest. Wrong content expectation is `pin-mismatch`, not `integrity-mismatch`. Preserve capture-at-invocation and layout tests. |
| `-scripts/-test/-u.proof.test.ts` | Update receipt fields/refusal classes and add document-continuity regressions. Preserve counts, cancellation, reporting, and cleanup composition. |
| `-scripts/-test/-u.fmt.test.ts` | Update pin shape and expected identity wording. |
| `src/ui/ui.App.tsx`, `src/ui/u.load.ts`, `src/-test/-ui.load.test.ts`, `src/-test/-ui.render.test.tsx`, `README.md` | Remove the old claim that build pins equal fetched manifest checksums. One primary content identity per inventory; any retained document checksum is an explicitly separate diagnostic. Manifest observations remain unpinned, not payload/browser verification. |

The UI and README contain semantic residue even where TypeScript does not complain. In particular,
`-ui.load.test.ts` currently asserts received-document checksum equals recorded build pin; the
status test asserts displayed digest differs from the pin. Both assumptions must be replaced.

## Do not lose exact-document continuity

`prepareProof` currently compares captured `dist.json` bytes to the old byte pin and returns a
`verify` closure reused after capture and at the end of delivery. Previously that byte expectation
also rejected any later document replacement. With a content pin, equal-content metadata/layout
replacement can pass a fresh verifier call.

Required preservation:

1. Capture/freeze the caller pin once before asynchronous work; do not let later caller mutation
   retarget the `verify` closure. The old implementation captured an immutable checksum string.
2. Retain the first successful evidence's `manifestChecksum` for this proof operation.
3. Compare captured manifest bytes against that checksum, and payload bytes against admitted
   `content.parts` hashes. Never use `pin.digest` as a manifest-body checksum.
4. Require each successful enclosing-operation recheck to retain that same document checksum.
   Do not reset the baseline from a later successful content verification.
5. Keep HTTP response checks as `Hash.sha256(expectedBytes)`. The private proof intentionally
   compares exact selected local/served documents as well as HTML; R2 route admission itself
   still does not checksum later response bodies.

Add metadata-only replacement regressions during expectation capture and after the awaited
`selected` announcement/before the final local recheck. These should refuse without losing cleanup
truth even though the independent content pin still matches. Add caller-pin mutation coverage for
subsequent closure invocations, not only initial verification.

## Tests whose meaning changes

Source-derived predictions; not executed because the sample stops at type-check:

- Bootstrap's `wrong checksum` case supplies `wrong` bytes: that is now malformed JSON, not a
  content-pin mismatch. Use a second valid supported inventory with its own correct self-report
  against the original independent pin to prove `pin-mismatch`.
- Bootstrap increments only `build.size.total` and expects `malformed`. The new admission owner
  deliberately ignores that descriptive total. Replace with metadata invariance coverage, and use
  an invalid authenticated descriptor for malformed-input proof.
- Bootstrap adds a forbidden public asset to a private inventory. Recompute its content digest
  through Content.encode and deliberately supply its matching fixture pin so refusal reaches the
  sample filename policy rather than stopping at identity admission.
- Proof bootstrap receives `{}`: now `malformed`, not `integrity-mismatch`.
- Do not blindly add a scheme to old `CompositeHash.digest` fixtures: the preimage changed.
- Old-only and mixed pin records must still refuse before credentials/storage; no compatibility
  aliases or automatic conversion of existing `dist.pins.json`.

## Implementation boundary and next proof

Coordinate sample ownership with the main thread first. This belongs inside the existing integrated
breaking item, not a separately shipped old/new adapter. Preserve both native image references,
public-only PNG projection, and SRI work. The relevant regression files are
`-scripts/-test/-ui.images.test.ts` and `-scripts/-test/-u.build.test.ts`.

After coordinated edits, rerun the exact sample test command above and the focused R2 control.
Then run the owning package check:

```sh
deno task --cwd ./code/sys.driver/driver-cloudflare check
```

That check was not executed in this diagnostic pass. Do not bypass type-checking to obtain a green.
Do not run sample `build` casually: `buildSample` deletes both records and all three local output
roots before building. Real rebuilds need coordinated output ownership; push/live proof have
separate provider authority. The plan's two-real-build projection/materialize/serve proof remains
required and is not established by fixture greens.
