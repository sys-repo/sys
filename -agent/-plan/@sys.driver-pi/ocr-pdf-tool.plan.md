# Driver-pi OCR PDF tool plan

- [x] feat(driver-pi): scaffold OCR extension boundary — `4ada488bbc5e237bfe968ee20ad6590dd4a35dca`
- [x] feat(driver-pi): add OCR PDF profile policy and prompt contract — `092c2f64d5ddf61f6675dea1f5490c8657ac3a37`
- [x] refactor(driver-pi): split profile schema into focused modules — `caa8e0a4c87c96c3115b1de40cfe0785d9f9de26`
- [x] refactor(driver-pi): group profile utility modules — `3a4901971e02609bbf4889f55076de8cd5bce13b`
- [x] feat(driver-pi): add OCR dependency resolution primitives — `5a21523c7c97cd8da6c3d815c448d22a92bf5199`
- [x] feat(driver-pi): add OCR startup preflight gates — `87925423ece8bf89b6f03e498ab702d85890cda3`
- [x] feat(driver-pi): add explicit Homebrew OCR install consent flow _(working tree)_
- [x] test(driver-pi): cover OCR dependency preflight and setup flow _(preflight gate tests landed in `87925423ece8bf89b6f03e498ab702d85890cda3`; install/setup-flow tests in working tree)_
- [ ] feat(driver-pi): materialize OCR PDF extension and launch wiring
- [x] test(driver-pi): cover OCR policy guards — covered by `092c2f64d5ddf61f6675dea1f5490c8657ac3a37`
- [ ] test(driver-pi): cover OCR launch wiring

## Current reality

- OCR policy, prompt, dependency resolution, and startup preflight gates are committed through `87925423ece8bf89b6f03e498ab702d85890cda3`.
- `ocr_pdf` is still not materialized, registered, passed via `--extension`, or truthfully available as a callable Pi tool.
- Homebrew install consent/setup is implemented in the working tree and remains launcher-owned.
- Startup preflight currently resolves executables, verifies Tesseract language data, and can install only through explicit `--install-ocr-deps` or interactive consent when `tools.ocr.pdf.enabled: true`.
- Menu sandbox previews resolve with OCR preflight disabled, so previews remain free of OCR probes, OCR prompts, and OCR install side effects.

## Current validation

- `deno fmt --check src/m.core/m.cli.profiles/u/u.ocr.preflight.ts src/m.core/m.cli.profiles/-test/-u.ocr.preflight.test.ts src/m.core/m.cli.profiles/u/u.resolve.run.ts src/m.core/m.cli.profiles/u/u.args.ts src/m.core/m.cli.profiles/u/u.fmt.help.ts src/m.core/m.cli.profiles/m.main.ts src/m.core/m.cli.profiles/u/u.menu.ts src/m.core/m.cli.profiles/u/u.startup.ts src/m.core/m.cli.profiles/t.ts src/m.core/m.cli.profiles/-test/-u.args.test.ts src/m.core/m.cli.profiles/-test/-m.main.help.test.ts src/m.core/m.cli.profiles/-test/-m.run.test.ts src/m.core/m.cli.profiles/-test/-u.menu.test.ts src/m.core/m.extension/m.ocr/t.ts src/m.core/m.extension/m.ocr/u.deps.ts`
- `deno task test --trace-leaks ./src/m.core/m.cli.profiles`
- `deno task check`

## Next commit split: OCR dependency preflight and setup

Do this as launcher-owned preflight/setup only. Do not register or materialize `ocr_pdf` in this sequence.

1. `feat(driver-pi): add OCR dependency resolution primitives`
   - add deterministic executable resolution helpers for `pdfinfo`, `pdftoppm`, `tesseract`
   - prefer Homebrew-derived absolute paths, then standard Homebrew bin roots, then optional launcher-time `PATH` probe
   - expose structured missing-dependency results with the fixed install command
   - no install side effects

2. `feat(driver-pi): add OCR startup preflight gates`
   - run only when `tools.ocr.pdf.enabled: true`
   - verify resolved executables are absolute paths
   - probe `tesseract --list-langs` through launcher-owned `Process.invoke`/`Deno.Command` argument arrays
   - reject missing configured/default languages before launch
   - keep non-interactive missing-dependency behavior deterministic

3. `feat(driver-pi): add explicit Homebrew OCR install consent flow`
   - add `--install-ocr-deps` profile-mode flag
   - interactive startup may offer the fixed command after explicit consent
   - non-interactive startup may install only when `--install-ocr-deps` is present
   - command is exactly `brew install poppler tesseract`
   - if Homebrew is missing or install fails, stop with the exact failed command/status

4. `test(driver-pi): cover OCR dependency preflight and setup flow`
   - fake dependency probes; no CI dependence on real Homebrew, Poppler, or Tesseract
   - cover missing executables, missing language data, non-interactive behavior, install consent, and failed install status

## Follow-on tool note

Potential sibling tool idea: local Whisper-based audio-to-text transcription.
Do not fold this into OCR/PDF scope; treat it as a separate bounded observation tool if pursued.

If both OCR and Whisper need Homebrew-backed dependency discovery/install consent, evaluate spinning out a narrow shared Homebrew/process helper, possibly under `@sys/driver-process/<homebrew|brew>` or similar. Do this only after the second consumer proves the boundary; avoid creating a generic process abstraction from the OCR work alone.

## DMIND decision

Create `m.extension/m.ocr/` as a wrapper-owned Pi extension family. The first tool is `ocr_pdf`: a narrow, truthful capability for OCR text extraction from readable PDF files.

Do not overload `read`. OCR is lossy extraction over an external substrate, not authoritative file reading.

Do not make this a document intelligence layer. The primitive is a bounded observation operator:

```txt
readable PDF → OCR text response
```

S-tier v1 cuts:

- OCR only; no embedded PDF text extraction.
- Return text to the tool response; no sidecar files in v1.
- Local engine only; no cloud OCR.
- Page count, output size, command timeout, and language availability are hard bounds.
- The generated Pi tool never installs dependencies and never resolves executables from ambient `PATH`.
- Until extension materialization lands, default profile policy stays disabled (`enabled: false`) so the live profile does not claim a callable `ocr_pdf` tool.

## Hard invariants

- `ocr_pdf` never calls a shell.
- `ocr_pdf` never installs software.
- `ocr_pdf` calls only absolute executable paths resolved by the launcher.
- Profile policy may tune bounded OCR parameters, but may not name install packages or executable paths.
- Tool params may narrow the request, but may not raise policy bounds.
- Missing substrate is a setup/preflight concern first and a structured tool error second.
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

Required language probe:

```sh
tesseract --list-langs
```

The implementation must invoke these through `Deno.Command` argument arrays, never shell strings.

## Executable resolution

Launcher preflight owns dependency discovery. It resolves and injects absolute executable paths into the generated extension policy:

```ts
export type Executables = {
  readonly pdfinfo: t.StringPath;
  readonly pdftoppm: t.StringPath;
  readonly tesseract: t.StringPath;
};
```

Resolution order should be deterministic and inspectable:

1. If Homebrew exists, use `brew --prefix poppler` and `brew --prefix tesseract` to derive expected `bin/` paths.
2. Check standard Homebrew locations such as `/opt/homebrew/bin` and `/usr/local/bin`.
3. Optionally check process `PATH` at launcher preflight time only, then freeze absolute paths into policy.
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

This is an execution/consent flag, orthogonal to `--non-interactive`. In non-interactive mode it may run only:

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

Defaults live in driver-pi policy resolution, not in the generated tool. Default `enabled` remains `false` until the generated extension is materialized and launch wiring can truthfully register `ocr_pdf`.

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

Do not expose `dpi`, `maxPages`, `maxChars`, `timeoutMs`, executable paths, or install behavior as tool-call params.

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
- requested language is not in `languages`
- requested or default language is not reported by `tesseract --list-langs`
- any required executable is missing from resolved policy
- the command budget is exceeded

Truncate, rather than fail, when OCR text exceeds `maxChars`. The response details must include `truncated: true`, emitted character count, and pages processed. Process pages sequentially and stop once `maxChars` is reached.

## Runtime flow

1. Resolve OCR profile policy during profile run resolution.
2. If OCR is enabled, resolve dependencies and absolute executable paths.
3. If dependencies are missing, run the explicit setup flow or fail as policy requires.
4. Probe `tesseract --list-langs` and verify the resolved language set.
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

Temporary rendered page artifacts should live under wrapper-owned `.pi/@sys/tmp/ocr/` or equivalent runtime temp root. Cleanup failure should be surfaced in structured details without hiding successful OCR output.

## Test strategy

Do not make CI depend on Homebrew, Poppler, or real Tesseract.

Use fake executable fixtures or injected command runners for deterministic tests:

- fake `pdfinfo` returns controlled page counts and malformed-PDF errors
- fake `pdftoppm` creates deterministic page image placeholders
- fake `tesseract` returns deterministic OCR text and `--list-langs` output
- fake slow commands exercise timeout behavior

A real local OCR integration test may exist as opt-in/manual, but it must not be required for normal `deno task test`.

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
