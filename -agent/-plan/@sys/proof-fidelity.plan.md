@sys
proof-fidelity.plan.md
- [x] 245cbe5c0 test(driver-vite): bound external fixture subprocesses
- [x] 36601f3ae docs(plan): restore canonical opening blocks
- [x] a3a0c95b6 test(driver-vite): promote bounded fixture diagnostics
- [x] 0832650e8 test(workspace): strengthen symlink containment proof
- [x] 5995ecc08 fix(driver-vite): restore external consumer build and dev
- [ ] fix(driver-vite): align external consumer proof and behavior

## Essential outcome

A supported consumer outside this monorepo can install its declared dependencies, build, and serve
its application through the published driver's documented commands, without workspace privileges or
manual dependency repairs. Evidence must exercise that boundary, not merely carry a published
version in its name.

On 2026-09-21 Phil authorized a MAX/TMIND reassessment and slimming this plan to essential signal.
This revision replaces the broad future-bump programme with the bounded follow-up below. It removes
the stale authorization gate for releases that already occurred; it does not assert their historical
authorization or authorize another release. Landed work remains in the opening arc.

**The remaining problem is consumer-boundary proof and any defects it reproduces, not waiting.**
Neither published acceptance nor a release-wide failure has been established by the mixed tests.

## TMIND adjudication

This is adversarial source review in the implementing thread, not an independent review.

- **Keep the consumer promise.** `code/sys.driver/driver-vite/README.md` documents a consumer-owned
  Vite declaration and public `/main` tasks. Current local-template output has that setup and its
  real install/build sequence failed. That is actionable signal, not a plan-created obligation.
- **Correct attribution, not the result.** Dedicated fixtures lack their own `package.json` and
  `u.fixture.build.child.ts` / `u.fixture.dev.ts` import the local launcher. They combine local
  startup with published configuration. They can remain useful integration tests, but are not
  standalone published-command acceptance. Neither hybridity nor missing configuration is yet the
  proven cause of their unresolved imports.
- **Do not discard older pins merely because they are older.** Commit `9db25b85d` deliberately
  decoupled application pins from driver bumps. The `.477` template / `.478` fixture split is a
  proof-target distinction, not by itself a runtime defect. Establish the selected target without
  upgrading application dependencies until a failure disappears.
- **Repair misleading checks without weakening coverage.** Baseline dev rejects `@sys/std` even
  inside a rewritten Vite URL. Conversely, `u.fixture.dev.ts` does not discover side-effect-only
  imports, including the injected compatibility import. HTTP 200 for the entry alone is
  insufficient.
- **Do not settle the cache hypothesis by narrative.** Resolution and some HTTP/build results
  improved after intervening loader activity. Cache sensitivity is suspected, not causally isolated;
  the failed first run still matters. A manually warmed rerun is not a repair.
- **Separate reliability work from release infrastructure.** Requiring a trustworthy repeatable
  consumer check is essential. Implementing automated delayed acceptance for every future bump is
  not required to close this repair. No new review quota or release-governance project is
  introduced.

## Follow-up contract

### `fix(driver-vite): align external consumer proof and behavior`

**First repair the proof boundary; then change product code only for reproduced failures.** This is
one bounded correction to consumer startup/resolution and its evidence, not a transport redesign.

1. **Exercise the documented commands.** Stage temporary consumers outside the workspace with their
   own config, import map, compatible Vite declaration, and public driver `/main` entry. Invoke
   their normal install/build/dev tasks; do not substitute local `Vite.build` / `Vite.dev` or
   inherit repository dependency mappings in the published lane. Use existing bounded child
   ownership and explicit cleanup.
2. **Keep a small, discriminating capstone.** Cover the minimal JSR consumer and the generated UI
   workspace, preserving static/dynamic transitive npm imports, service-worker bundling, and sibling
   imports. Reuse existing cases and lower-level regressions rather than building another matrix.
   The current generator test uses local template source with `bundle: false`; label that boundary
   honestly, without claiming it validates the published template bundle.
3. **Make dependency authority explicit.** Start with already-published driver `.478`, not a new
   bump. Record exact driver/Vite/application targets. Use owning fixture/template preparation for
   target changes; do not hand-patch generated maps, add application aliases, or perform a workspace
   bump as test maintenance. Preserve intentional older application pins. If a different driver
   target is retained for compatibility coverage, report it separately from selected-release proof.
4. **Reproduce, classify, correct.** Attribute every current failure to setup, assertion, product,
   or an evidenced external dependency. Use fixture-owned dependency/cache state to isolate the
   suspected first-use failure; normal documented installation is allowed, ad hoc prewarming and
   global-cache deletion are not. Do not claim cold-cache coverage without actual isolation. Pin
   each confirmed product defect with the narrowest red → green regression before its repair.
5. **Assert useful outcomes.** Build exits successfully and emits the expected application and
   service-worker outputs. Dev returns HTML and JavaScript, resolves the exercised dependency graph
   including side-effect compatibility imports, and settles without captured module errors. Check
   actual import resolution, not absence of package-name substrings. Preserve existing runtime
   execution regressions; HTTP/module proof alone does not claim browser rendering or execution of
   every lazy branch.
6. **Remove only demonstrated residue.** A retired or consolidated case must name its replacement
   invariant coverage or establish why it is outside the supported contract. Hybrid tests may be
   relabelled and retained. Age, duplication of names, or a red result alone does not justify
   deletion. Do not hide a supported failure behind one passing consumer.

In `code/sys.driver/driver-vite`, the fixture helpers are in `src/m.vite/-test.external/`.
Supporting surfaces are `src/m.vite/u/u.wrangle.ts`,
`src/m.vite.plugins/m.DisposeProtocolCompat/m.DisposeProtocolCompatPlugin.ts`,
`src/m.vite.transport/u.resolve/`, and `-scripts/task.prep.u.published.ts`. Template preparation is
owned by `code/-tmpl/-scripts/task.prep.ts`; inspect `code/-tmpl/-templates/tmpl.repo/-deps.yaml`,
`code/-tmpl/-templates/tmpl.repo/-package.json`, `code/-tmpl/-templates/tmpl.repo/imports.json`, and
the generated task entry `code/-tmpl/-templates/tmpl.pkg/-scripts/task.vite.ts`.

## Invariants

- Keep consumer Vite precedence, supported Vite 7 behavior, lazy command loading, workspace virtual
  identities, Vite-first npm resolution, and exact fallback versions/subpaths.
- Keep strict filesystem containment, canonical same-root identity, deny rules, and escaping-link
  regressions. No wider roots, broader child grants, unresolved-import externalization, forced
  consumer node-modules mode, weaker sanitizers, or dependency-age bypass.
- Candidate configuration proof remains distinct from published-command acceptance. Preserve its
  default-task coverage; a regression at the published-shaped startup seam must not require a
  publication cycle merely to detect it locally.
- Do not reopen unrelated workspace, disposal, UI design, or release-hardening work. No new browser,
  platform, historical-version, or universal cold-cache campaign belongs here.

## Verification and finite finish line

During implementation, use the owning driver's targeted `test:unit --trace-leaks` task for the
changed specs first. After correcting the boundary, run from `code/sys.driver/driver-vite`:

```sh
deno task check
deno task test
deno task test:external
```

The final external run must use the corrected, attributed suite: all retained supported checks pass,
with any consolidation justified by coverage. Record command, UTC time, checkout revision, exact
tested package versions, cache/setup conditions, counts, and material diagnostics. Keep source and
published evidence separate; a suite rename or reduced test count is not acceptance.

If `.478` passes faithful proof after test/setup correction, **no new driver release is required**.
If a published artifact must change, prove the local correction first, identify the affected
package(s), and obtain Phil's explicit release authorization before bumping or publishing. Record
the selected release and publication evidence, then verify that artifact. Do not infer release or
Git-mutation authority from this plan.

Phil's existing 48-hour observation requirement and the active dependency-age policy remain intact.
The `.478` window elapsed on `2026-09-20T08:20:18.271331Z`. Only a newly selected corrective release
needs its own publication-based window; tests, plan edits, unrelated commits, or returning later do
not restart it. Missing old authorization narration is not a reason to republish an existing
version.

Close this plan when faithful published proof and the bounded regressions pass, no supported
in-scope failure remains unresolved, and the touched-file residue review is complete. No historical
audit, automated future-release enforcement, or guarantee against arbitrary future dependency
changes is required. Plan preservation and lifecycle actions remain separate human-authorized
operations.

## Evidence retained

### Current checkpoint: 2026-09-21

Checkout `8ee43d15123144b982182b4ca59691e77ebf1831`; macOS ARM64; Deno `2.9.7`. Commands ran from
`code/sys.driver/driver-vite`. These are pre-correction observations, not clean published-command
verdicts. This plan-only reassessment did not rerun tests or repair their implementation.

- `deno task check && deno task test`: pass, **71 tests / 426 steps**. Breakdown: unit 65 / 413,
  entry 2 / 9, candidate 4 / 4.
- First `deno task test:external`: exit 1, **4 tests / 7 steps passed; 8 / 10 failed**, 2m38s.
- Second `deno task test:external`: exit 1, **7 tests / 11 steps passed; 5 / 6 failed**, 1m44s.

First-run failures included injected `jsr:@sys/std@^0.0.383/dispose/compat` resolution and HTTP 500.
The second run followed the default suite and direct loader probes: generated `.477` builds still
failed on the `.382` compatibility range; `.478` UI builds failed on
`npm:@preact/signals-react@3.12.0` or `npm:bowser@2.14.1`; baseline dev reached HTTP 200 but failed
its substring assertion. Baseline build, pure-JSR-labelled build/dev, and UI-components dev then
passed. These observations do not establish the npm/cache root cause or failure of every supported
consumer.

The loader probe resolved exact/caret compatibility specifiers. An exploratory in-process dev probe
observed HTTP 200 but failed Rolldown signal-listener leak sanitization; it is not a passing test.
Its temporary source was removed. Use the established bounded-child pattern, not weaker sanitizers.
Exact first-run/default-suite start times were not captured; the second external run began around
`2026-09-21T02:39:28Z`. Results were inspected by `2026-09-21T02:47:57Z`.

Publication evidence, queried on 2026-09-21 with both versions unyanked:

- [.478 registry record](https://api.jsr.io/scopes/sys/packages/driver-vite/versions/0.0.478):
  `2026-09-18T08:20:18.271331Z`.
- [.477 registry record](https://api.jsr.io/scopes/sys/packages/driver-vite/versions/0.0.477):
  `2026-09-17T04:59:34.802649Z`.

The workspace `.478` bump is `1bff6700a`; its commit time is not registry publication evidence. No
complete registry-to-source attestation was verified in this pass.

Temporary captured logs, not durable repository artifacts:

- First external: `/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/pi-bash-5b2a50c7c0f5ec76.log`
- Check/default: `/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/pi-bash-dafafb401ba951ec.log`
- Second external: `/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/pi-bash-987e8cd941363e79.log`

### Historical anchors, not remaining work

- `af30f0b69` preserves startup/compatibility/npm corrections and the then-failing candidate probe.
  `5995ecc08` preserves canonical-root containment, exact npm fallback, real HTTP candidate proof,
  and bounded lifecycle ownership. The earlier full candidate/default result was 71 tests / 427
  steps; final helper factoring had narrower HTTP, entry, candidate, check, and formatting proof.
- The `.476` external run at `2026-09-16T03:58:24Z` failed: 4 tests / 7 steps passed; 8 / 10 failed.
  It is historical failure evidence, not a reason to rerun `.476` or a verdict on `.478`.
- Workspace symlink proof passed 1 test / 19 steps; workspace check/default passed 64 / 474.
  Original plan-shape, diagnostic, and symlink work is recoverable through the opening arc; it is
  not reopened by this consumer follow-up.
