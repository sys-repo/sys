import { type t, Is, Num } from './common.ts';

export function findHash(entries: readonly t.SlugFileContentEntry[], ref: string): string | undefined {
  const entry = entries.find((item) => item.frontmatter?.ref === ref || item.path === ref);
  return entry?.hash;
}

export function refsFromTree(tree: t.SlugTreeItems, total = Num.MAX_INT): string[] {
  const refs: string[] = [];
  for (const item of tree) {
    if (refs.length >= total) break;
    const ref = 'ref' in item && Is.str(item.ref) ? item.ref : undefined;
    if (ref && ref.length > 0) refs.push(ref);

    const slugs = item.slugs;
    if (Array.isArray(slugs) && refs.length < total) {
      const remaining = total - refs.length;
      refs.push(...refsFromTree(slugs, remaining));
    }
  }

  return Array.from(new Set(refs)).slice(0, total);
}

export function selectOrFirst(selected: string | undefined, refs: readonly string[]): string | undefined {
  if (selected && refs.includes(selected)) return selected;
  return refs[0];
}
