# Pi Driver DSL plan

- [x] feat(driver-pi): add structural DSL chapter-book spine (`49dbe3ec7`)
- [x] feat(driver-pi): route Driver-Pi DSL help command with truth-locked tests (`27099d5b1`)
- [x] feat(tools): surface Driver-Pi DSL through the `pi` wrapper (`e2d9eda1e`)
- [x] feat(driver-pi): define profile tool DSL chapters (`ecab31148`)
- [x] feat(driver-pi): add OCR PDF DSL chapter (`b435ff022`)
- [x] feat(driver-pi): teach the profile prompt to consult Driver-Pi DSL (`f35a605e4`)
- [x] refactor(driver-pi): DRY existing profile/tool documentation into Driver-Pi DSL (`eae5df826`)
- [x] docs(driver-pi): document Driver-Pi DSL (`ab5915481`)

> Status: retired. Pi Driver is the human-facing label; `@sys/driver-pi` remains the package,
> command, import, and path address. The implemented DSL is a general `@sys/driver-pi dsl` chapter
> system for profile/tool/extension operations. OCR PDF enablement is the first concrete tool
> chapter, not a special one-off prompt affordance.

## Hard review: first move

Yes: the first move is a BMIND structure pass, not OCR content. Start by reading the existing DSL
shapes in `@sys/tmpl`, `@sys/cell`, `@sys/server`, `@sys/tools`, `@sys/workspace`, and the shared
`@sys/cli` `Fmt.Chapters` substrate, then give Driver-Pi the same boring chapter-book spine.

The baseline should land across the first two commits as an intentionally thin, reusable Driver-Pi
DSL shell: authored YAML chapter resources, chapter registry, loader, renderer, CLI route, skill
projection, and routing tests. It should be general enough for all future Driver-Pi
tools/extensions; OCR PDF is only the first concrete chapter to hang on that spine later.

Do not start by filling in OCR guidance. First prove the empty structure and path grammar: root →
profile → tools/extensions, with command routing, unknown-chapter errors, format handling, and no
implication that a disabled tool is callable.

Truth-lock gate: the structural spine already names the intended command, so the next arc step must
route that exact command and prove it is help-only. Do not add temporary planned/pending wording
that will be immediately undone by the route slice.

## XHIGH BMIND design review

Subject: not OCR; Driver-Pi needs a truthful profile-edit learning surface for next-launch
capabilities without blurring live-session tool callability.

Decision holds: a DSL chapter book is the right shape because it separates three concerns that must
stay distinct:

- `profile` → active YAML authority, minimal edits, and restart/relaunch semantics
- `tools` → profile-authored callable-tool policies, mirroring the `tools:` YAML noun
- `extensions` → launcher-generated Pi extension materialization, never hand-authored by agents

Do not use `capabilities` as a chapter noun for tool policy. In Driver-Pi YAML, `sandbox.capability`
already names read/write/env grants, so using `capabilities` for tool enablement would overload a
real profile concept.

Slice discipline:

1. Structural spine proves the book/loader/resource shape and structural chapters only.
2. CLI route proves `dsl` is help-only and reachable without selecting or launching a profile; the
   same slice carries truth-lock tests proving advertised DSL commands cannot fall through to
   profile selection, Pi launch, or passthrough args.
3. `@sys/tools pi` surfacing proves the public Sys wrapper delegates the same DSL route and renders
   the wrapper command identity without duplicating Driver-Pi DSL implementation.
4. Generic profile/tool/extension chapters define the reusable rules.
5. OCR PDF hangs under `tools ocr-pdf` after the generic path is proven.

The structural spine must not advertise `tools ocr-pdf` as a valid route until the OCR chapter
lands. Final acceptance may mention OCR, but early-slice tests should distinguish structural routes
from future concrete tool chapters.

## Problem

A live Pi session can truthfully say it has no callable `ocr_pdf` tool when OCR is disabled or when
startup preflight has not passed. That answer is correct, but the current live session does not have
a principled, discoverable way to learn how to enable OCR for the next launch.

Do not solve this by adding OCR-specific dormant capability prose directly to the generic runtime
prompt. That creates a second ad hoc way for Pi to progressively acquire domain understanding.

## Decision

Add a general Driver-Pi DSL/help book, following the established `@sys/cell dsl` and `@sys/cli`
chapter-book pattern.

Driver-Pi DSL owns guidance for profile/config/tool-extension edits. Runtime tool contracts continue
to own callable tool behavior only after the launcher has actually registered the tool.

```txt
@sys/driver-pi dsl
  root reading protocol, active profile authority, tool truth, and chapter index

@sys/driver-pi dsl profile
  profile YAML editing rules and restart/relaunch semantics

@sys/driver-pi dsl tools
  profile-authored tool policy index and shared tool enablement rules

@sys/driver-pi dsl tools ocr-pdf
  PDF OCR enablement, dependency preflight, and disabled-tool dialogue behavior

@sys/driver-pi dsl extensions
  launcher-owned generated extension boundary and no hand-authoring rule
```

## Invariants

- DSL guidance does not imply tool callability.
- `Runtime Tool Contract: ocr_pdf` is appended only when OCR PDF is enabled and startup preflight
  succeeds.
- If OCR is disabled in the live session, Pi must not claim it can call `ocr_pdf`.
- If asked to enable OCR, Pi should read the Driver-Pi DSL root and `tools ocr-pdf` chapter before
  editing profile YAML.
- Profile-affecting edits target the launcher-provided active profile when available.
- Enabling OCR requires relaunch/restart; it is not hot-enabled inside the existing Pi session.
- Startup preflight remains launcher-owned and proves Poppler/Tesseract substrate before `ocr_pdf`
  is advertised.
- Generated tools still never install dependencies, never use shell fallback, and never resolve
  executables from ambient `PATH`.

## Precedent

Reuse the existing chapter-book shape from:

- `@sys/cli` `Fmt.Chapters`, `Book`, and `Resources`
- `@sys/cell dsl`
- `@sys/cell dsl --format skill`
- `@sys/tmpl dsl`
- `@sys/server dsl`
- `@sys/tools dsl`
- `@sys/workspace dsl`

The Driver-Pi DSL should use authored YAML chapters bundled into the package, then render human and
skill projections through the same reusable formatting pattern.

## Learned prompt and tool-truth pattern

Current system-prompt practice already has two distinct lanes:

1. General known-framework affordances live as small bootstrap rules in the base/profile prompt. The
   current profile prompt already teaches broad habits like Deno/JSR usage, importing `@sys/*`
   libraries, and inspecting `deno run jsr:@sys/<pkg> --help` before using Sys CLIs.
2. Callable tool existence is signaled only by startup materialization plus a runtime tool contract.
   Built-in tools are listed in the base prompt, and wrapper-owned tools such as `remove`, `move`,
   `copy`, and `ocr_pdf` append their contracts only when the launcher has actually enabled and
   registered them.

Driver-Pi DSL belongs in the first lane. It is a known framework/DSL affordance for learning how to
edit Driver-Pi profiles, tools, and extensions. It is not a dormant-tool advertisement and does not
prove `ocr_pdf` or any future extension tool is callable.

Therefore the prompt change should be BMIND-small: teach that `@sys/driver-pi dsl` exists and must
be consulted for Driver-Pi profile/tool/extension edits, while preserving the existing rule that
live callable tools are only those registered in the current session.

## Desired live-session behavior

Question:

```txt
do you have OCR tool enabled?
```

When OCR is not callable, answer along these lines:

```txt
No callable `ocr_pdf` tool is enabled in this live session.

If you want OCR enabled for the next launch, I can read `@sys/driver-pi dsl tools ocr-pdf`, update
the active profile YAML, and then ask you to restart/relaunch Pi so startup preflight can verify the
OCR substrate before the tool is advertised.
```

Request:

```txt
enable OCR
```

Expected flow:

1. Read `@sys/driver-pi dsl`.
2. Read `@sys/driver-pi dsl tools ocr-pdf`.
3. Inspect the active profile path from runtime metadata.
4. Edit the profile YAML to include the minimal enablement shape:

   ```yaml
   tools:
     ocr:
       pdf:
         enabled: true
   ```

5. Tell the user to restart/relaunch Pi.
6. Explain that startup preflight will verify `pdfinfo`, `pdftoppm`, `tesseract`, and configured
   Tesseract language data before `ocr_pdf` becomes available.

## Proposed implementation slices

### 1. Normalize the standard DSL spine

- Use the existing chapter-book shape from `@sys/tmpl`, `@sys/cell`, `@sys/server`, `@sys/tools`,
  `@sys/workspace`, and `@sys/cli` `Fmt.Chapters` as the baseline.
- Add `src/m.core/m.help/` or equivalent Driver-Pi-owned help module.
- Add authored YAML resources and bundled resource loading for a root Driver-Pi DSL book.
- Keep the initial chapter set structural: root, profile, and tools/extensions index chapters.
- Do not add OCR-specific guidance in this slice.
- Add tests for loading root and child chapters.

### 2. Add `dsl` CLI command surface

This slice resolves the structural spine's command truth-lock. Do not create a temporary
planned/pending command state; route the advertised command and prove it cannot launch Pi.

Canonical implementation lives in `@sys/driver-pi`; wrappers may delegate to it but must not own a
second DSL renderer or chapter registry.

- Expose the structural shell first:

  ```sh
  deno run -ER jsr:@sys/driver-pi dsl
  deno run -ER jsr:@sys/driver-pi dsl profile
  deno run -ER jsr:@sys/driver-pi dsl tools
  deno run -ER jsr:@sys/driver-pi dsl extensions
  deno run -ER jsr:@sys/driver-pi dsl --format skill
  deno run -ER jsr:@sys/driver-pi dsl profile --format skill
  ```

- Keep command behavior deterministic and help-only; it must not launch Pi, edit files, install
  dependencies, or probe OCR substrate.
- Reject unrelated launcher/profile flags for `dsl` just as `@sys/cell dsl` and `@sys/tmpl dsl`
  reject unrelated command flags.
- Preserve profile launcher semantics: `dsl` must not require `--profile`, `--non-interactive`, or a
  runnable Pi session.
- Add negative tests proving `dsl` does not open the profile menu, select a profile, launch Pi, or
  forward `dsl` as a Pi passthrough arg.

### 3. Surface through `@sys/tools pi`

The common human/operator entrypoint is `deno run -A jsr:@sys/tools pi`. Driver-Pi DSL must remain
owned by `@sys/driver-pi`, but the Sys tools wrapper should surface the same route instead of making
operators discover a second package entrypoint.

Expected wrapper affordances:

```sh
deno run -A jsr:@sys/tools pi dsl
deno run -A jsr:@sys/tools pi dsl profile
deno run -A jsr:@sys/tools pi dsl tools
deno run -A jsr:@sys/tools pi dsl extensions
deno run -A jsr:@sys/tools pi dsl --format skill
```

Implementation notes:

- `@sys/tools/pi` is a pass-through to `@sys/driver-pi/cli`; prefer delegation over duplicating DSL
  implementation in `@sys/tools`.
- Preserve `PI_CLI_PROFILES_HELP_TOOL` or equivalent help-tool identity so `pi --help` can render
  wrapper-shaped examples such as `deno run -A jsr:@sys/tools pi dsl`.
- Add `@sys/tools` tests proving `pi dsl ...` forwards to the Driver-Pi CLI route and does not get
  swallowed by the root tools dispatcher.
- Add help/snapshot coverage proving `deno run -A jsr:@sys/tools pi --help` exposes or points to the
  DSL route once the Driver-Pi route exists.
- Do not add Driver-Pi DSL chapters under `@sys/tools dsl`; `@sys/tools dsl` is the Tools DSL, not
  the Driver-Pi DSL.

### 4. Root DSL chapter

Include:

- reading protocol
- active profile authority
- runtime metadata usage
- profile edit/restart rule
- distinction between DSL guidance and callable tools
- chapter index
- speech acts/mappings for profile/tool/extension operations

### 5. Profile chapter

Include:

- profile path/name resolution basics
- active profile preference
- YAML edit rules
- minimal safe config changes
- restart/relaunch wording
- no prompt-surface passthrough or extension hand-authoring

### 6. OCR PDF tool chapter

Add this only after the structural DSL spine and generic `tools` chapter are proven.

Expose:

```sh
deno run -ER jsr:@sys/driver-pi dsl tools ocr-pdf
deno run -ER jsr:@sys/driver-pi dsl tools ocr-pdf --format skill
```

Include:

- classify `enable OCR`, `enable PDF OCR`, and `make OCR available` as OCR PDF profile enablement
- minimal YAML enablement only:

  ```yaml
  tools:
    ocr:
      pdf:
        enabled: true
  ```

- defaults and bounds summary
- startup preflight behavior
- dependency names and fixed Homebrew install command
- no shell fallback and no runtime install behavior
- expected disabled-session answer
- restart/relaunch requirement
- `ocr_pdf` remains lossy OCR, not authoritative file reading

### 7. Startup prompt bootstrap

Add this only after the `dsl` CLI route is live and tested. A profile prompt must not instruct
agents to run a command that currently falls through to profile selection, Pi launch, or passthrough
args.

Add only a small generic bootstrap instruction to the profile-mode prompt. This should be consistent
with the existing base-prompt treatment of known libraries/frameworks: Deno, JSR, `@sys/*` imports,
and Sys CLI `--help` inspection are taught as habits, not expanded inline manuals.

Example wording:

```txt
For Driver-Pi profile, tool, or extension changes, read `deno run -ER jsr:@sys/driver-pi dsl` and
the matching chapter before editing profile YAML. DSL guidance does not prove a tool is callable;
callable tools are only those registered in this live session.
```

Implementation notes:

- Prefer one generic Driver-Pi DSL bootstrap instruction over OCR-specific dormant prose.
- Keep it near the existing profile-mode prompt rules that teach config edits, Deno/JSR, and Sys CLI
  help inspection.
- If the user asks whether a tool is enabled, answer from the live tool surface first.
- If the tool is not callable but the user wants enablement, consult the matching Driver-Pi DSL
  chapter before editing the active profile.
- Do not inline the OCR chapter in the startup prompt.

### 8. DRY documentation audit

After the structural DSL and OCR chapter exist, audit existing Driver-Pi documentation-like surfaces
and move reusable agent/operator guidance into the DSL chapter book where it belongs.

Audit at least:

- `README.md` profile, sandbox, and OCR sections
- profile launcher `--help` copy
- profile-mode base prompt guidance
- sandbox filesystem tool prompt contracts for `remove`, `move`, and `copy`
- OCR runtime prompt contract for `ocr_pdf`
- retained plan notes that describe current profile/tool behavior

Rules:

- Keep runtime tool contracts as safety-critical callable-tool instructions; do not replace them
  with DSL chapters.
- Keep CLI `--help` concise and operator-facing; link or point to DSL rather than duplicating
  chapter content.
- Keep README as human overview; avoid letting it become the only source for agent action rules.
- Move durable profile/tool/extension editing rules into DSL chapters.
- Remove or shorten stale duplicated prose only after the DSL chapter contains the same current
  truth.
- Do not change behavior in this audit slice unless a stale doc exposes a real implementation drift;
  if so, split the behavior fix into its own commit.

### 9. Validation and docs

- Add tests for DSL rendering, child chapter routing, unknown chapter errors, and skill projection.
- Add profile-run tests proving the generic DSL bootstrap prompt is present without advertising
  disabled OCR as callable.
- Add audit coverage or review notes proving existing documentation-like surfaces either point to
  the DSL or intentionally remain local runtime/operator contracts.
- Update README to mention `@sys/driver-pi dsl` as the agent-facing profile/tool/extension guide.

## Non-goals

- Do not change OCR callability semantics.
- Do not add a fake or dormant `ocr_pdf` tool.
- Do not add OCR-specific prose directly to the generic prompt as the primary mechanism.
- Do not probe or install OCR dependencies from the DSL command.
- Do not fold OCR runtime usage instructions into profile-edit DSL beyond the enablement and
  restart/preflight flow.
- Do not delete runtime tool contracts just because similar guidance exists in DSL; runtime
  contracts are the live callable-tool safety surface.
- Do not duplicate Driver-Pi DSL chapter loading, rendering, or routing inside `@sys/tools`.

## Acceptance criteria

- `@sys/driver-pi dsl` renders a root Driver-Pi DSL chapter and chapter index.
- Advertised DSL commands are routed before release and cannot fall through to profile menu, Pi
  launch, or Pi passthrough args.
- `deno run -A jsr:@sys/tools pi dsl` delegates to the same Driver-Pi DSL route without duplicating
  DSL implementation in `@sys/tools`.
- `deno run -A jsr:@sys/tools pi --help` exposes or points to the Driver-Pi DSL route using wrapper
  command identity.
- `@sys/driver-pi dsl tools ocr-pdf` renders OCR enablement guidance.
- `--format skill` works for root and OCR chapter.
- Live Pi startup contains a generic instruction to consult Driver-Pi DSL for profile/tool/extension
  edits.
- Existing Driver-Pi documentation-like surfaces have been audited for DRYness against the DSL, with
  runtime contracts and concise operator help intentionally preserved where appropriate.
- A disabled OCR session remains truthful: it does not claim `ocr_pdf` is callable.
- A disabled OCR session has a principled path to offer enablement for next launch via DSL-guided
  active-profile edit.
