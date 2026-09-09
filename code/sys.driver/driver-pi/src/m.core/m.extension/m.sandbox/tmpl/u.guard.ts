import type {
  CopyGuardInput,
  GuardResult,
  MoveGuardInput,
  PathGuardResult,
  RemoveGuardInput,
  SandboxFsPolicy,
} from './t.ts';
import { Fs } from './u.path.ts';

export async function guardRemove(input: RemoveGuardInput): Promise<GuardResult> {
  const requested = input.requested;
  if (!input.policy.remove.enabled) return blocked('remove is disabled by active profile policy.');
  if (!requested) return blocked('remove requires a non-empty path.');
  const common = guardRequestedPath('remove', requested);
  if (!common.ok) return common;
  if (input.recursive && !input.policy.remove.recursive) {
    return blocked('recursive removal is disabled by active profile policy.');
  }

  const target = normalize(input.target);
  const contained = guardInsideRoot('remove target', target, input.policy.writeRoots);
  if (!contained.ok) return blocked(contained.reason);
  if (isOperationRoot(input.policy.writeRoots, target)) {
    return blocked('remove refuses to remove an operation root.');
  }

  const protectedRoots = normalizedProtectedRoots(input.policy);
  if (
    isInsideProtectedRoot(target, protectedRoots) || containsProtectedRoot(target, protectedRoots)
  ) {
    return blocked('remove refuses protected control/runtime paths.');
  }

  const info = await Fs.lstat(target);
  if (!info) return blocked(`remove target does not exist: ${target}`);

  const intermediate = await guardIntermediateSymlinks('remove', contained.root, target);
  if (!intermediate.ok) return intermediate;

  if (info.isSymlink && input.recursive) {
    return blocked('remove refuses recursive removal of symlinks.');
  }
  if (input.recursive && !info.isDirectory) {
    return blocked('recursive removal requires a directory target.');
  }

  return { ok: true, info };
}

export async function guardMove(input: MoveGuardInput): Promise<GuardResult> {
  if (!input.policy.move.enabled) return blocked('move is disabled by active profile policy.');
  if (!input.from) return blocked('move requires a non-empty source path.');
  if (!input.to) return blocked('move requires a non-empty destination path.');
  const fromCommon = guardRequestedPath('move source', input.from);
  if (!fromCommon.ok) return fromCommon;
  const toCommon = guardRequestedPath('move destination', input.to);
  if (!toCommon.ok) return toCommon;

  const from = normalize(input.resolvedFrom);
  const to = normalize(input.resolvedTo);
  if (samePath(from, to)) return blocked('move source and destination resolve to the same path.');

  const fromRoot = guardInsideRoot('move source', from, input.policy.writeRoots);
  if (!fromRoot.ok) return blocked(fromRoot.reason);
  const toRoot = guardInsideRoot('move destination', to, input.policy.writeRoots);
  if (!toRoot.ok) return blocked(toRoot.reason);
  if (isOperationRoot(input.policy.writeRoots, from)) {
    return blocked('move refuses to move an operation root.');
  }
  if (isOperationRoot(input.policy.writeRoots, to)) {
    return blocked('move refuses to move to an operation root.');
  }

  const protectedRoots = normalizedProtectedRoots(input.policy);
  if (isInsideProtectedRoot(from, protectedRoots) || isInsideProtectedRoot(to, protectedRoots)) {
    return blocked('move refuses protected control/runtime paths.');
  }
  if (containsProtectedRoot(to, protectedRoots)) {
    return blocked('move destination would contain a protected control/runtime path.');
  }

  const source = await Fs.lstat(from);
  if (!source) return blocked(`move source does not exist: ${from}`);
  const destination = await Fs.lstat(to);
  if (destination) return blocked(`move destination already exists: ${to}`);

  if (source.isDirectory && containsProtectedRoot(from, protectedRoots)) {
    return blocked('move refuses to move a directory containing protected control/runtime paths.');
  }
  if (source.isDirectory && isWithinOrEqual(from, to)) {
    return blocked('move refuses to move a directory into itself.');
  }

  const fromIntermediate = await guardIntermediateSymlinks('move source', fromRoot.root, from);
  if (!fromIntermediate.ok) return fromIntermediate;
  const toIntermediate = await guardIntermediateSymlinks('move destination', toRoot.root, to);
  if (!toIntermediate.ok) return toIntermediate;
  const parent = await guardParentDirectory('move destination', to);
  if (!parent.ok) return parent;

  return { ok: true, info: source };
}

export async function guardCopy(input: CopyGuardInput): Promise<GuardResult> {
  if (!input.policy.copy.enabled) return blocked('copy is disabled by active profile policy.');
  if (!input.from) return blocked('copy requires a non-empty source path.');
  if (!input.to) return blocked('copy requires a non-empty destination path.');
  const fromCommon = guardRequestedPath('copy source', input.from);
  if (!fromCommon.ok) return fromCommon;
  const toCommon = guardRequestedPath('copy destination', input.to);
  if (!toCommon.ok) return toCommon;

  const from = normalize(input.resolvedFrom);
  const to = normalize(input.resolvedTo);
  if (samePath(from, to)) return blocked('copy source and destination resolve to the same path.');

  const fromRoot = guardInsideRoot('copy source', from, input.policy.readRoots);
  if (!fromRoot.ok) return blocked(fromRoot.reason);
  const toRoot = guardInsideRoot('copy destination', to, input.policy.writeRoots);
  if (!toRoot.ok) return blocked(toRoot.reason);
  if (isOperationRoot(input.policy.writeRoots, to)) {
    return blocked('copy refuses to write to an operation root.');
  }

  const protectedRoots = normalizedProtectedRoots(input.policy);
  if (isInsideProtectedRoot(from, protectedRoots) || isInsideProtectedRoot(to, protectedRoots)) {
    return blocked('copy refuses protected control/runtime paths.');
  }

  const source = await Fs.lstat(from);
  if (!source) return blocked(`copy source does not exist: ${from}`);
  if (source.isSymlink) return blocked('copy refuses final-path symlink sources.');
  if (!source.isFile) return blocked('copy source must be a regular file.');

  const destination = await Fs.lstat(to);
  if (destination) return blocked(`copy destination already exists: ${to}`);

  const fromIntermediate = await guardIntermediateSymlinks('copy source', fromRoot.root, from);
  if (!fromIntermediate.ok) return fromIntermediate;
  const toIntermediate = await guardIntermediateSymlinks('copy destination', toRoot.root, to);
  if (!toIntermediate.ok) return toIntermediate;
  const parent = await guardParentDirectory('copy destination', to);
  if (!parent.ok) return parent;

  return { ok: true, info: source };
}

function guardRequestedPath(tool: string, requested: string): GuardResult {
  if (requested.startsWith('~')) return blocked(`${tool} does not expand ~ paths.`);
  if (hasParentSegment(requested)) return blocked(`${tool} refuses paths containing .. segments.`);
  if (hasGlobChars(requested)) return blocked(`${tool} refuses glob-shaped paths.`);
  return { ok: true };
}

function guardInsideRoot(label: string, target: string, roots: readonly string[]): PathGuardResult {
  const root = roots.map(normalize).find((candidate) => isWithinOrEqual(candidate, target));
  if (!root) {
    return { ok: false, reason: `${label} is outside configured sandbox roots: ${target}` };
  }
  return { ok: true, root };
}

async function guardIntermediateSymlinks(
  label: string,
  root: string,
  target: string,
): Promise<GuardResult> {
  const rel = Fs.Path.relative(root, target);
  const segments = rel.split(/[\\/]+/).filter((segment) => segment.length > 0);
  const intermediates = segments.slice(0, -1);
  let current = root;

  for (const segment of intermediates) {
    current = Fs.resolve(current, segment);
    const info = await Fs.lstat(current);
    if (!info) return blocked(`${label} parent does not exist: ${current}`);
    if (info.isSymlink) {
      return blocked(`${label} refuses intermediate symlink traversal: ${current}`);
    }
  }

  return { ok: true };
}

async function guardParentDirectory(label: string, target: string): Promise<GuardResult> {
  const parent = Fs.dirname(target);
  const info = await Fs.lstat(parent);
  if (!info) return blocked(`${label} parent does not exist: ${parent}`);
  if (info.isSymlink) return blocked(`${label} refuses intermediate symlink traversal: ${parent}`);
  if (!info.isDirectory) return blocked(`${label} parent is not a directory: ${parent}`);
  return { ok: true, info };
}

function hasParentSegment(path: string) {
  return path.split(/[\\/]+/).some((segment) => segment === '..');
}

function hasGlobChars(path: string) {
  return /[*?\[\]{}]/.test(path);
}

function isWithinOrEqual(root: string, target: string) {
  const rel = Fs.Path.relative(root, target);
  return rel === '' || (!rel.startsWith('..') && !Fs.Path.Is.absolute(rel));
}

function samePath(a: string, b: string) {
  return normalize(a) === normalize(b);
}

function normalize(path: string) {
  return Fs.resolve(path);
}

function isOperationRoot(roots: readonly string[], target: string) {
  return roots.map(normalize).some((root) => samePath(root, target));
}

function normalizedProtectedRoots(policy: SandboxFsPolicy) {
  return policy.protectedRoots.map(normalize);
}

function isInsideProtectedRoot(target: string, protectedRoots: readonly string[]) {
  return protectedRoots.some((path) => isWithinOrEqual(path, target));
}

function containsProtectedRoot(target: string, protectedRoots: readonly string[]) {
  return protectedRoots.some((path) => isWithinOrEqual(target, path));
}

function blocked(reason: string): GuardResult {
  return { ok: false, reason };
}
