import { R, type t } from './common.ts';

/**
 * Field builder.
 */
export function FieldBuilder<F extends string>(): t.PropListFieldBuilder<F> {
  type H = t.PropListItemFactory | t.PropListItem;
  const handlers: [F, H][] = [];
  const find = (name: F) => handlers.find((item) => item[0] === name)?.[1];

  const run = (name: F) => {
    const item = find(name);
    const res = typeof item === 'function' ? item() : item;
    return res ? res : undefined;
  };

  const api: t.PropListFieldBuilder<F> = {
    /**
     * Define a field factory.
     */
    field(name: F, item: H) {
      if (find(name)) throw new Error(`Handler named '${name}' already added.`);
      handlers.push([name, item]);
      return api;
    },

    /**
     * Convert fields to <PropList> items.
     */
    items(fields: F[] = []) {
      type P = t.PropListItem[];
      const items: P = [];
      fields.filter(Boolean).forEach((name) => {
        const res = run(name);
        if (!res) return;
        R.flatten(Array.isArray(res) ? res : [res]).forEach((item) => {
          if (typeof item === 'object' && item !== null) items.push(item);
        });
      });
      return items;
    },
  };

  return api;
}
