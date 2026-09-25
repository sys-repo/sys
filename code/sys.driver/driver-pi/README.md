# @sys/driver-pi

A profile-driven Deno launcher for [Pi](https://pi.dev/) with explicit runtime roots, permissions,
and wrapper-owned tools.

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

## Usage

The root and `/cli` entries run the same profile launcher. Start with help, then launch from your
repository to select a profile:

```sh
deno run -A jsr:@sys/driver-pi --help
deno run -A jsr:@sys/driver-pi
```

Use `--profile <name|path>` to select a saved profile without the menu; `--non-interactive` requires
it. Named profiles live under `-config/@sys.driver-pi/`; an explicit YAML path is also accepted.
Ordinary arguments after `--` pass through to Pi. Profiles control prompts, context, skills, and
extensions; competing startup arguments are rejected.

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

<p>&nbsp;</p>

---

<p>&nbsp;</p>

## Development

Choose the task by outcome:

| Outcome                                 | Task                 |
| --------------------------------------- | -------------------- |
| Run the source development server       | `deno task dev`      |
| Build `dist/`                           | `deno task build`    |
| Serve the existing `dist/`              | `deno task serve`    |
| Remove a rejected GUI cache             | `deno task reset`    |
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

### Local GUI evidence

Build and bind the local-rehearsal candidate from current source:

```sh
deno task bind:dev
```

`bind:dev` runs `build`, then binds the resulting `dist/`. If the build fails, binding does not run.

`start:gui` trusts checked-in local-rehearsal evidence, not published release evidence. A verified
cached generation starts offline. A cold start acquires the exact Dist from
`http://localhost:8080/dist.json`. `start:gui` never builds or starts the local server. The local
`dist/` is proof input and is excluded from package publication.

To bind a specific existing build without rebuilding it:

```sh
deno task bind:gui:evidence:local
```

This task verifies `dist/` and replaces only the launcher evidence file. It never builds, serves, or
contacts `:8080`.

Serve the already-built `dist/` for browser preview and local acquisition:

```sh
deno task serve
```

The task verifies `dist/` before opening one loopback listener on `:8080`. That listener serves the
preview at `/`, the exact saved manifest at `/dist.json`, and every manifest-declared part.

In another workspace terminal, run `sys pi`, select `<profile>`, then `start:gui`.

`deno task test:browser` rebuilds `dist/`; it does not test the selected candidate in place. Use
`deno task test:release:local:browser:frozen` to test and preserve that candidate.

### Reset

Run only when GUI startup reports `The cache was refused and retained`:

```sh
deno task reset
```

This deletes the rejected cache; the next launch reacquires it. For `source-unavailable`, restore
source access and relaunch instead.
