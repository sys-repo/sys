import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { isAbsolute, relative, resolve } from 'node:path';
import { Type } from 'typebox';

type DenoLike = {
  readonly lstat: (path: string) => Promise<DenoFileInfo>;
  readonly remove: (path: string, options?: { readonly recursive?: boolean }) => Promise<void>;
};

type DenoFileInfo = {
  readonly isFile: boolean;
  readonly isDirectory: boolean;
  readonly isSymlink: boolean;
};

type RemovePolicy = {
  readonly enabled: boolean;
  readonly recursive: boolean;
  readonly removeRoots: readonly string[];
  readonly protectedRoots: readonly string[];
};

type RemoveParams = {
  readonly path: string;
  readonly recursive?: boolean;
};

type RemoveDetails = {
  readonly ok: boolean;
  readonly path: string;
  readonly resolved: string;
  readonly recursive: boolean;
  readonly reason?: string;
};

type TextBlock = {
  readonly type: 'text';
  readonly text: string;
};

type GuardInput = {
  readonly requested: string;
  readonly target: string;
  readonly recursive: boolean;
  readonly policy: RemovePolicy;
};

type GuardResult =
  | { readonly ok: true; readonly info: DenoFileInfo }
  | { readonly ok: false; readonly reason: string };

declare const __SANDBOX_FS_POLICY__: RemovePolicy;
const POLICY: RemovePolicy = __SANDBOX_FS_POLICY__;

const removeParameters = Type.Object(
  {
    path: Type.String({
      description: 'File or directory path to remove, relative to cwd or absolute inside the writable sandbox.',
    }),
    recursive: Type.Optional(
      Type.Boolean({
        description: 'Remove a directory tree. Requires active profile policy tools.remove.recursive.',
      }),
    ),
  },
  { additionalProperties: false },
);

export default function sandboxFs(pi: ExtensionAPI) {
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
      const target = resolve(ctx.cwd, requested);
      const guard = await guardRemove({ requested, target, recursive, policy: POLICY });

      if (!guard.ok) return toError(requested, target, recursive, guard.reason);

      try {
        await deno().remove(target, { recursive });
        return toSuccess(requested, target, recursive);
      } catch (error) {
        return toError(requested, target, recursive, toRemoveErrorMessage(target, error));
      }
    },
  });
}

export const __sandboxFsTest = {
  guardRemove,
} as const;

/**
 * Helpers:
 */
async function guardRemove(input: GuardInput): Promise<GuardResult> {
  const requested = input.requested;
  if (!input.policy.enabled) return blocked('remove is disabled by active profile policy.');
  if (!requested) return blocked('remove requires a non-empty path.');
  if (requested.startsWith('~')) return blocked('remove does not expand ~ paths.');
  if (hasParentSegment(requested)) return blocked('remove refuses paths containing .. segments.');
  if (hasGlobChars(requested)) return blocked('remove refuses glob-shaped paths.');
  if (input.recursive && !input.policy.recursive) {
    return blocked('recursive removal is disabled by active profile policy.');
  }

  const target = normalize(input.target);
  const removeRoots = input.policy.removeRoots.map(normalize);
  const root = removeRoots.find((candidate) => isWithinOrEqual(candidate, target));
  if (!root) return blocked(`remove target is outside configured remove roots: ${target}`);
  if (removeRoots.some((candidate) => samePath(candidate, target))) {
    return blocked('remove refuses to remove an operation root.');
  }

  const protectedRoots = input.policy.protectedRoots.map(normalize);
  if (protectedRoots.some((path) => isWithinOrEqual(path, target))) {
    return blocked('remove refuses protected control/runtime paths.');
  }

  const info = await lstat(target);
  if (!info) return blocked(`remove target does not exist: ${target}`);

  const intermediate = await guardIntermediateSymlinks(root, target);
  if (!intermediate.ok) return intermediate;

  if (info.isSymlink && input.recursive) {
    return blocked('remove refuses recursive removal of symlinks.');
  }
  if (input.recursive && !info.isDirectory) {
    return blocked('recursive removal requires a directory target.');
  }

  return { ok: true, info };
}

async function guardIntermediateSymlinks(root: string, target: string): Promise<GuardResult> {
  const rel = relative(root, target);
  const segments = rel.split(/[\\/]+/).filter((segment) => segment.length > 0);
  const intermediates = segments.slice(0, -1);
  let current = root;

  for (const segment of intermediates) {
    current = resolve(current, segment);
    const info = await lstat(current);
    if (!info) return blocked(`remove path parent does not exist: ${current}`);
    if (info.isSymlink) return blocked(`remove refuses intermediate symlink traversal: ${current}`);
  }

  return { ok: true, info: { isFile: false, isDirectory: true, isSymlink: false } };
}

async function lstat(path: string) {
  try {
    return await deno().lstat(path);
  } catch (error) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
}

function hasParentSegment(path: string) {
  return path.split(/[\\/]+/).some((segment) => segment === '..');
}

function hasGlobChars(path: string) {
  return /[*?\[\]{}]/.test(path);
}

function isWithinOrEqual(root: string, target: string) {
  const rel = relative(root, target);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function samePath(a: string, b: string) {
  return normalize(a) === normalize(b);
}

function normalize(path: string) {
  return resolve(path);
}

function blocked(reason: string): GuardResult {
  return { ok: false, reason };
}

function toSuccess(path: string, resolved: string, recursive: boolean) {
  const details: RemoveDetails = { ok: true, path, resolved, recursive };
  return {
    content: [textBlock(`Removed: ${resolved}`)],
    details,
  };
}

function toError(path: string, resolved: string, recursive: boolean, reason: string) {
  const details: RemoveDetails = { ok: false, path, resolved, recursive, reason };
  return {
    content: [textBlock(`Remove failed: ${reason}`)],
    details,
    isError: true,
  };
}

function textBlock(text: string): TextBlock {
  return { type: 'text', text };
}

function deno() {
  const runtime = (globalThis as unknown as { readonly Deno?: DenoLike }).Deno;
  if (!runtime) throw new Error('The remove tool requires the Deno runtime.');
  return runtime;
}

function isNotFound(error: unknown) {
  return error instanceof Error && error.name === 'NotFound';
}

function isPermissionDenied(error: unknown) {
  return error instanceof Error && error.name === 'PermissionDenied';
}

function toRemoveErrorMessage(target: string, error: unknown) {
  const message = toErrorMessage(error);
  if (isPermissionDenied(error)) {
    const hint = `Deno write permission denied for ${target}; add the path to sandbox.capability.write.`;
    return `${hint} ${message}`;
  }
  return `Deno remove failed for ${target}: ${message}`;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
