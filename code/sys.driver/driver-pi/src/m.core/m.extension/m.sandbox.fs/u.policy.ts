import { Fs, type t } from './common.ts';
import { runtimeRoot } from '../../m.cli/u.runtime-root.ts';

const PROTECTED_SEGMENTS = [
  ['.git'],
  ['.pi'],
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
    readRoots: uniquePaths([root, ...resolvePaths(root, input.read ?? [])]),
    writeRoots: uniquePaths([root, ...resolvePaths(root, input.write ?? [])]),
    protectedRoots: protectedRoots(root),
    remove: {
      enabled: input.remove?.enabled !== false,
      recursive: input.remove?.recursive !== false,
    },
    move: { enabled: input.move?.enabled !== false },
    copy: { enabled: input.copy?.enabled !== false },
  };
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

function uniquePaths(paths: readonly t.StringPath[]) {
  const seen = new Set<string>();
  const next: t.StringPath[] = [];
  for (const path of paths) {
    if (seen.has(path)) continue;
    seen.add(path);
    next.push(path);
  }
  return next;
}
