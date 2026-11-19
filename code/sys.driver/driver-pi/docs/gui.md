# Local GUI workflow

[Package overview](../README.md) · [Development tasks](./development.md)

These procedures use the source-checkout launcher. Run commands from the owning package:

```sh
cd code/sys.driver/driver-pi
```

`start:gui` hosts a verified browser artifact, not a profile-configured Pi agent. Use the profile
menu described in [Usage](../README.md#usage); explicit `--profile` launches TUI mode instead.

## Build, bind and launch

The launcher needs supported local-rehearsal evidence for the chosen build. Its `release` kind names
the artifact-acquisition path, not publication or publisher provenance. Evidence containing legacy
`integrity` is rejected before acquisition and requires explicit binding. There is no automatic
conversion, repinning or release-to-preview fallback.

Build and explicitly bind a local-rehearsal candidate from current source:

```sh
deno task bind:dev
```

This runs `build`, then binds the resulting `dist/`. If the build fails, binding does not run. To
select an existing build without rebuilding it, use:

```sh
deno task bind:gui:evidence:local
```

Binding locally verifies `dist/` and its covered package declaration against the source package,
then writes the selected content pin to the launcher evidence file. This is operator-owned local
selection, not publisher authentication. Binding alone never builds, serves, or contacts `:8080`.

Serve the selected build for browser preview and cold acquisition:

```sh
deno task serve
```

The task verifies `dist/` before opening one loopback listener on `:8080`, serving `/`, the exact
saved `/dist.json`, and every manifest-declared part. In another terminal in the same package, use
this checkout's launcher, not a separately published JSR copy:

```sh
deno task cli --help
deno task cli
```

Select a profile, then choose `start:gui`.

With supported evidence, a verified cached generation starts offline. A cold start acquires the
pinned Dist from `http://localhost:8080/dist.json`. `start:gui` never builds or starts that source
server. Local `dist/` is proof input and is excluded from package publication.

## Frozen browser verification

`deno task test:browser` rebuilds `dist/`; it does not test the selected candidate in place. To test
an existing candidate, first ensure these prerequisites:

- Supported launcher evidence is already bound to that exact candidate, including its expected
  package.
- `CHROME_BIN` names an existing canonical absolute executable path accepted by the browser
  admission checks. This task does not use ordinary browser discovery.
- The dependency cache is already populated for the verification lane; the launcher uses
  `--cached-only` and will not acquire missing dependencies.

Then, from the owning package directory:

```sh
deno task test:release:local:browser:frozen
```

This task neither builds nor binds evidence, and its output paths are protected. It checks
package/content admission, selected emitted markers, Service Worker policy and migration, and
candidate preservation—not general GUI functionality or the complete profile-launch interaction. It
does not establish publisher authenticity.

## Package admission contract

The supported expectation is `pin: { scheme: 'sys.dist/v2', digest }` plus an independently selected
package name and version. Neither renaming an old byte-checksum field nor downloading a manifest
supplies that expectation. See the
[FS Dist contracts](../../../sys/fs/README.md#distribution-integrity) and
[Vite build contracts](../../driver-vite/README.md#producing-a-dist-content-pin) for production and
verification responsibilities.

Pi requires an inventoried `pkg/-pkg.json` declaration of at most 16 KiB, with own, bounded `name`
and `version` strings. Vite writes that declaration when supplied its package identity. Pi reads it
with the admitted checksum and size after opening a release generation, before application startup,
and again against the started host's verified inventory before publishing readiness. The latter is
post-listener startup, not a pre-bind package guarantee. Missing, malformed, changed or mismatching
bytes refuse admission; root `dist.pkg` labels never substitute for covered package bytes. This is
Pi policy, not a requirement of generic Dist. Cancellation drains package reads before releasing
their directory owner.

## Reset

For `repair-required`, first stop active GUI/store owners cleanly (`q` or `Ctrl+C` for `start:gui`).
From the owning package directory above, the recovery task is:

```sh
deno task reset
```

**Confirm the target checkout before running it.** The default root is derived from this script's
source checkout, not the repository where a launcher most recently failed. The task removes both
complete namespaces below that checkout's workspace root, including any valid generations:

- `.pi/@sys/dist/@sys.driver-pi`
- `.pi/@sys/dist/@sys/driver-pi`

This is not selective deletion of a rejected generation. Active ownership can refuse removal, and a
failure can leave partial changes; inspect the reported settlement before retrying. If the failed
cache belongs to another repository, this task is not its recovery route. After removal, a cold
launch needs the configured source again. For `source-unavailable`, restore source access instead.
Reset does not change launcher evidence; use [Build, bind and launch](#build-bind-and-launch) to
select and bind a build.
