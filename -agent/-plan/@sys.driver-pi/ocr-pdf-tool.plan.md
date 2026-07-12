# Pi-Driver OCR PDF tool plan

- [x] 4ada488bbc5e237bfe968ee20ad6590dd4a35dca feat(driver-pi): scaffold OCR extension boundary
- [x] 092c2f64d5ddf61f6675dea1f5490c8657ac3a37 feat(driver-pi): add OCR PDF profile policy and prompt contract
- [x] caa8e0a4c87c96c3115b1de40cfe0785d9f9de26 refactor(driver-pi): split profile schema into focused modules
- [x] 3a4901971e02609bbf4889f55076de8cd5bce13b refactor(driver-pi): group profile utility modules
- [x] 5a21523c7c97cd8da6c3d815c448d22a92bf5199 feat(driver-pi): add OCR dependency resolution primitives
- [x] 87925423ece8bf89b6f03e498ab702d85890cda3 feat(driver-pi): add OCR startup preflight gates
- [x] 5dd6257400c791645d3bd0d16e5451ddaa17eea9 feat(driver-pi): add explicit Homebrew OCR install consent flow
- [x] 87925423ece8bf89b6f03e498ab702d85890cda3 test(driver-pi): cover OCR dependency preflight and setup flow
- [x] 4ffbaa76cca6df6851ff3e582e04e7f28b5676a0 feat(driver-pi): materialize OCR PDF extension and launch wiring
- [x] 092c2f64d5ddf61f6675dea1f5490c8657ac3a37 test(driver-pi): cover OCR policy guards
- [x] 4ffbaa76cca6df6851ff3e582e04e7f28b5676a0 test(driver-pi): cover OCR launch wiring
- [x] 8e6eb750bf4bbc7892a68c19d511a6f35250bff4 docs(driver-pi): document OCR PDF enablement and setup flow
- [x] af388fde877b649bcb3a2b560f23dcc4d5f08867 refactor(ocr): use bounded process capture for generated OCR commands
- [x] 92079598d20f397ebe666adf739c617ba0353677 fix(driver-pi): teach unavailable tools to consult DSL for enablement
- [x] ddc398f1f7e8ad32275d3c50ab3c8984333f0692 fix(driver-pi): make OCR enablement next steps proactive
- [x] c755ac0862b5f27ca90a8761673656589ced5fc1 fix(driver-pi): tighten OCR cover-read setup guidance
- [x] 9741e46bcc34ee5c0b6bac98bcd3086ddc01ad76 docs(driver-pi): route natural OCR requests through root DSL decision protocol
- [x] 44da2d3bc6f63fcb946021d7657513bbda2f9552 docs(driver-pi): normalize human label to Pi-Driver
- [x] a7d0846e0ec91dfae412a30c5c8de201841aa59e fix(driver-pi): keep OCR extension sandbox-closed

> Status: ready to retire. The OCR PDF implementation, docs, generated OCR `Process.capture`
> migration, Pi-Driver DSL enablement guidance, natural OCR routing, and sandbox hardening are
> committed. Future OCR policy work should start from live source plus
> `@sys/driver-pi dsl tools ocr-pdf`, not from the unsliced planning sections below.

## Current reality

- OCR policy, prompt, dependency resolution, and startup preflight gates are committed through
  `87925423ece8bf89b6f03e498ab702d85890cda3`.
- Homebrew install consent/setup is committed at
  `5dd6257400c791645d3bd0d16e5451ddaa17eea9`; it remains launcher-owned.
- `ocr_pdf` materialization and launch wiring are committed at
  `4ffbaa76cca6df6851ff3e582e04e7f28b5676a0`.
- OCR PDF enablement/setup docs are committed at
  `8e6eb750bf4bbc7892a68c19d511a6f35250bff4`.
- Upstream `@sys/process` exposes `Process.capture` as of `5c6eaa37d`.
- Generated OCR command execution has been migrated to `Process.capture` at
  `af388fde877b649bcb3a2b560f23dcc4d5f08867`.
- The default Pi-Driver prompt now teaches the unavailable-tool → future-launch enablement circuit:
  answer live callability first, proactively offer to consult Pi-Driver DSL when a requested
  wrapper-owned tool is unavailable and a matching future-launch enablement path is known, then
  consult the Pi-Driver DSL root and smallest matching chapter before giving enablement YAML or
  setup steps. The base circuit landed at `92079598d20f397ebe666adf739c617ba0353677`; the
  proactive-offer wording landed at `ddc398f1f7e8ad32275d3c50ab3c8984333f0692`; the PDF cover-read
  OCR setup path landed at `c755ac0862b5f27ca90a8761673656589ced5fc1`; natural OCR request routing
  landed at `9741e46bcc34ee5c0b6bac98bcd3086ddc01ad76`.
- Human-facing label text has been normalized to `Pi-Driver` while package, command, path, and skill
  identities remain `@sys/driver-pi`, `jsr:@sys/driver-pi`, `-config/@sys.driver-pi`, and
  `sys-driver-pi-dsl`. This landed at `44da2d3bc6f63fcb946021d7657513bbda2f9552`.
- OCR extension sandbox hardening landed at `a7d0846e0ec91dfae412a30c5c8de201841aa59e`.
- `driver-pi-dsl.plan.md` is retired. Pi-Driver DSL is the current profile/tool/extension policy
  learning surface, and OCR enablement guidance lives at
  `code/sys.driver/driver-pi/src/m.core/m.help/yaml/dsl.tools.ocr-pdf.yaml`.
- The current OCR guidance surfaces are `deno run -ER jsr:@sys/driver-pi dsl tools ocr-pdf` and the
  delegated wrapper route `deno run -A jsr:@sys/tools pi dsl tools ocr-pdf`.
- The OCR PDF DSL minimal-enablement chapter now says that an active-profile edit leaves the current
  session unchanged, requires restart/relaunch, and should present the two concrete setup paths:
  relaunch with explicit install consent via
  `deno run -A jsr:@sys/tools pi --profile <active-profile> --install-ocr-deps`, or run
  `brew install poppler tesseract` manually and relaunch the same profile.
- The PDF cover read path now has a stricter pedagogic circuit: live OCR availability first, then
  Pi-Driver DSL root → profile → OCR chapter, then a max-six-line bullet-only setup answer with no
  internal tool names beyond the minimal profile YAML.
- Startup preflight currently resolves executables, verifies Tesseract language data, and can
  install only through explicit `--install-ocr-deps` or interactive consent when
  `tools.ocr.pdf.enabled: true`.
- When OCR PDF is enabled and preflight succeeds, the launcher writes `.pi/@sys/extensions/ocr.ts`,
  passes it via `--extension`, and appends the truthful `ocr_pdf` prompt contract.
- Menu sandbox previews resolve with OCR preflight disabled, so previews remain free of OCR probes,
  OCR prompts, OCR extension materialization, and OCR install side effects.
- `README.md` and `@sys/driver-pi --help` keep operator help concise and point to the DSL instead of
  duplicating OCR policy doctrine.

## Current source anchors

- `code/sys.driver/driver-pi/src/m.core/m.extension/m.ocr/` owns OCR policy, dependency resolution,
  generated extension materialization, runtime guards, and generated command execution.
- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u/u.ocr.preflight.ts` owns launcher startup
  preflight, language-data verification, and explicit install consent.
- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u/u.resolve.run.ts` owns profile launch
  wiring: preflight → generated extension → prompt contract → `--extension` args.
- `code/sys.driver/driver-pi/src/m.core/m.help/yaml/dsl.tools.ocr-pdf.yaml` owns reusable OCR
  profile-edit pedagogy.
- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/-test/-dsl.test.ts` proves Pi-Driver DSL
  routing and OCR chapter rendering.

## Design detail: minimal OCR speech-act routing

This DSL-router refinement is not a new capability layer. It makes natural requests such as “OCR
this PDF” or “install OCR” route deterministically through the Pi-Driver DSL without expanding root
doctrine or guessing from prompt memory.

Source precedent: `@sys/cell` root DSL uses **Speech acts** plus route mappings to classify operator
intent before choosing a chapter. Pi-Driver does not need a new `Mappings` section because its root
`Decision protocol` already plays that role: root DSL selects the next chapter; profile and OCR
chapters keep the actual policy/setup doctrine.

The route space collapses to three outcomes:

- **Use OCR now on a PDF**
  - Natural forms: “OCR this PDF”, “run OCR on this PDF”, “read/extract text from this scanned PDF”,
    “read the PDF cover text with OCR”.
  - Route: answer live OCR callability first. If OCR is callable, use the live tool. If unavailable,
    read `dsl profile` and `dsl tools ocr-pdf` before setup guidance.
  - Boundary: no shell/ad hoc OCR fallback.

- **Set up, enable, configure, or diagnose OCR for a future launch**
  - Natural forms: “install OCR”, “install the OCR tool”, “set up OCR”, “make OCR work”, “enable
    OCR”, “turn OCR on”, “set OCR language”, “why can’t you OCR this?”.
  - Route: answer live OCR callability first, then read `dsl profile` and `dsl tools ocr-pdf`; setup
    affects the next launch only.
  - Boundary: root names the route only; profile owns active profile/relaunch authority, and OCR
    chapter owns exact setup commands, YAML shape, policy bounds, and no-fallback rules.

- **OCR for images or other non-PDF sources**
  - Natural forms: “OCR this image”, “read text from this image”.
  - Route: no current Pi-Driver image OCR chapter/capability; stop and ask or create a plan.
  - Boundary: do not silently route image OCR to PDF OCR guidance.

Acceptance for implementation:

- Refine root `Decision protocol`; do not add a new `Mappings` section or broad speech-act taxonomy.
- Keep OCR setup commands, YAML shape, bounds, and no-fallback rules in `dsl.tools.ocr-pdf.yaml`.
- Keep prompt wording lean: root DSL + smallest matching chapter; do not duplicate the OCR chapter’s
  bounded answer contract in the base prompt.
- Tests should assert routing invariants, root no-leak boundaries, and OCR-chapter bounded-output
  contracts, not hand/glove prose.
- Preserve current package/path/command identity while using `Pi-Driver` as the human label.

## Final validation

Final validation for the landed OCR/DSL slices ran from `code/sys.driver/driver-pi`:

- `deno fmt --check -- src/m.core/m.cli.profiles/u/u.prompt.ts src/m.core/m.cli.profiles/-test/-u.prompt.test.ts src/m.core/m.cli.profiles/-test/-dsl.test.ts src/m.core/m.help/-test/-.test.ts src/m.core/m.help/yaml/dsl.yaml src/m.core/m.help/yaml/dsl.profile.yaml src/m.core/m.help/yaml/dsl.tools.ocr-pdf.yaml src/m.core/m.help/-bundle/-bundle.json`
- `deno task test --trace-leaks ./src/m.core/m.help ./src/m.core/m.cli.profiles/-test/-dsl.test.ts ./src/m.core/m.cli.profiles/-test/-u.prompt.test.ts`
- `deno task check`

## Completed/proven setup/preflight slices

These slices are launcher-owned preflight/setup only. They do not register or materialize `ocr_pdf`.

1. `feat(driver-pi): add OCR dependency resolution primitives`
   - add deterministic executable resolution helpers for `pdfinfo`, `pdftoppm`, `tesseract`
   - prefer Homebrew-derived absolute paths, then standard Homebrew bin roots, then optional
     launcher-time `PATH` probe
   - expose structured missing-dependency results with the fixed install command
   - no install side effects

2. `feat(driver-pi): add OCR startup preflight gates`
   - run only when `tools.ocr.pdf.enabled: true`
   - verify resolved executables are absolute paths
   - probe `tesseract --list-langs` through launcher-owned `Process.invoke`/`Deno.Command` argument
     arrays
   - reject missing configured/default languages before launch
   - keep non-interactive missing-dependency behavior deterministic
   - test coverage uses fake dependency/language probes; no CI dependence on real Homebrew, Poppler,
     or Tesseract

3. `feat(driver-pi): add explicit Homebrew OCR dependency install consent`
   - add `--install-ocr-deps` profile-mode flag
   - interactive startup may offer the fixed command after explicit consent
   - interactive prompt defaults to skip, never install
   - non-interactive startup may install only when `--install-ocr-deps` is present
   - command is exactly `brew install poppler tesseract`
   - if Homebrew is missing or install fails, stop with the exact failed command/status
   - install/setup-flow coverage is in the same committed slice

## Materialization/docs slices

### `feat(driver-pi): materialize OCR PDF extension and launch wiring` — committed at `4ffbaa76cca6df6851ff3e582e04e7f28b5676a0`

- generate/register the `ocr_pdf` tool only when `tools.ocr.pdf.enabled: true` and startup preflight
  has resolved OCR substrate
- pass resolved policy and absolute executable paths into the generated extension
- append truthful `ocr_pdf` prompt/tool contract only when the tool is actually callable
- keep `ocr_pdf` lossy and bounded: page count, max chars, timeout, language allowlist/default, and
  fixed DPI
- no shell strings, no dependency install, and no ambient executable discovery inside the generated
  tool
- runtime failures should return structured, actionable OCR errors
- bounded child stdout/stderr capture was not solved inside this slice; the follow-on OCR migration
  moved generated OCR command execution to `Process.capture` at
  `af388fde877b649bcb3a2b560f23dcc4d5f08867`

### `docs(driver-pi): document OCR PDF enablement and setup flow` — committed at `8e6eb750bf4bbc7892a68c19d511a6f35250bff4`

Commit intention: make the OCR capability know-how explicit for humans and future agents without
inflating the runtime implementation commit.

Required content:

- minimal profile enablement:

  ```yaml
  tools:
    ocr:
      pdf:
        enabled: true
  ```

- defaults and policy bounds for languages, default language, DPI, max pages, max chars, and timeout
- startup preflight behavior: OCR dependencies are checked before Pi launches only when OCR PDF is
  enabled
- explicit setup paths:
  - interactive prompt with fail-safe default skip
  - `--install-ocr-deps`
  - manual command: `brew install poppler tesseract`
- after manual install, re-run the profile launch; do not describe this as restarting a running Pi
- `ocr_pdf` is lossy OCR extraction, not authoritative file reading
- `ocr_pdf` is advertised only when enabled and substrate preflight passes
- runtime OCR errors should point back to setup guidance only for substrate/start failures;
  Tesseract language-data validation is a launcher startup preflight truth, not a generated-runtime
  probe

### `test(driver-pi): cover OCR launch wiring`

- prove generated extension registration and profile launch args
- prove prompt/tool contract appears only when callable
- prove disabled OCR does not run preflight, write extension, or advertise `ocr_pdf`
- prove runtime bounds and structured error behavior without depending on real Homebrew, Poppler, or
  Tesseract in CI

## Follow-on tool note

Potential sibling tool idea: local Whisper-based audio-to-text transcription. Do not fold this into
OCR/PDF scope; treat it as a separate bounded observation tool if pursued.

Callback for a future Whisper/audio `.plan.md`:

- Keep OCR setup local for now, probably in `u.ocr.preflight.ts` plus maybe `u.ocr.setup.ts` if the
  current file earns a split.
- Do not create `@sys/driver-process/brew` or a shared Homebrew helper from OCR alone.
- After OCR lands, if Whisper/audio becomes the second Homebrew-backed tool, do a tidy-first
  refactor around the proven cleave:
  - General driver layer: Homebrew executable resolution, fixed install-command execution,
    dependency-status reporting, explicit install consent, non-interactive failure behavior,
    command-output/error formatting, and no-shell process invocation.
  - Specific tool layer: OCR/PDF or Whisper/audio formulas, executable names, policy bounds, profile
    schema, generated tool contract, docs, prompt/DSL/skill wording, and domain error semantics.
- The future shared layer should model “brew-backed dependency setup for a declared local tool,” not
  a generic process abstraction.
- A future minimal Whisper/speech-to-text tool should reuse that shared brew/dependency setup shape
  while keeping its audio/transcription policy and prompt contract local to the Whisper tool.
- Revisit the shared helper boundary only after the Whisper/audio tool proves a second real
  consumer; avoid creating a generic process abstraction from the OCR work alone.

## DMIND decision

Create `m.extension/m.ocr/` as a wrapper-owned Pi extension family. The first tool is `ocr_pdf`: a
narrow, truthful capability for OCR text extraction from readable PDF files.

Do not overload `read`. OCR is lossy extraction over an external substrate, not authoritative file
reading.

Do not make this a document intelligence layer. The primitive is a bounded observation operator:

```txt
readable PDF → OCR text response
```

S-tier v1 cuts:

- OCR only; no embedded PDF text extraction.
- Return text to the tool response; no sidecar files in v1.
- Local engine only; no cloud OCR.
- Page count, output size, command timeout, and language availability are hard bounds.
- The generated Pi tool never installs dependencies and never resolves executables from ambient
  `PATH`.
- Default profile policy stays disabled (`enabled: false`) so the live profile does not claim a
  callable `ocr_pdf` tool unless explicitly enabled and startup preflight succeeds.

## Hard invariants

- `ocr_pdf` never calls a shell.
- `ocr_pdf` never installs software.
- `ocr_pdf` calls only absolute executable paths resolved by the launcher.
- Profile policy may tune bounded OCR parameters, but may not name install packages or executable
  paths.
- Tool params may narrow the request, but may not raise policy bounds.
- Missing substrate is a setup/preflight concern first and a structured tool error second.
- Configured/default Tesseract language data is verified by startup preflight before `ocr_pdf` is
  advertised.
- The generated runtime does not re-probe Tesseract language availability.
- Protected runtime/control paths remain unavailable as user-addressable inputs.

## Baseline substrate

Supported v1 install command:

```sh
brew install poppler tesseract
```

Required executables:

- `pdfinfo` from `poppler` for page-count probing and basic PDF validation.
- `pdftoppm` from `poppler` for page rendering.
- `tesseract` for OCR.

Required launcher preflight language probe:

```sh
tesseract --list-langs
```

Startup preflight must invoke dependency and language probes through no-shell argv execution
(currently `Process.invoke`/`Deno.Command`). The generated runtime does not run
`tesseract --list-langs`; it receives the launcher-verified language policy and runs only the PDF
page-count/render/OCR commands needed for a tool call.

## Executable resolution

Launcher preflight owns dependency discovery. It resolves and injects absolute executable paths into
the generated extension policy:

```ts
export type Executables = {
  readonly pdfinfo: t.StringPath;
  readonly pdftoppm: t.StringPath;
  readonly tesseract: t.StringPath;
};
```

Resolution order should be deterministic and inspectable:

1. If Homebrew exists, use `brew --prefix poppler` and `brew --prefix tesseract` to derive expected
   `bin/` paths.
2. Check standard Homebrew locations such as `/opt/homebrew/bin` and `/usr/local/bin`.
3. Optionally check process `PATH` at launcher preflight time only, then freeze absolute paths into
   policy.
4. If an executable cannot be resolved, report the missing executable and the fixed install command.

The generated Pi extension must not call `pdfinfo`, `pdftoppm`, or `tesseract` by bare name.

## Install posture

Installation is launcher-owned setup, not a side effect of OCR execution.

Required behavior:

- when OCR is enabled and dependencies are missing, interactive startup may prompt:
  - missing executable names, e.g. `pdfinfo`, `pdftoppm`, `tesseract`
  - install command: `brew install poppler tesseract`
  - explicit consent before running install
- non-interactive startup must not prompt or hang
- non-interactive startup fails clearly unless an explicit install flag is provided
- no automatic install inside the generated Pi tool
- no profile-configurable package names
- if Homebrew is missing, report that Homebrew setup is required for v1 and stop

Explicit install flag:

```txt
--install-ocr-deps
```

This is an execution/consent flag, orthogonal to `--non-interactive`. In non-interactive mode it may
run only:

```txt
brew install poppler tesseract
```

If Homebrew or the install command fails, stop and report the exact failed command and exit status.

## Profile shape

Start small and policy-bounded:

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

Policy meanings:

- `languages`: allowed OCR language codes.
- `defaultLanguage`: language used when the tool call omits `language`.
- `dpi`: fixed render DPI for this profile; tool calls cannot override it; bounded to `72..600`.
- `maxPages`: maximum pages processed by one tool call; bounded to `1..100`.
- `maxChars`: maximum emitted OCR characters; bounded to `1..1,000,000`.
- `timeoutMs`: total command budget for one tool call; bounded to `1,000..600,000ms`.

Defaults live in driver-pi policy resolution, not in the generated tool. Default `enabled` remains
`false` until the generated extension is materialized and launch wiring can truthfully register
`ocr_pdf`.

## Public type shape

Add profile policy types under `PiCliProfiles.Tools`:

```ts
export type Tools = {
  readonly remove?: Tools.Remove;
  readonly move?: Tools.Move;
  readonly copy?: Tools.Copy;
  readonly ocr?: Tools.Ocr;
};

export namespace Tools {
  export type Ocr = {
    readonly pdf?: OcrPdf;
  };

  export type OcrPdf = {
    readonly enabled?: boolean;
    readonly languages?: readonly string[];
    readonly defaultLanguage?: string;
    readonly dpi?: number;
    readonly maxPages?: number;
    readonly maxChars?: number;
    readonly timeoutMs?: number;
  };
}
```

Add an extension namespace similar to `PiSandboxFsExtension`:

```ts
export declare namespace PiOcrExtension {
  export type Lib = {
    resolvePolicy(input: ResolvePolicyInput): Policy;
    toPromptArgs(policy: Policy): readonly string[];
    write(input: WriteInput): Promise<WriteResult>;
  };

  export type Policy = {
    readonly readRoots: readonly t.StringPath[];
    readonly protectedRoots: readonly t.StringPath[];
    readonly tempRoot: t.StringDir;
    readonly executables: Executables;
    readonly pdf: PdfPolicy;
  };

  export type PdfPolicy = {
    readonly enabled: boolean;
    readonly languages: readonly string[];
    readonly defaultLanguage: string;
    readonly dpi: number;
    readonly maxPages: number;
    readonly maxChars: number;
    readonly timeoutMs: number;
  };
}
```

## Module shape

Mirror the existing sandbox filesystem extension pattern:

```txt
m.extension/
  m.ocr/
    mod.ts
    t.ts
    common.ts
    u.policy.ts
    u.prompt.ts
    u.write.ts
    u.make.ts
    u.paths.ts
    u.deps.ts
    tmpl.ocr/
      ocr.ts
    -bundle/
      mod.ts
      -bundle.ts
      -bundle.json
    -test/
      -.test.ts
```

## Tool contract

```txt
# Runtime Tool Contract: ocr_pdf

The launcher has enabled the wrapper-owned `ocr_pdf` tool.

Available additional tool:
- ocr_pdf: Extract OCR text from a readable PDF. No shell commands.

Rules:
- Use `ocr_pdf` when a PDF cannot be read as text or contains scanned pages.
- Do not use `ocr_pdf` as a general PDF parser, summarizer, or embedded-text extractor.
- Bash is not an OCR fallback. Do not use `bash`, `pdfinfo`, `pdftoppm`, `tesseract`, shell redirection, heredocs, or ad hoc scripts for OCR.
- If OCR dependencies are missing, report the missing dependency and the launcher-provided install command.
- The PDF source must exist inside a readable sandbox root.
- The source must be a regular `.pdf` file, not a directory or symlink.
- Page range, language, DPI, timeout, and output size are bounded by active profile policy.
- OCR output may be truncated when it exceeds policy limits; report truncation explicitly.
- OCR is lossy; report uncertainty when output quality appears poor.
- The tool refuses protected control/runtime paths.
```

## Tool params

Tool params may only narrow the operation. They may not raise policy limits.

```ts
type OcrPdfParams = {
  readonly path: string;
  readonly pageStart?: number;
  readonly pageEnd?: number;
  readonly language?: string;
};
```

Do not expose `dpi`, `maxPages`, `maxChars`, `timeoutMs`, executable paths, or install behavior as
tool-call params.

## Result shape

Success details should expose bounded execution facts, not hidden mechanics:

```ts
type OcrPdfDetails = {
  readonly ok: true;
  readonly path: string;
  readonly resolved: string;
  readonly pageStart: number;
  readonly pageEnd: number;
  readonly pagesProcessed: number;
  readonly language: string;
  readonly dpi: number;
  readonly chars: number;
  readonly truncated: boolean;
  readonly cleanup?: { readonly ok: false; readonly reason: string };
};
```

Failure details should include the resolved path when available and a precise reason.

## Guard rules

Reject when:

- OCR PDF policy is disabled
- path is empty after trim
- path starts with `~`
- path contains `..`
- path contains glob-shaped characters
- source is outside read roots
- source is inside a protected root
- source does not exist
- source is not a regular file
- source is a final-path symlink
- source extension is not `.pdf`
- `pdfinfo` cannot determine a page count
- requested page range is invalid or exceeds `maxPages`
- requested language is not in the frozen allowed `languages`
- startup preflight reports configured/default language data missing from `tesseract --list-langs`
  before the generated tool is advertised
- any required executable is missing from resolved policy
- the command budget is exceeded

Truncate, rather than fail, when OCR text exceeds `maxChars`. The response details must include
`truncated: true`, emitted character count, and pages processed. Process pages sequentially and stop
once `maxChars` is reached.

## Runtime flow

1. Resolve OCR profile policy during profile run resolution.
2. If OCR is enabled, resolve dependencies and absolute executable paths.
3. If dependencies are missing, run the explicit setup flow or fail as policy requires.
4. During launcher startup preflight, probe `tesseract --list-langs` and verify the resolved
   language set.
5. Materialize generated extension under `.pi/@sys/extensions/ocr.ts` with frozen policy.
6. Append truthful prompt contract only when `ocr_pdf` is enabled.
7. Add `--extension <path>` to Pi args.
8. Generated tool validates input and runs:
   - call absolute `pdfinfo` to determine total pages
   - reject requested page range outside policy
   - create a per-call temp directory under wrapper-owned runtime temp
   - process pages sequentially with absolute `pdftoppm` and absolute `tesseract`
   - enforce the total timeout budget with abort/cancel behavior, not shell `timeout`
   - stop when `maxChars` is reached and return truncated details
   - clean the per-call temp directory in a `finally` path

Temporary rendered page artifacts should live under wrapper-owned `.pi/@sys/tmp/ocr/` or equivalent
runtime temp root. Cleanup failure should be surfaced in structured details without hiding
successful OCR output.

## Test strategy

Do not make CI depend on Homebrew, Poppler, or real Tesseract.

Use fake executable fixtures or injected command runners for deterministic tests:

- fake `pdfinfo` returns controlled page counts and malformed-PDF errors
- fake `pdftoppm` creates deterministic page image placeholders
- fake `tesseract` returns deterministic OCR text and `--list-langs` output
- fake slow commands exercise timeout behavior

A real local OCR integration test may exist as opt-in/manual, but it must not be required for normal
`deno task test`.

## Tests

Cover:

- schema accepts `tools.ocr.pdf` policy
- schema rejects unknown OCR fields
- policy defaults are stable
- policy rejects or normalizes invalid `defaultLanguage` / `languages` combinations
- policy clamps or rejects unsafe numeric bounds
- disabled OCR does not register or advertise `ocr_pdf`
- enabled OCR writes extension and appends prompt contract
- dependency probe reports missing binaries with Homebrew install command
- executable resolution freezes absolute paths into generated policy
- generated extension never invokes bare executable names
- interactive dependency setup requires explicit consent
- non-interactive missing-dependency behavior is deterministic
- non-interactive install runs only with `--install-ocr-deps`
- language probe rejects missing Tesseract language data
- guard rejects traversal, globs, protected roots, symlinks, non-PDFs, and bad page ranges
- generated tool probes `pdfinfo`, `pdftoppm`, and `tesseract`
- generated tool never uses shell command strings
- generated tool returns structured missing-dependency errors
- generated tool truncates oversized OCR output with explicit structured details
- generated tool aborts timed-out commands and reports timeout clearly
- generated tool cleans per-call temp artifacts or reports cleanup failure

## Acceptance

- Pi can OCR a readable scanned PDF without bash fallback.
- Missing substrate has a clear Homebrew install path.
- Interactive install requires explicit consent.
- Non-interactive runs never hang for install prompts.
- Non-interactive install is possible only through explicit `--install-ocr-deps` consent.
- The generated extension calls absolute executable paths only.
- Installed OCR language data is verified before use.
- Page count, timeout, and output size are bounded before large work escapes control.
- `ocr_pdf` remains narrow, lossy, bounded, and truthfully advertised.

## Non-goals

- no generic document parser
- no embedded PDF text extraction
- no cloud OCR
- no summarization
- no markdown conversion in v1
- no sidecar output files in v1
- no user-supplied executable paths
- no automatic profile-configurable package installation
- no shell fallback
- no silent dependency installation from inside the generated tool
