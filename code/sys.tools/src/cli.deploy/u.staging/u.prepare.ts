import { Fs, Path, type t } from '../common.ts';
import { stagingPathIssue } from '../u.endpoints/u.pathPolicy.ts';
import { resolvePath } from '../u.endpoints/u.resolve.ts';
import { resolveStagingRoot } from './u.resolveStagingRoot.ts';
import { throwIfStagingCancelled } from './u.cancel.ts';
import { captureDirectoryIdentity } from './u.identity.ts';

export type ExecutableStagingDir = {
  readonly source: t.StringAbsoluteDir;
  readonly staging: t.StringAbsoluteDir;
};

type PreparedMappingBase = ExecutableStagingDir;

export type PreparedStagingMapping =
  | PreparedMappingBase & {
    readonly mode: 'copy' | 'build+copy';
    readonly sourceIdentity: t.DeployTool.Staging.DirectoryIdentity;
  }
  | PreparedMappingBase & {
    readonly mode: 'index';
  };

export type PreparedStagingPlan = {
  readonly cwd: t.StringAbsoluteDir;
  readonly stagingRoot: t.StringAbsoluteDir;
  readonly stagingRootRel: t.StringRelativeDir;
  readonly mappings: readonly PreparedStagingMapping[];
};

/** Resolve the complete mapping plan and reject destructive or ambiguous topology before writes. */
export async function prepareStagingPlan(args: {
  cwd: t.StringDir;
  mappings: readonly t.DeployTool.Staging.Mapping[];
  stagingRoot: t.StringRelativeDir;
  sourceRoot?: string;
  signal?: AbortSignal;
}): Promise<PreparedStagingPlan> {
  throwIfStagingCancelled(args.signal);
  const cwd = Path.resolve(args.cwd, '.');
  const stagingRoot = resolveStagingRoot({ cwd, stagingRootRel: args.stagingRoot });
  const stagingRootRel: t.StringRelativeDir = relativeWithin(cwd, stagingRoot, false);
  const sourceRoot = String(args.sourceRoot ?? '.');
  assertSourcePath(sourceRoot, 'source root');
  const sourceBase = resolvePath(cwd, sourceRoot);
  const existingStagingRoot = await canonicalIfPresent(stagingRoot, args.signal);

  const mappings: PreparedStagingMapping[] = [];
  for (const [index, mapping] of args.mappings.entries()) {
    throwIfStagingCancelled(args.signal);
    const mode = mapping.mode;
    if (mode !== 'copy' && mode !== 'build+copy' && mode !== 'index') {
      throw mappingError(index, `unsupported mode: ${String(mode)}`);
    }

    const stagingInput = String(mapping.dir.staging ?? '');
    assertMappingDestination(stagingInput, index);
    const staging: t.StringAbsoluteDir = resolvePath(stagingRoot, stagingInput);
    relativeWithin(stagingRoot, staging, true);

    const sourceInput = String(mapping.dir.source ?? '');
    if (mode === 'index') {
      assertIndexSource(sourceInput, index);
      const source: t.StringAbsoluteDir = resolvePath(stagingRoot, sourceInput);
      relativeWithin(stagingRoot, source, true);
      mappings.push(Object.freeze({ mode, source, staging }));
      continue;
    }

    assertSourcePath(sourceInput, `mapping[${index}] source path`);
    const resolvedSource = resolvePath(sourceBase, sourceInput);
    let source: t.StringAbsoluteDir;
    let sourceIdentity: t.DeployTool.Staging.DirectoryIdentity;
    try {
      source = await Fs.realPath(resolvedSource);
      sourceIdentity = await captureDirectoryIdentity({
        path: source,
        label: `Deploy staging mapping[${index}] source`,
        signal: args.signal,
      });
    } catch (cause) {
      throw new Error(
        `Deploy staging mapping[${index}] source could not be admitted as a canonical directory: ${resolvedSource}`,
        { cause },
      );
    }

    if (
      pathsOverlap(source, stagingRoot) ||
      (existingStagingRoot !== undefined && pathsOverlap(source, existingStagingRoot))
    ) {
      throw mappingError(index, 'source overlaps the owned staging root');
    }

    mappings.push(Object.freeze({ mode, source, staging, sourceIdentity }));
  }

  assertDisjointDestinations(mappings);
  assertDisjointMutationSources(mappings);
  throwIfStagingCancelled(args.signal);
  return Object.freeze({
    cwd,
    stagingRoot,
    stagingRootRel,
    mappings: Object.freeze(mappings),
  });
}

function assertMappingDestination(input: string, index: number): void {
  const issue = stagingPathIssue(input, {
    allowRoot: true,
    reserveGeneratedNames: true,
  });
  if (!issue) return;

  if (issue === 'required') throw mappingError(index, 'destination path is required');
  if (issue === 'edge-whitespace') {
    throw mappingError(index, 'destination must not have leading or trailing whitespace');
  }
  if (issue === 'tilde') throw mappingError(index, 'destination must not begin with tilde');
  if (issue === 'absolute') throw mappingError(index, 'destination must be relative');
  if (issue === 'backslash') {
    throw mappingError(index, 'destination must use portable separators');
  }
  if (issue === 'parent') throw mappingError(index, 'destination must not traverse a parent');
  if (issue === 'non-canonical' || issue === 'root') {
    throw mappingError(index, 'destination must use canonical relative path segments');
  }
  throw mappingError(index, 'destination contains a non-portable path segment');
}

function assertIndexSource(input: string, index: number): void {
  const issue = stagingPathIssue(input, {
    allowRoot: true,
    reserveGeneratedNames: true,
  });
  if (!issue) return;

  if (issue === 'required') throw mappingError(index, 'index source path is required');
  if (issue === 'edge-whitespace') {
    throw mappingError(index, 'index source must not have leading or trailing whitespace');
  }
  if (issue === 'tilde') throw mappingError(index, 'index source must not begin with tilde');
  if (issue === 'absolute') throw mappingError(index, 'index source must be relative');
  if (issue === 'backslash') {
    throw mappingError(index, 'index source must use portable separators');
  }
  if (issue === 'parent') throw mappingError(index, 'index source must not traverse a parent');
  if (issue === 'non-canonical' || issue === 'root') {
    throw mappingError(index, 'index source must use canonical relative path segments');
  }
  throw mappingError(index, 'index source contains a non-portable path segment');
}

function assertSourcePath(input: string, label: string): void {
  if (!input.trim()) throw new Error(`Deploy staging ${label} is required.`);
  if (input !== input.trim()) {
    throw new Error(
      `Deploy staging ${label} must not have leading or trailing whitespace.`,
    );
  }
}

function assertDisjointDestinations(mappings: PreparedStagingMapping[]): void {
  for (let leftIndex = 0; leftIndex < mappings.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < mappings.length; rightIndex += 1) {
      const left = mappings[leftIndex]!;
      const right = mappings[rightIndex]!;
      if (!pathsOverlap(left.staging, right.staging)) continue;
      throw new Error(
        `Deploy staging mapping destinations overlap: mappings[${leftIndex}] and mappings[${rightIndex}].`,
      );
    }
  }

  const prefixes = new Map<string, { readonly path: string; readonly mappingIndex: number }>();
  for (const [mappingIndex, mapping] of mappings.entries()) {
    let cursor = Path.resolve(mapping.staging, '.');
    while (true) {
      const portable = portablePath(cursor);
      const previous = prefixes.get(portable);
      if (previous && previous.path !== cursor) {
        throw new Error(
          `Deploy staging mapping destination ancestors have portable aliases: mappings[${previous.mappingIndex}] and mappings[${mappingIndex}].`,
        );
      }
      if (!previous) prefixes.set(portable, { path: cursor, mappingIndex });

      const parent = Path.dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
  }
}

function assertDisjointMutationSources(mappings: PreparedStagingMapping[]): void {
  for (let leftIndex = 0; leftIndex < mappings.length; leftIndex += 1) {
    const left = mappings[leftIndex]!;
    if (left.mode === 'index') continue;

    for (let rightIndex = leftIndex + 1; rightIndex < mappings.length; rightIndex += 1) {
      const right = mappings[rightIndex]!;
      if (right.mode === 'index') continue;
      if (left.mode !== 'build+copy' && right.mode !== 'build+copy') continue;
      if (!pathsOverlap(left.source, right.source)) continue;
      throw new Error(
        `Deploy staging mapping source mutation footprints overlap: mappings[${leftIndex}] and mappings[${rightIndex}].`,
      );
    }
  }
}

function relativeWithin(base: string, target: string, allowSame: boolean): string {
  const relativeHost = Path.relative(base, target);
  if (Path.Is.absolute(relativeHost) || !Path.Is.within(base, target)) {
    throw new Error(`Deploy staging path escapes its owned root: ${target}`);
  }

  const relative = Path.relativePosix(relativeHost);
  if (allowSame && !relative) return '';
  if (!relative || relative === '.' || relative === '..' || relative.startsWith('../')) {
    throw new Error(`Deploy staging path escapes its owned root: ${target}`);
  }
  return relative;
}

function pathsOverlap(a: string, b: string): boolean {
  const left = portablePath(a);
  const right = portablePath(b);
  return left === right || isAncestor(left, right) || isAncestor(right, left);
}

function portablePath(path: string): string {
  return Path.resolve(path, '.')
    .replaceAll('\\', '/')
    .normalize('NFC')
    .toLowerCase()
    .normalize('NFC');
}

function isAncestor(parent: string, child: string): boolean {
  return child.startsWith(parent.endsWith('/') ? parent : `${parent}/`);
}

async function canonicalIfPresent(
  path: string,
  signal?: AbortSignal,
): Promise<t.StringDir | undefined> {
  throwIfStagingCancelled(signal);
  if (!(await Fs.exists(path))) return undefined;
  let canonical: t.StringDir;
  try {
    canonical = await Fs.realPath(path);
  } catch {
    return undefined;
  }
  throwIfStagingCancelled(signal);
  return canonical;
}

function mappingError(index: number, reason: string): Error {
  return new Error(`Deploy staging mapping[${index}] is invalid: ${reason}.`);
}
