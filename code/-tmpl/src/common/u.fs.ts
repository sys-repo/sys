import { Fs } from './libs.ts';
import * as t from './t.ts';

/**
 * Finds the nearest `types.ts` upward from the given directory.
 */
export async function findNearestTypesFile(startDir: t.StringAbsoluteDir) {
  let found: string | undefined;
  await Fs.walkUp(startDir, async ({ dir, stop }) => {
    const candidate = Fs.join(dir, 'types.ts');
    if (await Fs.exists(candidate)) {
      found = candidate;
      stop();
    }
  });
  return found;
}

/**
 * Compute a forward-slash relative path from the directory of `fromFile`
 * to the absolute `toPath`. Assumes `toPath` is within `fromFile`'s ancestor tree.
 */
export function relativeFromFileDir(fromFile: string, toPath: string): string {
  const base = Fs.dirname(fromFile);
  const normalized = toPath.startsWith(base + '/') ? toPath.slice(base.length + 1) : toPath;
  return normalized.replaceAll('\\', '/'); // NB: Ensure forward slashes on all platforms.
}
