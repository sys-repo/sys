import { Err, Fs, Is, Path, Str, type t } from './common.ts';
import {
  resolveWorkspaceMembers,
  type WorkspaceMember,
  type WorkspaceMembers,
} from '../u.workspace.members.ts';
import { classifyPath } from './u.classify.ts';

const compare = Str.Compare.codeUnit();
const SCOPE = /^@[a-z0-9][a-z0-9-]*$/;
const PACKAGE_NAME = /^@[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/;

type NormalizedGlobArgs = {
  readonly cwd: t.StringDir;
  readonly source: t.WorkspaceInfo.NormalizedSource;
  readonly totals: {
    readonly lines: boolean;
  };
};

type SelectedPackage = {
  readonly identity: t.WorkspaceInfo.PackageIdentity;
  readonly root: t.StringDir;
};

type PackageSourceFile = {
  readonly package: t.WorkspaceInfo.PackageIdentity;
  readonly path: t.StringPath;
};

type LineStats = {
  readonly total: number;
  readonly source: number;
  readonly unitTests: number;
  readonly uiSpecTests: number;
};

type FileLineStats = {
  readonly kind: t.WorkspaceInfo.LineKind;
  readonly lines: number;
};

/** Compute source statistics in raw-glob or package-scoped mode. */
export async function stats(
  args: t.WorkspaceInfo.StatsArgs,
): Promise<t.WorkspaceInfo.StatsResult> {
  if (isGlobArgs(args)) return await globStats(args);
  return await packageStats(args);
}

/** Validate package-relative patterns and root exclusions beneath one package. */
export function rootPackagePatterns(
  root: t.StringDir,
  source: t.WorkspaceInfo.Source,
): t.WorkspaceInfo.NormalizedSource {
  root = Fs.resolve(root) as t.StringDir;
  const include = [...source.include];
  const exclude = [...(source.exclude ?? [])];
  validatePackageSource({ include, exclude });

  const rootedExclude = exclude.map((pattern) => {
    const rooted = Fs.resolve(root, pattern);
    if (!Path.Is.within(root, rooted)) {
      throw Err.std(`Package source exclusion could not be rooted beneath package: ${pattern}`);
    }
    return rooted;
  });

  return { include, exclude: rootedExclude };
}

async function globStats(args: t.WorkspaceInfo.GlobArgs): Promise<t.WorkspaceInfo.GlobResult> {
  const input = normalizeGlobArgs(args);
  const paths = await collectGlobSourcePaths(input.cwd, input.source);
  const lineStats = input.totals.lines ? await countGlobLineStats(paths) : undefined;

  return {
    kind: 'glob',
    ...statsBase(input.source, paths.length, lineStats),
  };
}

async function packageStats(
  args: t.WorkspaceInfo.PackageArgs,
): Promise<t.WorkspaceInfo.PackageResult> {
  const cwd = args.cwd ?? Deno.cwd();
  const source = normalizeSource(args.source);
  if (!isPackageScope(args.packages.scope)) {
    throw Err.std(`Package scope is invalid: ${args.packages.scope}`);
  }
  validatePackageSource(source);

  const manifestPath = await resolvePackageWorkspaceManifest(cwd, args.packages.workspace);
  const workspace = await resolveWorkspaceMembers(manifestPath);
  const packages = await selectPackages(workspace, args.packages.scope);
  const paths = await collectPackageSourcePaths(packages, source);
  const lineStats = args.totals?.lines === true ? await countPackageLineStats(paths) : undefined;

  return {
    kind: 'package',
    selection: {
      workspace: args.packages.workspace,
      scope: args.packages.scope,
    },
    packages: packages.map((item) => item.identity),
    ...statsBase(source, paths.length, lineStats),
  };
}

function isGlobArgs(
  args: t.WorkspaceInfo.StatsArgs,
): args is t.WorkspaceInfo.GlobArgs {
  return args.source.kind === 'glob';
}

function normalizeGlobArgs(args: t.WorkspaceInfo.GlobArgs): NormalizedGlobArgs {
  return {
    cwd: args.cwd ?? Deno.cwd(),
    source: normalizeSource(args.source),
    totals: {
      lines: args.totals?.lines === true,
    },
  };
}

function normalizeSource(source: t.WorkspaceInfo.Source): t.WorkspaceInfo.NormalizedSource {
  return {
    include: [...source.include],
    exclude: [...(source.exclude ?? [])],
  };
}

async function resolvePackageWorkspaceManifest(
  cwd: t.StringDir,
  workspace: t.StringPath,
): Promise<t.StringPath> {
  const declaredCwd = Fs.resolve(cwd) as t.StringDir;
  if (isPortableAbsolute(workspace)) {
    throw Err.std(`Package workspace manifest path must be relative: ${workspace}`);
  }

  const manifestPath = Fs.resolve(declaredCwd, workspace);
  if (!Path.Is.within(declaredCwd, manifestPath)) {
    throw Err.std(`Package workspace manifest path escapes cwd: ${workspace}`);
  }

  const canonicalCwd = await canonicalDirectory(declaredCwd, 'package statistics cwd');
  let canonicalManifest: t.StringPath;
  try {
    canonicalManifest = await Fs.realPath(manifestPath);
  } catch (cause) {
    throw Err.std(`Package workspace manifest could not be resolved: ${manifestPath}`, { cause });
  }
  if (!Path.Is.within(canonicalCwd, canonicalManifest)) {
    throw Err.std(`Package workspace manifest path escapes cwd through symlink: ${workspace}`);
  }

  return manifestPath;
}

async function canonicalDirectory(path: t.StringPath, label: string): Promise<t.StringDir> {
  let canonical: t.StringPath;
  try {
    canonical = await Fs.realPath(path);
  } catch (cause) {
    throw Err.std(`Could not resolve ${label}: ${path}`, { cause });
  }

  let info: Deno.FileInfo | undefined;
  try {
    info = await Fs.stat(canonical);
  } catch (cause) {
    throw Err.std(`Could not inspect ${label}: ${path}`, { cause });
  }
  if (!info?.isDirectory) throw Err.std(`${label} is not a directory: ${path}`);
  return canonical as t.StringDir;
}

async function selectPackages(
  workspace: WorkspaceMembers,
  scope: string,
): Promise<SelectedPackage[]> {
  if (!isPackageScope(scope)) throw Err.std(`Package scope is invalid: ${scope}`);

  const selected: SelectedPackage[] = [];
  const names = new Set<string>();
  const roots = new Set<t.StringDir>();
  const declaredRoot = Path.dirname(workspace.manifestPath) as t.StringDir;

  for (const member of workspace.members) {
    const name = member.manifest.name;
    if (!Is.str(name) || !name.startsWith(`${scope}/`)) continue;
    if (!isScopedPackageName(name)) {
      throw Err.std(`Selected package name is invalid: ${name} (${member.manifestPath})`);
    }

    await assertPackageRootIsNotSymlink(declaredRoot, workspace.root, member);
    if (roots.has(member.root)) {
      throw Err.std(`Duplicate selected package root: ${member.root} (${member.path})`);
    }
    if (names.has(name)) throw Err.std(`Duplicate selected package name: ${name}`);

    roots.add(member.root);
    names.add(name);
    selected.push({
      identity: {
        name: name as t.StringPkgName,
        path: member.path as t.StringDir,
      },
      root: member.root,
    });
  }

  if (selected.length === 0) throw Err.std(`No workspace packages match scope: ${scope}`);
  assertPackageRootsDoNotNest(selected);
  return selected.sort((a, b) => compare(a.identity.name, b.identity.name));
}

async function assertPackageRootIsNotSymlink(
  declaredRoot: t.StringDir,
  canonicalRoot: t.StringDir,
  member: WorkspaceMember,
): Promise<void> {
  const path = Fs.resolve(declaredRoot, member.path);
  let info: Deno.FileInfo | undefined;
  try {
    info = await Fs.lstat(path);
  } catch (cause) {
    throw Err.std(`Could not inspect selected package root: ${member.path} (${path})`, { cause });
  }
  if (!info) throw Err.std(`Selected package root does not exist: ${member.path} (${path})`);
  const rootedPath = Fs.resolve(canonicalRoot, member.path);
  if (info.isSymlink || rootedPath !== member.root) {
    throw Err.std(`Selected package root must not be a symlink: ${member.path} (${path})`);
  }
}

function assertPackageRootsDoNotNest(packages: readonly SelectedPackage[]): void {
  for (let i = 0; i < packages.length; i++) {
    const a = packages[i]!;
    for (let j = i + 1; j < packages.length; j++) {
      const b = packages[j]!;
      if (Path.Is.within(a.root, b.root) || Path.Is.within(b.root, a.root)) {
        throw Err.std(
          `Selected package roots must not be nested: ${a.identity.path} and ${b.identity.path}`,
        );
      }
    }
  }
}

function isPackageScope(input: unknown): input is string {
  return Is.str(input) && SCOPE.test(input);
}

function isScopedPackageName(input: unknown): input is t.StringPkgName {
  return Is.str(input) && PACKAGE_NAME.test(input);
}

function validatePackageSource(source: t.WorkspaceInfo.NormalizedSource): void {
  for (const pattern of source.include) validatePackagePattern(pattern, 'include');
  for (const pattern of source.exclude) validatePackagePattern(pattern, 'exclude');
}

function validatePackagePattern(pattern: t.StringPath, kind: 'include' | 'exclude'): void {
  if (isPortableAbsolute(pattern)) {
    throw Err.std(`Package source pattern must be relative (${kind}): ${pattern}`);
  }
  if (pattern.startsWith('!')) {
    throw Err.std(`Package source pattern must not be negated (${kind}): ${pattern}`);
  }
  if (pattern.replaceAll('\\', '/').split('/').includes('..')) {
    throw Err.std(`Package source pattern must not traverse (${kind}): ${pattern}`);
  }
}

function isPortableAbsolute(path: string): boolean {
  const normalized = path.replaceAll('\\', '/');
  return Path.Is.absolute(path) || normalized.startsWith('/') || /^[a-zA-Z]:/.test(path);
}

async function collectGlobSourcePaths(
  cwd: t.StringDir,
  source: t.WorkspaceInfo.NormalizedSource,
): Promise<t.StringPath[]> {
  const glob = Fs.glob(cwd, { includeDirs: false });
  const paths = new Set<t.StringPath>();

  for (const pattern of source.include) {
    const files = await glob.find(pattern, { exclude: source.exclude });
    for (const file of files) {
      if (await isRegularFile(file.path)) paths.add(file.path);
    }
  }

  return [...paths].sort(compare);
}

async function collectPackageSourcePaths(
  packages: readonly SelectedPackage[],
  source: t.WorkspaceInfo.NormalizedSource,
): Promise<PackageSourceFile[]> {
  const paths = new Map<t.StringPath, PackageSourceFile>();

  for (const item of packages) {
    const patterns = rootPackagePatterns(item.root, source);
    const glob = Fs.glob(item.root, { includeDirs: false });

    for (const pattern of patterns.include) {
      let matches: readonly { readonly path: t.StringPath }[];
      try {
        matches = await glob.find(pattern, { exclude: patterns.exclude });
      } catch (cause) {
        throw Err.std(
          `Could not scan package source: ${item.identity.name} (${item.identity.path}, ${pattern})`,
          { cause },
        );
      }

      for (const match of matches) {
        const path = Fs.resolve(match.path);
        if (!Path.Is.within(item.root, path)) {
          throw Err.std(`Matched package source escapes root: ${item.identity.name} (${path})`);
        }

        let info: Deno.FileInfo | undefined;
        try {
          info = await Fs.lstat(path);
        } catch (cause) {
          throw Err.std(`Could not inspect package source: ${item.identity.name} (${path})`, {
            cause,
          });
        }
        if (!info) {
          throw Err.std(`Matched package source does not exist: ${item.identity.name} (${path})`);
        }
        if (info.isSymlink || !info.isFile) continue;

        let physicalPath: t.StringPath;
        try {
          physicalPath = await Fs.realPath(path);
        } catch (cause) {
          throw Err.std(`Could not resolve package source: ${item.identity.name} (${path})`, {
            cause,
          });
        }
        if (!Path.Is.within(item.root, physicalPath)) {
          throw Err.std(
            `Matched package source escapes root through symlink: ${item.identity.name} (${path})`,
          );
        }

        if (!paths.has(physicalPath)) {
          paths.set(physicalPath, { package: item.identity, path: physicalPath });
        }
      }
    }
  }

  return [...paths.values()].sort((a, b) => compare(a.path, b.path));
}

async function isRegularFile(path: t.StringPath): Promise<boolean> {
  const info = await Deno.stat(path);
  return info.isFile;
}

async function countGlobLineStats(paths: readonly t.StringPath[]): Promise<LineStats> {
  const files = await Promise.all(paths.map((path) => countGlobFileLines(path)));
  return sumLineStats(files);
}

async function countPackageLineStats(paths: readonly PackageSourceFile[]): Promise<LineStats> {
  const files: FileLineStats[] = [];
  for (const file of paths) files.push(await countPackageFileLines(file));
  return sumLineStats(files);
}

async function countGlobFileLines(path: t.StringPath): Promise<FileLineStats> {
  const text = (await Fs.readText(path)).data ?? '';
  return {
    kind: classifyPath(path),
    lines: text.split('\n').length,
  };
}

async function countPackageFileLines(file: PackageSourceFile): Promise<FileLineStats> {
  const result = await Fs.readText(file.path);
  if (!result.ok || !Is.str(result.data)) {
    throw Err.std(`Could not read package source: ${file.package.name} (${file.path})`, {
      cause: result.error,
    });
  }
  return {
    kind: classifyPath(file.path),
    lines: result.data.split('\n').length,
  };
}

function sumLineStats(files: readonly FileLineStats[]): LineStats {
  return files.reduce<LineStats>(
    (acc, file) => {
      return {
        total: acc.total + file.lines,
        source: acc.source + (file.kind === 'source' ? file.lines : 0),
        unitTests: acc.unitTests + (file.kind === 'unit-test' ? file.lines : 0),
        uiSpecTests: acc.uiSpecTests + (file.kind === 'ui-spec-test' ? file.lines : 0),
      };
    },
    { total: 0, source: 0, unitTests: 0, uiSpecTests: 0 },
  );
}

function statsBase(
  source: t.WorkspaceInfo.NormalizedSource,
  files: number,
  lineStats: LineStats | undefined,
): t.WorkspaceInfo.StatsBase {
  return {
    runtime: {
      deno: Deno.version.deno,
      typescript: Deno.version.typescript,
      v8: Deno.version.v8,
    },
    source,
    files,
    ...(lineStats === undefined ? {} : {
      lines: lineStats.total,
      lineBreakdown: {
        source: lineStats.source,
        unitTests: lineStats.unitTests,
        uiSpecTests: lineStats.uiSpecTests,
      },
    }),
  };
}
