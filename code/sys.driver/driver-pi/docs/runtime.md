# Runtime and tools

[Package overview](../README.md)

## Launch modes and profiles

The root and `/cli` entries run the same profile launcher. Use `--profile <name|path>` to select a
saved profile without the menu; `--non-interactive` requires it. Named profiles live under
`-config/@sys.driver-pi/`; an explicit YAML path is also accepted. Ordinary arguments after `--`
pass through to Pi.

In TUI mode, profiles control prompts, context, skills, and extensions; competing startup arguments
are rejected. Explicit `--profile` selection chooses TUI mode. The menu's `start:gui` instead hosts
the browser artifact; it does not apply the selected profile's prompt/tool configuration to that
host. See the [local GUI workflow](./gui.md).

`deno run -A jsr:@sys/tools pi` delegates to the same launcher. Use `/cli/raw` only for explicit
upstream debugging without profile YAML, profile context, or the wrapper-owned default prompt. The
[library API](https://jsr.io/@sys/driver-pi/doc) exposes `Cli`/`Profiles` and `Raw`; the root `Pi`
namespace is currently empty.

## Configuration guide

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

## ZIP

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

## Runtime policy

- Launches require a Git repository by default and walk upward to the nearest `.git` root.
- `--git-root cwd` disables ancestor walk-up and treats the current directory as the candidate root.
- Repository-local runtime state is anchored under `./.pi/` at the resolved Git root.
- The launcher writes wrapper-owned Pi settings to `./.pi/agent/settings.json`.
- Default launches derive scoped Deno permissions from the working directory, runtime directories,
  profile policy, and explicit extras.
- The leading `deno run -A` authorizes the launcher itself. Launcher arguments `-A` and
  `--allow-all` also disable child scoping for unsafe debugging; this is not a launch default.
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
