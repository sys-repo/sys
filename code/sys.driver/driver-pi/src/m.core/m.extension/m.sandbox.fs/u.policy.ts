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
  const enabled = input.remove?.enabled === true;
  const recursive = input.remove?.recursive === true;

  return {
    enabled,
    recursive,
    removeRoots: uniqueDirs([root, ...resolveDirs(root, input.write ?? [])]),
    protectedRoots: protectedRoots(root),
  };
}

/**
 * Helpers:
 */
function resolveDirs(root: t.StringDir, paths: readonly t.StringPath[]) {
  return paths.map((path) => Fs.resolve(root, path) as t.StringDir);
}

function protectedRoots(root: t.StringDir) {
  return PROTECTED_SEGMENTS.map((segments) => Fs.join(root, ...segments) as t.StringPath);
}

function uniqueDirs(paths: readonly t.StringDir[]) {
  const seen = new Set<string>();
  const next: t.StringDir[] = [];
  for (const path of paths) {
    if (seen.has(path)) continue;
    seen.add(path);
    next.push(path);
  }
  return next;
}
