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

## Upstream

The workspace `deps.yaml` owns the upstream Pi npm package specifier and exact version.
`deno task prep` copies that pin into the fallback used when no `deps.yaml` is discoverable.

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

### Reset

Run only when GUI startup reports `The cache was refused and retained`:

```sh
deno task reset
```

This deletes the rejected cache; the next launch rebuilds it. For `source-unavailable`, restore source
access and relaunch instead.
