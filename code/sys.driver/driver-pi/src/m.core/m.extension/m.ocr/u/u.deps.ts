import { Arr, Fs, Is, Path, type t } from '../common.ts';

const InstallCommandText = 'brew install poppler tesseract' as const;
const InstallCommand = {
  cmd: 'brew',
  args: ['install', 'poppler', 'tesseract'],
  text: InstallCommandText,
} as const satisfies t.PiOcrExtension.Install.Command;

const DependencyNames = ['pdfinfo', 'pdftoppm', 'tesseract'] as const;
const StandardHomebrewBinDirs = [
  '/opt/homebrew/bin' as t.StringDir,
  '/usr/local/bin' as t.StringDir,
  '/home/linuxbrew/.linuxbrew/bin' as t.StringDir,
] as const;
const StandardBrewPaths = StandardHomebrewBinDirs.map((dir) =>
  Fs.join(dir, 'brew') as t.StringPath
);

/** Resolve local optical character recognition (OCR) executable dependencies. */
export async function dependencies(
  input: t.PiOcrExtension.Resolve.Dependencies.Input,
): Promise<t.PiOcrExtension.Resolve.Dependencies.Output> {
  const resolved = await candidatePaths(input);
  const found = await findExecutables({ candidates: resolved.candidates, exists: input.exists });
  const missing = DependencyNames.filter((name) => found[name] === undefined);

  if (missing.length === 0) {
    return {
      ok: true,
      executables: found as t.PiOcrExtension.Dependency.Executables,
      installCommand: InstallCommand,
    };
  }

  return {
    ok: false,
    missing,
    found,
    installCommand: InstallCommand,
    ...(resolved.homebrew ? { homebrew: resolved.homebrew } : {}),
    message: formatMissing(missing),
  };
}

/** Fixed launcher-owned install command for v1 OCR dependencies. */
export function installCommand(): t.PiOcrExtension.Install.Command {
  return InstallCommand;
}

/**
 * Helpers:
 */
type CandidateInput = t.PiOcrExtension.Resolve.Dependencies.Input;

type FindInput = {
  readonly candidates: Record<t.PiOcrExtension.Dependency.Name, readonly t.StringPath[]>;
  readonly exists: t.PiOcrExtension.Dependency.Exists;
};

async function candidatePaths(input: CandidateInput) {
  const paths = emptyCandidates();
  const brew = input.command ? await resolveBrewPath(input) : undefined;
  if (input.command && brew) {
    await addHomebrewPrefixCandidates(paths, {
      brew,
      command: input.command,
    });
  }

  for (const dir of input.standardBinDirs ?? StandardHomebrewBinDirs) {
    addBinDirCandidates(paths, dir);
  }

  if (input.envPath) {
    for (const dir of pathDirs(input.envPath)) addBinDirCandidates(paths, dir);
  }

  return { candidates: dedupeCandidates(paths), ...(brew ? { homebrew: brew } : {}) };
}

function emptyCandidates() {
  return {
    pdfinfo: [] as t.StringPath[],
    pdftoppm: [] as t.StringPath[],
    tesseract: [] as t.StringPath[],
  };
}

async function resolveBrewPath(input: CandidateInput) {
  const candidates = [
    ...(input.brewPath ? [input.brewPath] : []),
    ...StandardBrewPaths,
    ...pathDirs(input.envPath).map((dir) => Fs.join(dir, 'brew') as t.StringPath),
  ];

  for (const path of Arr.uniq(candidates)) {
    if (!isAbsolutePath(path)) continue;
    if (await input.exists(path)) return path;
  }

  return undefined;
}

async function addHomebrewPrefixCandidates(
  paths: ReturnType<typeof emptyCandidates>,
  input: { readonly brew: t.StringPath; readonly command: t.PiOcrExtension.Command.Runner },
) {
  const poppler = await brewPrefix(input.command, input.brew, 'poppler');
  if (poppler) {
    paths.pdfinfo.push(Fs.join(poppler, 'bin', 'pdfinfo') as t.StringPath);
    paths.pdftoppm.push(Fs.join(poppler, 'bin', 'pdftoppm') as t.StringPath);
  }

  const tesseract = await brewPrefix(input.command, input.brew, 'tesseract');
  if (tesseract) paths.tesseract.push(Fs.join(tesseract, 'bin', 'tesseract') as t.StringPath);
}

async function brewPrefix(
  command: t.PiOcrExtension.Command.Runner,
  brew: t.StringPath,
  formula: 'poppler' | 'tesseract',
) {
  const res = await command({ cmd: brew, args: ['--prefix', formula] });
  if (res.code !== 0) return undefined;
  const prefix = res.stdout.trim();
  if (!isAbsolutePath(prefix)) return undefined;
  return prefix as t.StringDir;
}

function addBinDirCandidates(paths: ReturnType<typeof emptyCandidates>, dir: string) {
  if (!isAbsolutePath(dir)) return;
  paths.pdfinfo.push(Fs.join(dir, 'pdfinfo') as t.StringPath);
  paths.pdftoppm.push(Fs.join(dir, 'pdftoppm') as t.StringPath);
  paths.tesseract.push(Fs.join(dir, 'tesseract') as t.StringPath);
}

function dedupeCandidates(paths: ReturnType<typeof emptyCandidates>) {
  return {
    pdfinfo: Arr.uniq(paths.pdfinfo),
    pdftoppm: Arr.uniq(paths.pdftoppm),
    tesseract: Arr.uniq(paths.tesseract),
  };
}

async function findExecutables(
  input: FindInput,
): Promise<Partial<t.PiOcrExtension.Dependency.Executables>> {
  const found: {
    pdfinfo?: t.StringPath;
    pdftoppm?: t.StringPath;
    tesseract?: t.StringPath;
  } = {};

  for (const name of DependencyNames) {
    const path = await firstExisting(input.candidates[name], input.exists);
    if (path) found[name] = path;
  }

  return found;
}

async function firstExisting(
  candidates: readonly t.StringPath[],
  exists: t.PiOcrExtension.Dependency.Exists,
) {
  for (const path of candidates) {
    if (!isAbsolutePath(path)) continue;
    if (await exists(path)) return path;
  }
  return undefined;
}

function pathDirs(pathText?: string) {
  if (!Is.string(pathText) || pathText.trim() === '') return [];
  return pathText.split(':').map((part) => part.trim()).filter((part) => isAbsolutePath(part));
}

function isAbsolutePath(path: unknown): path is t.StringPath {
  return Is.string(path) && Path.Is.absolute(path);
}

function formatMissing(missing: readonly t.PiOcrExtension.Dependency.Name[]) {
  const names = missing.join(', ');
  return `Missing OCR dependencies: ${names}. Install with: ${InstallCommandText}`;
}
