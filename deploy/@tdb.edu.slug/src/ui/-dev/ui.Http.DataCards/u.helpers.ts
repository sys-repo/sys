import { TreeData } from '../../m.data/mod.ts';
import { type t, Is } from './common.ts';

export function findHash(entries: readonly t.SlugFileContentEntry[], ref: string): string | undefined {
  const entry = entries.find((item) => item.frontmatter?.ref === ref || item.path === ref);
  return entry?.hash;
}

export function treeFromResponse(input: unknown): t.TreeHostViewNodeList | undefined {
  if (!Is.record(input)) return undefined;
  const value = Is.record(input.value) ? input.value : undefined;
  const tree = value && Is.record(value.tree) ? value.tree : undefined;
  if (!tree || !Array.isArray(tree.tree)) return undefined;
  return TreeData.fromSlugTree(tree as t.SlugTreeDoc);
}
