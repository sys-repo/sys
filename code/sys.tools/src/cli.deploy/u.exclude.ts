import { type t, Path } from './common.ts';

const EXCLUDE: readonly string[] = ['.DS_Store'];

export function shouldExclude(path: t.StringPath): boolean {
  return EXCLUDE.includes(Path.basename(path));
}
