external-publication-proof.plan.md
- [x] [dispose-native-protocol-alignment.plan.md](../@sys.std/dispose-native-protocol-alignment.plan.md)
- [x] 181481ac5 test(driver-vite): make generated repository bootstrap explicit
- [x] 6a9a277ee test(driver-vite): surface external build failure diagnostics

## Purpose

Close the post-publication external-fixture follow-up discovered after the native disposal alignment
release. The completed disposal implementation arc remains historical; this plan owns only the
external driver-vite fixture contract and final proof.

## Status

The implementation arc is complete and reachable:

- `181481ac5 test(driver-vite): make generated repository bootstrap explicit`
- `6a9a277ee test(driver-vite): surface external build failure diagnostics`

Focused format, package check, generated-repository, diagnostic, and std-try proof passed after the
second commit. The published pure-JSR probe still stops at Deno's minimum-dependency-age policy for
exact `@sys/driver-vite@0.0.470`; its new diagnostics now report the failing command, working
directory, exit status, stdout, and stderr. The full external lane remains the explicitly recorded
post-commit exit criterion. Do not retire this plan until that lane is green.

## Boundary

- Change only driver-vite external test fixtures and their shared test helpers.
- Do not change published package pins, production disposal behavior, template source, release
  authority, or the Deno minimum-dependency-age policy.
- Do not run the workspace-root test runner; the human owns it.
- Do not stage, commit, publish, or retire plan files without separate human instruction.

## Recorded diagnosis

JSR workflow `#1682` published `@sys/driver-vite@0.0.470` from `41160c75d`. The 2026-08-09 external
lane and its 2026-08-10 09:56 NZST rerun each reported 2 passing tests / 4 passing steps and 7
failing tests / 9 failing steps.

Eight failing published-fixture steps were blocked by Deno's active 24-hour minimum-dependency-age
policy for exact `@sys/driver-vite@0.0.470`; the recorded eligibility time is 2026-08-10 20:00 NZST.
This policy is a security constraint, not a test failure to bypass or weaken.

The generated single-package repository failure is independent: `generate → build` left published
npm dependencies unavailable. The same generated fixture passed after
`generate → root install →
build`, transforming 2,161 modules with Vite `8.2.1`; Vite `8.2.0`
reproduced the unbootstrapped failure. The existing generated-workspace fixture already models root
bootstrap.

## Contract

### `test(driver-vite): make generated repository bootstrap explicit`

`buildGeneratedRepo` must model the public generated-repository journey as:

```text
generate → root deno task install → package deno task build
```

It must return the bootstrap `TaskRun`, assert that it succeeds before building, assert the
generated root lockfile, and skip the build when generation or bootstrap fails. Preserve the
existing generated-workspace contract and keep the fixture isolated in its disposable temp
directory. Do not instead make a zero-bootstrap build pass through ambient cache or resolver
privilege.

### `test(driver-vite): surface external build failure diagnostics`

External fixture failures must remain hard failures while reporting the failed command, working
directory, exit status, stdout, and stderr. Share the task/build diagnostic path rather than leaving
published build assertions as bare `build.ok === false` failures. Retain bounded output handling and
existing retry behavior; diagnostics must not hide a failed build, retry indefinitely, or relax Deno
security policy.

## Verification

Before the published-package age condition is eligible, run only the targeted generated-repository
fixture proof and affected package-local format, lint, and check gates. After the two fixture
commits and no earlier than the recorded eligibility time, run from `code/sys.driver/driver-vite`:

```sh
deno task test:external
```

The full command must pass with every external fixture green. This final full-lane pass is an exit
criterion, not a third opening-arc item: it creates no independently meaningful local commit and is
not an admissible decision gate. Record its exact result here before retirement.
