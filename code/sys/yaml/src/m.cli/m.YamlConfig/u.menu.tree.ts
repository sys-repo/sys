import { c, Fmt } from './common.ts';
import { fileLabel } from './u.fs.ts';

export function withTree(paths: readonly string[], ext: string) {
  return paths.map((path, i) => {
    const last = i === paths.length - 1;
    return { path, label: fileLabel(path, ext), tree: c.gray(Fmt.Tree.branch(last)) };
  });
}
