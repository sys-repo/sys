# @sys/driver-pi

A Deno launcher for running [Pi](https://pi.dev/) as a profile-driven system agent with an explicit launch sandbox.

<p>&nbsp;</p>

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

```ts
import { Pi, pkg } from 'jsr:@sys/driver-pi';
import { Pi as PiCore } from 'jsr:@sys/driver-pi/core';
import { Cli, Profiles } from 'jsr:@sys/driver-pi/cli';
import { Raw } from 'jsr:@sys/driver-pi/cli/raw';
```

## CLI

```sh
deno run -A jsr:@sys/driver-pi                # alias to /cli
deno run -A jsr:@sys/driver-pi/cli
deno run -A jsr:@sys/driver-pi/cli --profile canon
deno run -A jsr:@sys/driver-pi/cli --profile ./profiles/canon.yaml
deno run -A jsr:@sys/driver-pi/cli --allow-all  # unsafe debug
deno run -A jsr:@sys/driver-pi/cli/raw -- --help  # explicit raw Pi boundary

# equivalent wrapper from @sys/tools
deno run -A jsr:@sys/tools pi
deno run -A jsr:@sys/tools pi --profile canon
deno run -A jsr:@sys/tools pi --allow-all  # unsafe debug
```

<p>&nbsp;</p>

## Profiles

- `/cli` is profile-driven by default; raw upstream Pi access is explicit at `/cli/raw`.
- Named profiles resolve to `-config/@sys.driver-pi/<name>.yaml`.
- Legacy `-config/@sys.driver-pi.pi/` profiles migrate without overwriting canonical files.
- `--profile <name|path>` loads a named profile or an explicit profile YAML file.
- Path-like profile selectors start with `/`, `./`, `../`, or `~/`.
- Arguments after `--` pass through to Pi unchanged.

## Runtime policy

- Launches require a git repository by default and walk upward to the nearest `.git` root.
- `--git-root cwd` disables ancestor walk-up and treats the current directory as the candidate root.
- Runtime state is anchored to the resolved git root:
  - `./.pi/agent/`
  - `./.tmp/pi.cli/`
  - `./.log/@sys.driver-pi/`
- The launcher writes wrapper-owned Pi settings to `./.pi/agent/settings.json`.
- Default launches use scoped Deno permissions derived from cwd, runtime dirs, profile policy, and
  explicit extras.
- `-A` / `--allow-all` is an explicit unsafe debug mode for the launched Pi child.
- Sandbox previews and `.log/@sys.driver-pi/*.sandbox.log.md` record the effective permission
  posture.
- Legacy `.log/@sys.driver-pi.pi/` reports migrate without overwriting canonical files.

Local raw bash is not a sandbox boundary. These rules are defense-in-depth around Pi launch
behavior, not complete containment.

<p>&nbsp;</p>

## Refs

- Mario Zechner, [Pi](https://pi.dev/) creator —
  [ref:video](https://www.youtube.com/watch?v=Dli5slNaJu0)
- Lucas Meijer — [ref:video](https://www.youtube.com/watch?v=fdbXNWkpPMY) ("love letter to pi")
- Mario and Armin Ronacher — [ref:video](https://www.youtube.com/watch?v=n5f51gtuGHE) ("self
  modifying software")
- John McCarthy, creator of Lisp —
  [A programming language based on speech acts](https://www-formal.stanford.edu/jmc/elephant.pdf)
  (1990)
