import { Arr, Fs, Is, Path, type t } from '../common.ts';
import { Process } from '../../m.cli/common.ts';
import { Ocr } from '../../m.extension/m.ocr/mod.ts';

/** Launcher-owned startup preflight for enabled PDF optical character recognition (OCR). */
export type OcrStartupPreflightInput = {
  /** Profile-authored PDF OCR policy. Disabled or omitted policy does not run probes. */
  readonly pdf?: t.PiCliProfiles.Tools.OcrPdf;
  /** Environment used by launcher-owned OCR probes. */
  readonly env?: Record<string, string>;
  /** Optional explicit absolute Homebrew executable path. */
  readonly brewPath?: t.StringPath;
  /** Optional PATH text to probe instead of `env.PATH` or launcher `PATH`. */
  readonly envPath?: string;
  /** Optional direct executable bin dirs. Defaults to standard Homebrew bin roots. */
  readonly standardBinDirs?: readonly t.StringDir[];
  /** Test seam for executable existence checks. */
  readonly exists?: t.PiOcrExtension.Dependency.Exists;
  /** Test seam for Homebrew `brew --prefix` probes. */
  readonly command?: t.PiOcrExtension.Command.Runner;
  /** Test seam for `tesseract --list-langs`. */
  readonly languageProbe?: OcrLanguageProbe;
};

/** Startup preflight result for enabled or disabled PDF OCR policy. */
export type OcrStartupPreflightResult =
  | { readonly enabled: false }
  | {
    readonly enabled: true;
    readonly policy: t.PiOcrExtension.Policy.Resolved;
    readonly executables: t.PiOcrExtension.Dependency.Executables;
    readonly languages: readonly string[];
    readonly installCommand: t.PiOcrExtension.Install.Command;
  };

type OcrLanguageProbeInput = t.PiOcrExtension.Command.Input & {
  readonly env?: Record<string, string>;
};

type OcrLanguageProbe = (
  input: OcrLanguageProbeInput,
) => Promise<t.PiOcrExtension.Command.Output>;

/** Run OCR startup preflight gates before launching Pi. */
export async function preflightOcrStartup(
  input: OcrStartupPreflightInput,
): Promise<OcrStartupPreflightResult> {
  if (input.pdf?.enabled !== true) return { enabled: false };

  const env = input.env ?? {};
  const policy = Ocr.Resolve.policy({ pdf: input.pdf });
  const dependencyCommand = input.command ?? ((commandInput) => {
    return runProcessCommand({ ...commandInput, env });
  });
  const dependencies = await Ocr.Resolve.dependencies({
    brewPath: input.brewPath,
    envPath: resolveEnvPath(input, env),
    standardBinDirs: input.standardBinDirs,
    exists: input.exists ?? Fs.exists,
    command: dependencyCommand,
  });

  if (!dependencies.ok) {
    throw new Error(`OCR startup preflight failed: ${dependencies.message}`);
  }

  assertAbsoluteExecutables(dependencies.executables);

  const languageProbe = input.languageProbe ?? runProcessCommand;
  const languageOutput = await languageProbe({
    cmd: dependencies.executables.tesseract,
    args: ['--list-langs'],
    env,
  });
  assertLanguageProbeOk(dependencies.executables.tesseract, languageOutput);

  const languages = parseTesseractLanguages(languageOutput.stdout);
  assertInstalledLanguages(policy.pdf, languages);

  return {
    enabled: true,
    policy,
    executables: dependencies.executables,
    languages,
    installCommand: dependencies.installCommand,
  };
}

/**
 * Helpers:
 */
async function runProcessCommand(
  input: OcrLanguageProbeInput,
): Promise<t.PiOcrExtension.Command.Output> {
  const output = await Process.invoke({
    cmd: input.cmd,
    args: [...input.args],
    env: input.env,
    silent: true,
  });
  return {
    code: output.code,
    stdout: output.text.stdout,
    stderr: output.text.stderr,
  };
}

function resolveEnvPath(input: OcrStartupPreflightInput, env: Record<string, string>) {
  return input.envPath ?? env.PATH ?? Deno.env.get('PATH');
}

function assertAbsoluteExecutables(input: t.PiOcrExtension.Dependency.Executables) {
  const executables = [
    ['pdfinfo', input.pdfinfo],
    ['pdftoppm', input.pdftoppm],
    ['tesseract', input.tesseract],
  ] as const;

  for (const [name, path] of executables) {
    if (isAbsolutePath(path)) continue;
    throw new Error(
      `OCR startup preflight failed: resolved executable path must be absolute: ${name}=${path}`,
    );
  }
}

function assertLanguageProbeOk(
  tesseract: t.StringPath,
  output: t.PiOcrExtension.Command.Output,
) {
  if (output.code === 0) return;
  const stderr = output.stderr.trim();
  const details = stderr ? ` Stderr: ${stderr}` : '';
  throw new Error(
    `OCR startup preflight failed: tesseract language probe failed. Command: ${tesseract} --list-langs. Exit code: ${output.code}.${details}`,
  );
}

function parseTesseractLanguages(stdout: string) {
  const languages = Arr.uniq(
    stdout.split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => isLanguageLine(line)),
  );
  if (languages.length > 0) return languages;
  throw new Error('OCR startup preflight failed: tesseract --list-langs returned no languages.');
}

function isLanguageLine(line: string) {
  if (line.length === 0) return false;
  if (line.startsWith('List of available languages')) return false;
  return true;
}

function assertInstalledLanguages(
  policy: t.PiOcrExtension.Policy.Pdf,
  languages: readonly string[],
) {
  const missing = Arr.uniq([policy.defaultLanguage, ...policy.languages].filter((language) => {
    return !languages.includes(language);
  }));
  if (missing.length === 0) return;

  throw new Error(
    `OCR startup preflight failed: missing Tesseract language data: ${
      missing.join(', ')
    }. Required by tools.ocr.pdf.languages/defaultLanguage. Available languages: ${
      formatLanguages(languages)
    }. Install the language data or adjust the profile.`,
  );
}

function formatLanguages(languages: readonly string[]) {
  return languages.length === 0 ? 'none' : languages.join(', ');
}

function isAbsolutePath(path: unknown): path is t.StringPath {
  return Is.string(path) && Path.Is.absolute(path);
}
