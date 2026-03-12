import { Fs, type t } from './common.ts';

const CANONICAL_TARGETS = ['pkg.ts', 'src/pkg.ts'] as const;

/**
 * Resolve the canonical generated package metadata targets for a package root.
 */
export async function resolveExistingTargets(packagePath: t.StringPath) {
  const targets: string[] = [];

  for (const target of CANONICAL_TARGETS) {
    const path = Fs.join(packagePath, target);
    if (await Fs.exists(path)) targets.push(path);
  }

  return targets;
}
