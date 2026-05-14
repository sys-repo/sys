import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { Type } from 'typebox';

type FileInfo = {
  readonly isFile: boolean;
  readonly isDirectory: boolean;
  readonly isSymlink: boolean;
};

type SandboxFsPolicy = {
  readonly readRoots: readonly string[];
  readonly writeRoots: readonly string[];
  readonly protectedRoots: readonly string[];
  readonly remove: RemovePolicy;
  readonly move: MovePolicy;
  readonly copy: CopyPolicy;
};

type RemovePolicy = {
  readonly enabled: boolean;
  readonly recursive: boolean;
};

type MovePolicy = {
  readonly enabled: boolean;
};

type CopyPolicy = {
  readonly enabled: boolean;
};

type RemoveParams = {
  readonly path: string;
  readonly recursive?: boolean;
};

type MoveParams = {
  readonly from: string;
  readonly to: string;
};

type CopyParams = {
  readonly from: string;
  readonly to: string;
};

type RemoveDetails = {
  readonly ok: boolean;
  readonly path: string;
  readonly resolved: string;
  readonly recursive: boolean;
  readonly reason?: string;
};

type MoveDetails = {
  readonly ok: boolean;
  readonly from: string;
  readonly to: string;
  readonly resolvedFrom: string;
  readonly resolvedTo: string;
  readonly reason?: string;
};

type CopyDetails = {
  readonly ok: boolean;
  readonly from: string;
  readonly to: string;
  readonly resolvedFrom: string;
  readonly resolvedTo: string;
  readonly reason?: string;
};

type TextBlock = {
  readonly type: 'text';
  readonly text: string;
};

type RemoveGuardInput = {
  readonly requested: string;
  readonly target: string;
  readonly recursive: boolean;
  readonly policy: SandboxFsPolicy;
};

type MoveGuardInput = {
  readonly from: string;
  readonly to: string;
  readonly resolvedFrom: string;
  readonly resolvedTo: string;
  readonly policy: SandboxFsPolicy;
};

type CopyGuardInput = {
  readonly from: string;
  readonly to: string;
  readonly resolvedFrom: string;
  readonly resolvedTo: string;
  readonly policy: SandboxFsPolicy;
};

type GuardResult =
  | { readonly ok: true; readonly info?: FileInfo }
  | { readonly ok: false; readonly reason: string };

type PathGuardResult =
  | { readonly ok: true; readonly root: string }
  | { readonly ok: false; readonly reason: string };

declare const __SANDBOX_FS_POLICY__: SandboxFsPolicy;
const POLICY: SandboxFsPolicy = __SANDBOX_FS_POLICY__;

const Fs = {
  resolve: resolvePath,
  dirname,
  lstat,
  remove: removePath,
  rename: Deno.rename,
  copyFile: Deno.copyFile,
  Path: {
    relative,
    Is: { absolute: isAbsolutePath },
  },
} as const;

const removeParameters = Type.Object(
  {
    path: Type.String({
      description:
        'File or directory path to remove, relative to cwd or absolute inside the writable sandbox.',
    }),
    recursive: Type.Optional(
      Type.Boolean({
        description:
          'Remove a directory tree. Requires active profile policy tools.remove.recursive.',
      }),
    ),
  },
  { additionalProperties: false },
);

const moveParameters = Type.Object(
  {
    from: Type.String({
      description:
        'Source file or directory path, relative to cwd or absolute inside the writable sandbox.',
    }),
    to: Type.String({
      description:
        'Destination file or directory path, relative to cwd or absolute inside the writable sandbox.',
    }),
  },
  { additionalProperties: false },
);

const copyParameters = Type.Object(
  {
    from: Type.String({
      description:
        'Source regular-file path, relative to cwd or absolute inside a readable sandbox root.',
    }),
    to: Type.String({
      description:
        'Destination file path, relative to cwd or absolute inside a writable sandbox root.',
    }),
  },
  { additionalProperties: false },
);

export default function sandboxFs(pi: ExtensionAPI) {
  if (POLICY.remove.enabled) registerRemove(pi);
  if (POLICY.move.enabled) registerMove(pi);
  if (POLICY.copy.enabled) registerCopy(pi);
}

export const __sandboxFsTest = {
  guardRemove,
  guardMove,
  guardCopy,
} as const;

/**
 * Helpers:
 */
function registerRemove(pi: ExtensionAPI) {
  pi.registerTool({
    name: 'remove',
    label: 'Remove',
    description:
      'Remove a file or directory path inside the writable sandbox. No globs, no shell commands.',
    promptSnippet: 'Remove a file or directory path inside the writable sandbox.',
    promptGuidelines: [
      'Use remove only for stale files or directories that should no longer exist after a refactor.',
      'Do not use bash for file deletion; use remove for cleanup inside the writable sandbox.',
      'Set recursive only when removing a directory tree and profile policy permits recursive removal.',
    ],
    parameters: removeParameters,

    async execute(_toolCallId, params: RemoveParams, _signal, _onUpdate, ctx) {
      const requested = params.path.trim();
      const recursive = params.recursive === true;
      const target = Fs.resolve(ctx.cwd, requested);
      const guard = await guardRemove({ requested, target, recursive, policy: POLICY });

      if (!guard.ok) return toRemoveError(requested, target, recursive, guard.reason);

      try {
        await Fs.remove(target, { recursive });
        return toRemoveSuccess(requested, target, recursive);
      } catch (error) {
        return toRemoveError(
          requested,
          target,
          recursive,
          toFsErrorMessage('remove', target, error),
        );
      }
    },
  });
}

function registerMove(pi: ExtensionAPI) {
  pi.registerTool({
    name: 'move',
    label: 'Move',
    description:
      'Move or rename a file or directory path inside the writable sandbox. No globs, no shell commands.',
    promptSnippet: 'Move or rename a file or directory path inside the writable sandbox.',
    promptGuidelines: [
      'Use move for file/directory renames and refactor moves that should preserve content exactly.',
      'Do not use bash for file moves or renames; use move inside the writable sandbox.',
      'Do not use move to overwrite an existing destination.',
    ],
    parameters: moveParameters,

    async execute(_toolCallId, params: MoveParams, _signal, _onUpdate, ctx) {
      const from = params.from.trim();
      const to = params.to.trim();
      const resolvedFrom = Fs.resolve(ctx.cwd, from);
      const resolvedTo = Fs.resolve(ctx.cwd, to);
      const guard = await guardMove({ from, to, resolvedFrom, resolvedTo, policy: POLICY });

      if (!guard.ok) return toMoveError(from, to, resolvedFrom, resolvedTo, guard.reason);

      try {
        await Fs.rename(resolvedFrom, resolvedTo);
        return toMoveSuccess(from, to, resolvedFrom, resolvedTo);
      } catch (error) {
        return toMoveError(
          from,
          to,
          resolvedFrom,
          resolvedTo,
          toMoveErrorMessage(resolvedFrom, resolvedTo, error),
        );
      }
    },
  });
}

function registerCopy(pi: ExtensionAPI) {
  pi.registerTool({
    name: 'copy',
    label: 'Copy',
    description:
      'Copy one regular file from a readable sandbox path to a writable sandbox path. No globs, no shell commands.',
    promptSnippet: 'Copy one regular file from a readable sandbox path to a writable sandbox path.',
    promptGuidelines: [
      'Use copy for exact artifact import from readable roots into the writable workspace.',
      'Do not use bash for file copies; use copy inside the sandbox.',
      'Do not use copy to overwrite an existing destination.',
    ],
    parameters: copyParameters,

    async execute(_toolCallId, params: CopyParams, _signal, _onUpdate, ctx) {
      const from = params.from.trim();
      const to = params.to.trim();
      const resolvedFrom = Fs.resolve(ctx.cwd, from);
      const resolvedTo = Fs.resolve(ctx.cwd, to);
      const guard = await guardCopy({ from, to, resolvedFrom, resolvedTo, policy: POLICY });

      if (!guard.ok) return toCopyError(from, to, resolvedFrom, resolvedTo, guard.reason);

      try {
        await Fs.copyFile(resolvedFrom, resolvedTo);
        return toCopySuccess(from, to, resolvedFrom, resolvedTo);
      } catch (error) {
        return toCopyError(
          from,
          to,
          resolvedFrom,
          resolvedTo,
          toCopyErrorMessage(resolvedFrom, resolvedTo, error),
        );
      }
    },
  });
}

async function guardRemove(input: RemoveGuardInput): Promise<GuardResult> {
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

async function guardMove(input: MoveGuardInput): Promise<GuardResult> {
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

async function guardCopy(input: CopyGuardInput): Promise<GuardResult> {
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

function resolvePath(...parts: readonly string[]) {
  let path = '';
  for (const part of parts) {
    if (!part) continue;
    if (isAbsolutePath(part)) path = part;
    else path = path ? `${path}/${part}` : part;
  }
  if (!path) path = '.';
  if (!isAbsolutePath(path)) path = `${Deno.cwd()}/${path}`;
  return normalizePath(path);
}

function normalizePath(input: string) {
  const path = input.replaceAll('\\', '/');
  const absolute = isAbsolutePath(path);
  const drive = absolute ? windowsDrive(path) : undefined;
  const prefix = drive ? `${drive}/` : absolute ? '/' : '';
  const rest = drive ? path.slice(drive.length + 1) : absolute ? path.slice(1) : path;
  const output: string[] = [];

  for (const segment of rest.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      if (output.length > 0 && output.at(-1) !== '..') output.pop();
      else if (!absolute) output.push(segment);
      continue;
    }
    output.push(segment);
  }

  const normalized = `${prefix}${output.join('/')}`;
  if (normalized) return normalized;
  return absolute ? prefix || '/' : '.';
}

function dirname(input: string) {
  const path = normalizePath(input);
  const drive = windowsDrive(path);
  const root = drive ? `${drive}/` : '/';
  const trimmed = path.length > root.length ? path.replace(/\/+$/, '') : path;
  const index = trimmed.lastIndexOf('/');
  if (index < 0) return '.';
  if (index === 0) return '/';
  if (drive && index === drive.length) return root;
  return trimmed.slice(0, index);
}

function relative(from: string, to: string) {
  const fromSegments = pathSegments(normalizePath(from));
  const toSegments = pathSegments(normalizePath(to));
  let shared = 0;
  while (shared < fromSegments.length && fromSegments[shared] === toSegments[shared]) shared += 1;
  const up = Array.from({ length: fromSegments.length - shared }, () => '..');
  return [...up, ...toSegments.slice(shared)].join('/');
}

async function lstat(path: string): Promise<FileInfo | undefined> {
  try {
    return await Deno.lstat(path);
  } catch (error) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
}

async function removePath(path: string, options: { readonly recursive?: boolean } = {}) {
  await Deno.remove(path, { recursive: options.recursive === true });
}

function pathSegments(path: string) {
  const normalized = normalizePath(path);
  const drive = windowsDrive(normalized);
  const rest = drive ? normalized.slice(drive.length + 1) : normalized;
  return rest.split('/').filter((segment) => segment.length > 0);
}

function isAbsolutePath(path: string) {
  return path.startsWith('/') || path.startsWith('\\\\') || windowsDrive(path) !== undefined;
}

function windowsDrive(path: string) {
  const match = /^[A-Za-z]:/.exec(path);
  return match?.[0];
}

function isNotFound(error: unknown) {
  return error instanceof Deno.errors.NotFound ||
    (error instanceof Error && error.name === 'NotFound');
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

function toRemoveSuccess(path: string, resolved: string, recursive: boolean) {
  const details: RemoveDetails = { ok: true, path, resolved, recursive };
  return {
    content: [textBlock(`Removed: ${resolved}`)],
    details,
  };
}

function toRemoveError(path: string, resolved: string, recursive: boolean, reason: string) {
  const details: RemoveDetails = { ok: false, path, resolved, recursive, reason };
  return {
    content: [textBlock(`Remove failed: ${reason}`)],
    details,
    isError: true,
  };
}

function toMoveSuccess(from: string, to: string, resolvedFrom: string, resolvedTo: string) {
  const details: MoveDetails = { ok: true, from, to, resolvedFrom, resolvedTo };
  return {
    content: [textBlock(`Moved: ${resolvedFrom} → ${resolvedTo}`)],
    details,
  };
}

function toMoveError(
  from: string,
  to: string,
  resolvedFrom: string,
  resolvedTo: string,
  reason: string,
) {
  const details: MoveDetails = { ok: false, from, to, resolvedFrom, resolvedTo, reason };
  return {
    content: [textBlock(`Move failed: ${reason}`)],
    details,
    isError: true,
  };
}

function toCopySuccess(from: string, to: string, resolvedFrom: string, resolvedTo: string) {
  const details: CopyDetails = { ok: true, from, to, resolvedFrom, resolvedTo };
  return {
    content: [textBlock(`Copied: ${resolvedFrom} → ${resolvedTo}`)],
    details,
  };
}

function toCopyError(
  from: string,
  to: string,
  resolvedFrom: string,
  resolvedTo: string,
  reason: string,
) {
  const details: CopyDetails = { ok: false, from, to, resolvedFrom, resolvedTo, reason };
  return {
    content: [textBlock(`Copy failed: ${reason}`)],
    details,
    isError: true,
  };
}

function textBlock(text: string): TextBlock {
  return { type: 'text', text };
}

function isPermissionDenied(error: unknown) {
  return error instanceof Error && error.name === 'PermissionDenied';
}

function toMoveErrorMessage(from: string, to: string, error: unknown) {
  const message = toErrorMessage(error);
  if (isPermissionDenied(error)) {
    return `Filesystem write permission denied for move ${from} → ${to}; add both paths to sandbox.capability.write. ${message}`;
  }
  return `Filesystem move failed for ${from} → ${to}: ${message}`;
}

function toCopyErrorMessage(from: string, to: string, error: unknown) {
  const message = toErrorMessage(error);
  if (isPermissionDenied(error)) {
    return `Filesystem permission denied for copy ${from} → ${to}; add source read and destination write sandbox capability. ${message}`;
  }
  return `Filesystem copy failed for ${from} → ${to}: ${message}`;
}

function toFsErrorMessage(action: string, target: string, error: unknown) {
  const message = toErrorMessage(error);
  if (isPermissionDenied(error)) {
    return `Filesystem permission denied for ${target}; update sandbox capability for ${action}. ${message}`;
  }
  return `Filesystem ${action} failed for ${target}: ${message}`;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
