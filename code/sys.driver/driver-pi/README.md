# @sys/driver-pi

A profile-driven Deno launcher for [Pi](https://pi.dev/) with explicit runtime roots, permissions,
and wrapper-owned tools.

## Usage

The root and `/cli` entries run the same profile launcher. Start with help, then launch from your
repository to select a profile:

```sh
deno run -A jsr:@sys/driver-pi --help
deno run -A jsr:@sys/driver-pi
```

Use `--profile <name|path>` to select a saved profile without the menu; `--non-interactive` requires
it. Named profiles live under `-config/@sys.driver-pi/`; an explicit YAML path is also accepted.
Ordinary arguments after `--` pass through to Pi. In TUI mode, profiles control prompts, context,
skills, and extensions; competing startup arguments are rejected. Explicit `--profile` selection
chooses TUI mode. The menu's `start:gui` instead hosts the browser artifact; it does not apply the
selected profile's prompt/tool configuration to that host.

The leading `deno run -A` authorizes the launcher itself. Passing `--allow-all` to the launcher also
grants the Pi child full Deno permissions. This is an unsafe debugging option, not a launch default.
Neither is a statement about an enclosing process sandbox.

`deno run -A jsr:@sys/tools pi` delegates to the same launcher. Use `/cli/raw` only for explicit
upstream debugging without profile YAML, profile context, or the wrapper-owned default prompt. The
[library API](https://jsr.io/@sys/driver-pi/doc) exposes `Cli`/`Profiles` and `Raw`; the root `Pi`
namespace is currently empty.

## Configuration

The help-only DSL reads packaged guidance; it does not launch Pi or install dependencies:

```sh
deno run -ER jsr:@sys/driver-pi dsl
deno run -ER jsr:@sys/driver-pi dsl profile
deno run -ER jsr:@sys/driver-pi dsl tools ocr-pdf
deno run -ER jsr:@sys/driver-pi dsl tools zip
```

Read the root index first, then the smallest matching chapter. Add `--format skill` for agent-facing
Markdown. Profile edits apply on relaunch; only the live session's registered tools establish
callability. Generated extensions are launcher-owned artifacts, not policy files to hand-edit.

PDF OCR is disabled by default and advertised only after profile enablement and successful startup
preflight. Its chapter owns enablement YAML, bounds, dependencies, and install-consent guidance.

### ZIP

`zip_inspect` and `zip_test` are enabled by default for a bounded, strict ZIP32 subset. Inspection
reports structure; testing verifies every payload's size and CRC. Neither returns file contents.

Extraction is a separate next-launch opt-in:

```yaml
tools:
  zip:
    enabled: true
    extract: cooperative
```

`zip_extract` accepts exactly `{ path, to }`. The source must be readable and the destination must
be a new directory beneath an existing parent in a configured writable root. No overwrite, merge,
symlink traversal, shell fallback, or ZIP creation is provided. Only the live tool list establishes
callability; profile changes require relaunch.

The archive is validated before files are written to a private staging directory. Pi then requests
publication at the destination. Calls targeting the same destination share one host's queue; it does
not coordinate nested destinations or other processes. These are cooperative safeguards, not
hostile-filesystem confinement or native atomic no-replace publication. The 120-second budget cannot
interrupt queue waits or native I/O; an expired queued call refuses work when admitted.

Publication and cleanup are separate facts: a cleanup error can leave a complete destination or
private residue. Do not infer rollback. Integrity establishes neither provenance nor content safety.
Extraction requires the canonical dependency-selected Pi host; package overrides are refused.

See `deno run -ER jsr:@sys/driver-pi dsl tools zip` for fixed limits and policy details.

## Upstream

Root `deps.yaml` selects the upstream Pi version. The launcher carries a derived fallback so it can
run without a local Pi dependency declaration. A local declaration takes precedence over that
fallback; an explicit package override takes precedence over both.

Edit the manifest, not the fallback. Root `deno task upgrade` refreshes the fallback after applying
the root manifest. After manual dependency edits, use root `deno task prep` for full preparation.
Package `deno task prep:deps` repairs only the fallback; import and lock files must already be
current.

Package `deno task check:deps` rejects fallback drift without writing; package `check` includes it.
`deno task test:deps` also checks agreement with the import map. Version agreement does not
establish compatibility with the upstream Pi host.

An upgrade is not a transaction: a refresh failure rejects the task but leaves prior dependency
writes in place. The printed dependency summary is not confirmation that the whole task succeeded.

## Runtime policy

- Launches require a Git repository by default and walk upward to the nearest `.git` root.
- `--git-root cwd` disables ancestor walk-up and treats the current directory as the candidate root.
- Repository-local runtime state is anchored under `./.pi/` at the resolved Git root.
- The launcher writes wrapper-owned Pi settings to `./.pi/agent/settings.json`.
- Default launches derive scoped Deno permissions from the working directory, runtime directories,
  profile policy, and explicit extras.
- Launcher arguments `-A` and `--allow-all` explicitly disable child scoping for unsafe debugging.
- Previews/startup sheets and `./.pi/@sys/log/@sys.driver-pi/*.sandbox.log.md` distinguish scoped
  versus allow-all **Deno API permissions** from process confinement. This launcher supplies no
  shell/process confinement; any enclosing protection is unknown. Native subprocesses do not inherit
  Deno read/write path bounds. Allow-all does not prove an enclosing sandbox is absent.
- Reports identify launcher version, upstream selection, profile, default/custom system prompt, and
  ordered instruction contributions without recording prompt/context bodies or environment values.
  Only the known upstream package stem with a numeric release is shown; other specifiers are
  redacted, not echoed. Unknown tool/runtime facts remain unknown.
- A `preview` snapshot skips extension materialization and OCR preflight. A fresh `launch-input`
  report is written after final resolution and before process launch, even when grants are
  unchanged. Its resolution timestamp is distinct from report-write time. Neither snapshot proves
  execution, live tool callability, content identity from paths, or the provider's effective prompt.
  Resolution itself may migrate profiles and write context/extensions; it is not read-only.
- Legacy `.log/@sys.driver-pi/` and `.log/@sys.driver-pi.pi/` reports migrate without overwriting
  canonical files.

Local raw bash is not a sandbox boundary. These rules provide defense in depth around Pi launch
behavior, not complete containment.

## Development

Run these tasks from the owning package directory in this source checkout:

```sh
cd code/sys.driver/driver-pi
```

Choose the task by outcome:

| Outcome                                 | Task                 |
| --------------------------------------- | -------------------- |
| Run the source development server       | `deno task dev`      |
| Build `dist/`                           | `deno task build`    |
| Serve the existing `dist/`              | `deno task serve`    |
| Reset both GUI cache namespaces         | `deno task reset`    |
| Build and bind local rehearsal evidence | `deno task bind:dev` |

### ZIP verification

`deno task prep:zip` prepares both entries with exact import/export admission and byte digests.
`deno task prep:zip --check` rebuilds and compares exact prepared bytes without updating the
artifacts; use it to verify source correspondence before generated-host acceptance.
`deno task test:unit` covers policy, guards, construction settlement, publication races and cleanup.
`deno task test:host` separately exercises generated extraction in the selected CLI, its shared
queue, and actual Agent sequencing and failure results using a local scripted provider, not a remote
request. `deno task test:zip:permissions` proves fixture-scoped reads and destination-only writes
with run, net, FFI, env and sys denied. The host child retains its existing startup authority
separately.

### Local GUI workflow — source-checkout launcher

`start:gui` hosts a verified browser artifact, not a profile-configured Pi agent. Use the profile
menu described in [Usage](#usage); explicit `--profile` launches TUI mode instead.

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

### Frozen browser verification

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

### GUI package admission contract

The supported expectation is `pin: { scheme: 'sys.dist/v2', digest }` plus an independently selected
package name and version. Neither renaming an old byte-checksum field nor downloading a manifest
supplies that expectation. See the
[FS Dist contracts](../../sys/fs/README.md#distribution-integrity) and
[Vite build contracts](../driver-vite/README.md#producing-a-dist-content-pin) for production and
verification responsibilities.

Pi requires an inventoried `pkg/-pkg.json` declaration of at most 16 KiB, with own, bounded `name`
and `version` strings. Vite writes that declaration when supplied its package identity. Pi reads it
with the admitted checksum and size after opening a release generation, before application startup,
and again against the started host's verified inventory before publishing readiness. The latter is
post-listener startup, not a pre-bind package guarantee. Missing, malformed, changed or mismatching
bytes refuse admission; root `dist.pkg` labels never substitute for covered package bytes. This is
Pi policy, not a requirement of generic Dist. Cancellation drains package reads before releasing
their directory owner.

### Reset

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
Reset does not change launcher evidence; use the
[local GUI workflow](#local-gui-workflow--source-checkout-launcher) to select and bind a build.

## Conceptual Primitives

Working frame for this package, not a universal industry definition of “agent.”

```text
<LLM> + shell + fs + markdown + cron == "agent" (🦞)
```

"Marrying the language-model mindset to the
[Unix shell/prompt mindset](https://github.com/sys-repo/sys?tab=readme-ov-file#development-philosophy).
**What is an agent?**" — [Marc Andreessen](https://www.youtube.com/watch?v=knx2wrILP1M&t=2121s)

It is:

- 🦞
- ↑ `cron` job (loop, heartbeat)
- ↑ file-system, `fs` (state, .md)
- ↑ shell, `bash`
- ↑ language-model (LLM)

## References

- Mario Zechner, creator of [Pi](https://pi.dev/) —
  [video](https://www.youtube.com/watch?v=Dli5slNaJu0)
- Lucas Meijer — [video](https://www.youtube.com/watch?v=fdbXNWkpPMY), “love letter to Pi”
- Mario Zechner and Armin Ronacher — [video](https://www.youtube.com/watch?v=n5f51gtuGHE),
  “self-modifying software”
- John McCarthy,
  [A programming language based on speech acts](https://www-formal.stanford.edu/jmc/elephant.pdf)
  (1990)
- Birgitta Böckeler,
  [Harness Engineering](https://martinfowler.com/articles/harness-engineering.html),
  MartinFowler.com (2026)
