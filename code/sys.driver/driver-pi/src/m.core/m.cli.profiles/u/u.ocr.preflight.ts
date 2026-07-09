import { Arr, c, Cli, Err, Fs, Is, Path, Str, type t } from '../common.ts';
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
  /** Explicit setup/consent policy for missing OCR dependencies. */
  readonly setup?: OcrStartupSetup;
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

/** Explicit setup/consent policy for missing OCR dependencies. */
export type OcrStartupSetup = {
  /** Explicit consent to run the fixed Homebrew OCR dependency install command. */
  readonly installDeps?: boolean;
  /** Whether startup may ask for interactive install consent. */
  readonly interactive?: boolean;
  /** Test seam for interactive install consent. */
  readonly prompt?: OcrInstallPrompt;
  /** Test seam for running the fixed Homebrew install command. */
  readonly install?: OcrInstallRunner;
};

export type OcrInstallPromptInput = {
  readonly missing: readonly t.PiOcrExtension.Dependency.Name[];
  readonly installCommand: t.PiOcrExtension.Install.Command;
};

export type OcrInstallPrompt = (input: OcrInstallPromptInput) => Promise<'install' | 'skip'>;

export type OcrInstallInput = {
  readonly cmd: t.StringPath;
  readonly args: t.PiOcrExtension.Install.Command['args'];
  readonly text: t.PiOcrExtension.Install.Command['text'];
  readonly env?: Record<string, string>;
};

export type OcrInstallRunner = (input: OcrInstallInput) => Promise<t.PiOcrExtension.Command.Output>;

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
  let dependencies = await resolveDependencies(input, env, dependencyCommand);

  if (!dependencies.ok) {
    dependencies = await installMissingDependencies({
      input,
      env,
      dependencies,
      dependencyCommand,
    });
  }

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
async function resolveDependencies(
  input: OcrStartupPreflightInput,
  env: Record<string, string>,
  command: t.PiOcrExtension.Command.Runner,
) {
  return await Ocr.Resolve.dependencies({
    brewPath: input.brewPath,
    envPath: resolveEnvPath(input, env),
    standardBinDirs: input.standardBinDirs,
    exists: input.exists ?? Fs.exists,
    command,
  });
}

async function installMissingDependencies(input: {
  readonly input: OcrStartupPreflightInput;
  readonly env: Record<string, string>;
  readonly dependencies: t.PiOcrExtension.Resolve.Dependencies.Missing;
  readonly dependencyCommand: t.PiOcrExtension.Command.Runner;
}): Promise<t.PiOcrExtension.Resolve.Dependencies.Output> {
  const { dependencies, env } = input;
  const setup = input.input.setup ?? {};
  const action = await resolveInstallAction(dependencies, setup);
  if (action === 'skip') return dependencies;
  if (action === 'declined') {
    throw new Error(
      `OCR startup preflight failed: OCR dependency install declined. ${dependencies.message}`,
    );
  }

  await runInstall({ env, dependencies, install: setup.install });
  const resolved = await resolveDependencies(input.input, env, input.dependencyCommand);
  if (!resolved.ok) {
    throw new Error(`OCR startup preflight failed after install: ${resolved.message}`);
  }
  return resolved;
}

async function resolveInstallAction(
  dependencies: t.PiOcrExtension.Resolve.Dependencies.Missing,
  setup: OcrStartupSetup,
) {
  if (setup.installDeps === true) return 'install' as const;
  if (setup.interactive !== true) return 'skip' as const;
  const prompt = setup.prompt ?? promptInstall;
  const picked = await prompt({
    missing: dependencies.missing,
    installCommand: dependencies.installCommand,
  });
  return picked === 'install' ? 'install' as const : 'declined' as const;
}

async function promptInstall(input: OcrInstallPromptInput): Promise<'install' | 'skip'> {
  console.info(formatInstallPrompt(input));
  const picked = await Cli.Input.Select.prompt<'install' | 'skip'>({
    message: 'OCR dependencies',
    options: [
      { name: 'skip', value: 'skip' },
      { name: c.cyan('install'), value: 'install' },
    ],
    default: 'skip',
    hideDefault: true,
  });
  if (picked === 'install' || picked === 'skip') return picked;
  throw new Error(`Unexpected OCR dependency setup action: ${picked}`);
}

function formatInstallPrompt(input: OcrInstallPromptInput) {
  return Str.dedent(`
    Missing OCR dependencies: ${input.missing.join(', ')}
    Install command: ${input.installCommand.text}
  `).trim();
}

async function runInstall(input: {
  readonly env: Record<string, string>;
  readonly dependencies: t.PiOcrExtension.Resolve.Dependencies.Missing;
  readonly install?: OcrInstallRunner;
}) {
  const command = Ocr.installCommand();
  const brew = input.dependencies.homebrew;
  if (!brew) {
    throw new Error(
      `OCR startup preflight failed: Homebrew is required for OCR dependency install. Command: ${command.text}.`,
    );
  }

  const install = input.install ?? runInstallCommand;
  let output: t.PiOcrExtension.Command.Output;
  try {
    output = await install({ ...command, cmd: brew, env: input.env });
  } catch (error) {
    throw new Error(
      `OCR startup preflight failed: OCR dependency install command could not start. Command: ${command.text}. ${
        Err.summary(error)
      }`,
    );
  }

  if (output.code === 0) return;
  const stderr = output.stderr.trim();
  const details = stderr ? ` Stderr: ${stderr}` : '';
  throw new Error(
    `OCR startup preflight failed: OCR dependency install command failed. Command: ${command.text}. Exit code: ${output.code}.${details}`,
  );
}

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

async function runInstallCommand(input: OcrInstallInput) {
  const output = await Process.invoke({
    cmd: input.cmd,
    args: [...input.args],
    env: input.env,
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
