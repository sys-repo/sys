# @sys/driver-pi
A typed Deno boundary for running [Pi](https://pi.dev/) as a profile-driven system agent.

<p>&nbsp;</p>

## Conceptual Primitives
Working frame for this package, not a universal industry definition of “agent.”

```text
<LLM> + shell + fs + markdown + cron == "agent" (🦞)
```

"Marrying the language-model mindset to the [Unix shell/prompt mindset](https://github.com/sys-repo/sys?tab=readme-ov-file#development-philosophy). **What is an agent?**" — [Marc Andreessen](https://www.youtube.com/watch?v=knx2wrILP1M&t=2121s)

It is:

- 🦞
- ↑ `cron` job (loop, heartbeat)
- ↑ file-system, `fs` (state, .md)
- ↑ shell, `bash`
- ↑ language-model (LLM)

## Usage

```ts
import { pkg } from 'jsr:@sys/driver-pi';
import { Pi } from 'jsr:@sys/driver-pi/pi';
import { Cli, Profiles } from 'jsr:@sys/driver-pi/cli';
```

## CLI

```sh
deno run -A jsr:@sys/driver-pi/cli Profiles
deno run -A jsr:@sys/driver-pi/cli Profiles --profile canon
deno run -A jsr:@sys/driver-pi/cli Profiles --allow-all  # unsafe debug

# equivalent wrapper from @sys/tools
deno run -A jsr:@sys/tools pi
deno run -A jsr:@sys/tools pi --profile canon
deno run -A jsr:@sys/tools pi --allow-all  # unsafe debug
```


<p>&nbsp;</p>

## Profiles

- Named profiles resolve to `-config/@sys.driver-pi.pi/<name>.yaml`.
- `--profile <name>` loads a named profile.
- `--config <path>` loads an explicit profile YAML file.
- Arguments after `--` pass through to Pi unchanged.

## Runtime policy

- Launches require a git repository by default and walk upward to the nearest `.git` root.
- `--git-root cwd` disables ancestor walk-up and treats the current directory as the candidate root.
- Runtime state is anchored to the resolved git root:
  - `./.pi/agent/`
  - `./.tmp/pi.cli/`
  - `./.log/@sys.driver-pi.pi/`
- The launcher writes wrapper-owned Pi settings to `./.pi/agent/settings.json`.
- Default launches use scoped Deno permissions derived from cwd, runtime dirs, profile policy, and explicit extras.
- `-A` / `--allow-all` is an explicit unsafe debug mode for the launched Pi child.
- Sandbox previews and `.log/@sys.driver-pi.pi/*.sandbox.log.md` record the effective permission posture.

Local raw bash is not a sandbox boundary. These rules are defense-in-depth around Pi launch behavior, not complete containment.

<p>&nbsp;</p>

## Refs
- Mario Zechner, [Pi](https://pi.dev/) creator — [ref:video](https://www.youtube.com/watch?v=Dli5slNaJu0)
- Lucas Meijer — [ref:video](https://www.youtube.com/watch?v=fdbXNWkpPMY) ("love letter to pi")
- Mario and Armin Ronacher — [ref:video](https://www.youtube.com/watch?v=n5f51gtuGHE) ("self modifying software")
