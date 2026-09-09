import { type t, Is, Obj } from './common.ts';

export const Data: t.HttpOriginDataLib = {
  flatten(input, prefix) {
    const rows: t.HttpOrigin.UrlRow[] = [];
    walk(input, prefix ?? '');
    return rows;

    function walk(node: t.HttpOrigin.UrlTree, key: string) {
      if (Is.string(node)) {
        rows.push({ key, url: node });
        return;
      }

      const map = node as Record<string, t.HttpOrigin.UrlTree>;
      Obj.keys(map).forEach((childKey) => {
        const next = key ? `${key}.${childKey}` : childKey;
        walk(map[childKey], next);
      });
    }
  },
};
