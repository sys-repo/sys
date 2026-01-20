import { type t, Arr, Is } from './common.ts';

export const findNode: t.TreeHostDataLib['findNode'] = (tree, path): t.SlugTreeItem | undefined => {
  if (!Arr.isArray(path) || path.length === 0) return undefined;

  let candidates: t.SlugTreeItems | undefined = tree;
  let current: t.SlugTreeItem | undefined;

  for (const segment of path) {
    if (!Is.str(segment) || segment.length === 0 || !Arr.isArray(candidates)) return undefined;

    current = candidates.find((item) => item.slug === segment);
    if (!current) return undefined;

    candidates = current.slugs;
  }

  return current;
};
