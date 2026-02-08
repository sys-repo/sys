import { type t, Is } from './common.ts';

export function selectOrFirst(selected: string | undefined, ids: string[]): string | undefined {
  if (selected && ids.includes(selected)) return selected;
  return ids[0];
}

export function refsFromTree(tree: t.SlugTreeItems, total = 3): string[] {
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

  return refs.filter((item, index, all) => all.indexOf(item) === index).slice(0, total);
}
