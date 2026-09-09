import { Dir, Obj } from './common.ts';
import type { HashParts } from './t.ts';
import { fail } from './u.error.ts';

/** Compare complete path-to-hash records; a composite digest alone does not bind path names. */
export function hashPartsEqual(a: HashParts, b: HashParts): boolean {
  return Obj.eql(a, b);
}

export async function hashDir(dir: string, filter?: (path: string) => boolean) {
  const result = await Dir.Hash.compute(dir, filter);
  if (result.error) fail(`Could not hash ${dir}: ${result.error.message}`);
  return result.hash;
}
