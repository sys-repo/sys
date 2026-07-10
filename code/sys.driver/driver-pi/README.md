# @sys/driver-pi

A Deno launcher for running [Pi](https://pi.dev/) as a profile-driven system agent with an explicit
launch sandbox.

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

## OCR PDF tool

PDF OCR is disabled by default. Enable the wrapper-owned `ocr_pdf` tool explicitly in a profile:

```yaml
tools:
  ocr:
    pdf:
      enabled: true
```

The long-form profile shape is:

```yaml
tools:
  ocr:
    pdf:
      enabled: false
      languages: [eng]
      defaultLanguage: eng
      dpi: 200
      maxPages: 10
      maxChars: 60000
      timeoutMs: 120000
```

Bounds:

- `dpi`: `72..600`
- `maxPages`: `1..100`
- `maxChars`: `1..1_000_000`
- `timeoutMs`: `1_000..600_000ms`

Use `ocr_pdf` only for lossy optical character recognition of scanned/image-based PDF pages. It is
not authoritative file reading, a general PDF parser, embedded-text extraction, markdown conversion,
or summarization.

When `tools.ocr.pdf.enabled: true`, startup checks OCR dependencies before Pi launches. If preflight
fails, Pi is not told that `ocr_pdf` exists. Sandbox previews do not run OCR probes, ask install
questions, materialize OCR extensions, or advertise `ocr_pdf`.

Required local dependencies:

```sh
brew install poppler tesseract
```

This installs Poppler tools (`pdfinfo`, `pdftoppm`) and Tesseract. Tesseract language data for the
configured `languages`/`defaultLanguage` must be available from `tesseract --list-langs` during
startup preflight.

Setup paths:

- Install manually with `brew install poppler tesseract`, then re-run the profile launch.
- Or pass `--install-ocr-deps` to explicitly consent to the fixed Homebrew install command.
- Interactive startup may prompt for install consent when dependencies are missing; the prompt
  defaults to skip.

The generated `ocr_pdf` runtime never installs software, never resolves executables from ambient
`PATH`, and never calls a shell. It receives frozen absolute executable paths from launcher
preflight. Runtime setup guidance is reserved for substrate/start failures; configured language-data
errors are caught at startup before `ocr_pdf` is advertised.

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
- Birgitta Böckeler,
  [Harness Engineering](https://martinfowler.com/articles/harness-engineering.html) —
  MartinFowler.com, 2026
