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

## CLI

```sh
# Profile-driven launcher.
deno run -A jsr:@sys/driver-pi                     # alias to /cli
deno run -A jsr:@sys/driver-pi/cli
deno run -A jsr:@sys/driver-pi/cli --profile canon
deno run -A jsr:@sys/driver-pi/cli --profile ./profiles/canon.yaml

# Explicit raw upstream Pi boundary.
deno run -A jsr:@sys/driver-pi/cli/raw -- --help

# Unsafe debugging: grant the launched Pi child full authority.
deno run -A jsr:@sys/driver-pi/cli --allow-all
```

The leading `deno run -A` authorizes the launcher itself. The trailing `--allow-all` is a launcher
option that grants full authority to the Pi child.

The equivalent `@sys/tools` wrapper delegates to the same launcher:

```sh
deno run -A jsr:@sys/tools pi
deno run -A jsr:@sys/tools pi --profile canon
deno run -A jsr:@sys/tools pi --allow-all
```

## Library

```ts
import { Pi, pkg } from 'jsr:@sys/driver-pi';
import { Pi as PiCore } from 'jsr:@sys/driver-pi/core';
import { Cli, Profiles } from 'jsr:@sys/driver-pi/cli';
import { Raw } from 'jsr:@sys/driver-pi/cli/raw';
```

## Configuration

### Profiles

- `--profile <name|path>` loads a named profile or an explicit profile YAML file.
- Ordinary arguments after `--` pass through to Pi unchanged; profile mode still owns prompt,
  context, skill, and extension startup surfaces.

### Pi-Driver DSL

Pi-Driver includes a help-only DSL chapter book for profile, tool, and extension policy. Live
session tools are the source of callability truth; the DSL describes durable profile edits and
next-launch configuration.

The direct command uses narrow permissions because it reads only packaged guidance:

```sh
deno run -ER jsr:@sys/driver-pi dsl [chapter...] [--format human|skill]
```

The `@sys/tools` wrapper delegates to the same route:

```sh
deno run -A jsr:@sys/tools pi dsl [chapter...] [--format human|skill]
```

Run the root command for the current chapter index. Add `--format skill` to project a chapter as
agent-facing Markdown.

Profile guidance starts here:

```sh
deno run -ER jsr:@sys/driver-pi dsl profile
```

### OCR PDF

PDF OCR is disabled by default. The wrapper-owned `ocr_pdf` tool is advertised only after profile
policy enables it and startup preflight succeeds.

Use the DSL chapter for enablement YAML, defaults, bounds, dependency preflight, install-consent
paths, and the live-callability boundary:

```sh
deno run -ER jsr:@sys/driver-pi dsl tools ocr-pdf
```

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

Archive verifies before Fs constructs privately, then Pi requests promotion. Exact destination keys
share the running host's queue—not subtrees or other processes. This is cooperative filesystem
safety, not hostile-filesystem confinement or native atomic no-replace publication. The 120-second
budget cannot hard-preempt queue waiting or native I/O; expired callbacks refuse work on entry.

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
- Sandbox previews and `./.pi/@sys/log/@sys.driver-pi/*.sandbox.log.md` record the effective
  permission posture.
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

For an intentionally selected, already-built candidate, invoke only the narrow binding leaf:

```sh
deno task bind:gui:evidence:local
```

The leaf verifies `dist/` and replaces only the launcher evidence file. It never builds, serves, or
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
