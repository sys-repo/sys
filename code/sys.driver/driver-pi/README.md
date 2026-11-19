# @sys/driver-pi

A profile-driven Deno launcher for [Pi](https://pi.dev/).

## Usage

From a Git repository, launch Pi and select a profile:

```sh
deno run -A jsr:@sys/driver-pi
```

Use `--profile <name|path>` to select a profile directly, or `--help` for options.

The command grants full permissions to the launcher; Pi receives scoped Deno permissions by default.
Deno path limits do **not** sandbox Bash or its subprocesses.

## Configuration

Profiles configure prompts, context, skills, and wrapper-owned tools. Explore the packaged guide:

```sh
deno run -ER jsr:@sys/driver-pi dsl
```

## Guides

- [Runtime and tools](./docs/runtime.md)
- [Development](./docs/development.md)
- [Local GUI workflow](./docs/gui.md)
- [Pi compatibility](./-scripts/-test.external/README.compat.md)
- [Library API](https://jsr.io/@sys/driver-pi/doc)

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
