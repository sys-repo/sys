import { type t } from './common.ts';
import { lastSeg, toPathParts } from './m.Yaml.u.ts';

export const at: t.IndexTreeYamlLib['at'] = (root, path) => {
  const parts = toPathParts(path);
  if (parts.length === 0) return root;

  let list: t.TreeNodeList = root;
  for (const seg of parts) {
    const next = list.find((n) => {
      const tail = lastSeg(n.key);
      const id = typeof n.meta?.id === 'string' ? (n.meta.id as string) : undefined;
      return seg === tail || (id && seg === id);
    });
    if (!next || !next.children) return [];
    list = next.children;
  }
  return list;
};
