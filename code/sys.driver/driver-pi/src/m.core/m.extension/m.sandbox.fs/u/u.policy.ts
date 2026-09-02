import { Arr, Fs, type t } from '../common.ts';
import { runtimeRoot } from '../../../m.cli/u.runtime.ts';

const PROTECTED_SEGMENTS = [
  ['.git'],
  ['.pi'],

  // Legacy wrapper-owned runtime scars. Keep them protected so remove/move/copy
  // cannot mutate pre-migration state if an older workspace still contains it.
  ['.tmp', 'pi.cli'],
  ['.tmp', 'pi.cli.pi'],
  ['.log', '@sys.driver-pi'],
  ['.log', '@sys.driver-pi.pi'],
] as const;

/** Resolve wrapper-owned sandbox filesystem extension policy. */
export function resolvePolicy(
  input: t.PiSandboxFsExtension.ResolvePolicyInput,
): t.PiSandboxFsExtension.Policy {
  const root = runtimeRoot(input.cwd, 'Pi sandbox filesystem extension');

  return {
    readRoots: Arr.uniq([root, ...resolvePaths(root, input.read ?? [])]),
    writeRoots: Arr.uniq([root, ...resolvePaths(root, input.write ?? [])]),
    protectedRoots: protectedRoots(root),
    remove: {
      enabled: input.remove?.enabled !== false,
      recursive: input.remove?.recursive !== false,
    },
    move: { enabled: input.move?.enabled !== false },
    copy: { enabled: input.copy?.enabled !== false },
  };
}

/** Resolve the registered tool names enabled by this policy. */
export function toolNames(policy: t.PiSandboxFsExtension.Policy): readonly string[] {
  const names: string[] = [];
  if (policy.remove.enabled) names.push('remove');
  if (policy.move.enabled) names.push('move');
  if (policy.copy.enabled) names.push('copy');
  return names;
}

/**
 * Helpers:
 */
function resolvePaths(root: t.StringDir, paths: readonly t.StringPath[]) {
  return paths.map((path) => Fs.resolve(root, path) as t.StringPath);
}

function protectedRoots(root: t.StringDir) {
  return PROTECTED_SEGMENTS.map((segments) => Fs.join(root, ...segments) as t.StringPath);
}
