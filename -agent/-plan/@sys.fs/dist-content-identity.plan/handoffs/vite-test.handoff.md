# Vite test failure: main-thread handoff

Governing plan: [dist-content-identity.plan.md](../../dist-content-identity.plan.md).
Target: `feat(dist)!: unify build pins and verification on canonical content identity`,
workstream H consumer/fixture integration.

## Scope and state

Diagnostic pass only: no source, fixture, permission, or governing-plan edits; no Git mutation.
This handoff is the only authored file. Existing implementation and overlapping SRI work are preserved.
Observed HEAD: `8d97fe408`; this is a dirty, concurrently edited workspace, not a clean-commit receipt.
Runtime: Deno 2.9.7, TypeScript 6.0.3, aarch64-apple-darwin.

## Executed evidence

From `/Users/phil/code/org.sys/sys`:

```sh
deno task --cwd ./code/sys.driver/driver-vite test
deno task --cwd ./code/sys.driver/driver-vite check
```

- `test` exited 1. Its `test:unit` stage passed: **73 tests / 603 steps**, zero failures.
- `test:entry:process` failed: **1 passed (8 steps), 1 failed (1 step)**.
  The graph-authority test passed; cached-only serve's startup step failed; its serialized-copy
  cleanup control passed.
- `test:candidate` was not reached because the task chain uses `&&`.
- `check` exited 1 with one reported TS2339 at
  `code/sys.driver/driver-vite/src/m.vite/-test.external/u.html-integrity.fixture.ts:44:52`.
- The full test output exceeded the tool's output window, but the displayed tail includes both
  stage summaries and the failure stack. Captured full output for this session:
  `/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/pi-bash-0fcfba2fd4da3e40.log`.
  That temporary log was not independently reopened or made a durable artifact.
- Browser/SRI runtime proof and candidate-consumer proof were not run separately.

## 1. Actual test blocker: old static serve manifest

Files:

- `code/sys.driver/driver-vite/src/-entry/-test.fixture/serve/manifest.json`
- `code/sys.driver/driver-vite/src/-entry/-test.fixture/serve/index.html`
- `code/sys.driver/driver-vite/src/-entry/-test.external/-serve.cached.process.ts`

`setupDist()` copies the static HTML and renames the static `manifest.json` to `dist.json` in
`.tmp/entry-serve-proof/dist`. It does not invoke the new producer. The static manifest has
`hash.digest` and `hash.parts`, but **no `hash.scheme`**. Its recorded root digest is
`sha256-b24d5611ce40be13c1ca301a54613a42f7f2f4cafe7d371560683caeb23feb8d`.

Failure sequence:

```text
static old manifest copied unchanged
→ restricted cached-only child invokes ViteEntry.main --cmd=serve
→ entry serveWith calls DistServer.Local.serve
→ startLocalWith calls verifyLocal
→ admitManifest requires own hash.scheme === sys.dist/v2
→ old manifest is refused before listener startup
```

The executed child error was:

```text
Cached-only serve exited before startup:
DistServer.StartError: DistServer.start: pinned generation verification failed.
```

The `malformed` classification is source-derived from
`code/sys/fs/src/m.Pkg.Dist/u.verify/u.manifest.ts::admitManifest`, not exposed in that terminal
message. `code/sys/server/src/m.server.dist/u.server/u.error.ts::message` uses the same generic
"pinned generation" wording for this locally unpinned failure. Do not infer a missing external pin
or a permission denial from that wording.

### Smallest coherent correction

Rebuild the static fixture manifest from its exact HTML payload using the current
`@sys/fs/pkg` `Pkg.Dist.compute` producer, then retain the new supported manifest as the static
fixture. Merely adding `hash.scheme` is insufficient: admission independently recomputes the v2
path/hash/size digest. Do not relabel the old digest or substitute the manifest-byte checksum.

Keep producer work outside the restricted serve child. Preserve its exact `entry-serve-proof`
permissions, `--cached-only`, `--frozen`, `--node-modules-dir=none`, silent-output assertions,
shutdown/port-release proof, and the serialized-copy failure control. Retaining the static fixture
keeps the current two-copy lifecycle test intact. Do not add old-format acceptance to FS/Server.

The current producer is `code/sys/fs/src/m.Pkg.Dist/u/u.compute.ts`; check
`kind === 'computed'` before retaining its output. This pass did not regenerate the fixture and
establishes no post-fix green result.

## 2. Separate check blocker: SRI fixture lacks success narrowing

`code/sys.driver/driver-vite/src/m.vite/t.ts::Vite.Build.Response` is now discriminated by `ok`.
Only success exposes `dist`, `pin`, and `manifestChecksum`.

At `code/sys.driver/driver-vite/src/m.vite/-test.external/u.html-integrity.fixture.ts`,
`expect(built.ok, built.toString()).to.eql(true)` does not narrow TypeScript's union before
`readAttestedHtml(dir, built.dist)`.

Use an explicit failure branch before reading success fields, for example:

```ts
if (!built.ok) throw new Error(built.toString());
```

Preserve the existing emitted-HTML checksum/manifest equality and SRI asset-byte assertions.
Do not cast the result, weaken the response union, or fabricate failed-build authority.
The governing plan already records the shared SRI ownership boundary; coordinate this narrow edit
with that owner. No integrity-plugin or browser behavior change is implicated by TS2339 alone.

## Return proof

Run the narrow process test first, then package check and the complete requested chain:

```sh
deno task --cwd ./code/sys.driver/driver-vite test:unit --trace-leaks ./src/-entry/-test.external/-serve.cached.process.ts
deno task --cwd ./code/sys.driver/driver-vite check
deno task --cwd ./code/sys.driver/driver-vite test
```

The final chain must reach and pass `test:candidate`; today's unit green is not a full package green.
Coordinate any separately required browser/SRI execution with its owner. These findings belong to
the integrated Dist replacement, not a compatibility lane or an independently claimed release proof.

Suggested next implementation calibration: `gpt-6-astra • medium` for the bounded fixture rebuild
and success-narrowing correction. Broader identity, browser, and release proofs remain separate.
