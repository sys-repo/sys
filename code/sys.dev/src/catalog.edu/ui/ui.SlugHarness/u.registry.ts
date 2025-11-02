import { type t } from './common.ts';

type Entry = {
  readonly render: t.SlugViewRenderer;
  readonly meta?: t.SlugViewMeta;
};

/**
 * Make a minimal in-memory SlugView registry.
 */
export function makeRegistry<TView extends t.SlugViewId = string>(): t.SlugViewRegistry<TView> {
  const map = new Map<TView, Entry>();
  const api: t.SlugViewRegistry<TView> = {
    get: (id) => (id ? map.get(id)?.render : undefined),
    register(id, render, meta) {
      const entry: Entry = { render, meta: meta ? Object.freeze({ ...meta }) : undefined };
      map.set(id, entry);
      return api;
    },
    list() {
      const out: t.SlugViewRegistryItem<TView>[] = [];
      for (const [id, entry] of map) out.push({ id, meta: entry.meta });
      return out;
    },
  };
  return api;
}
