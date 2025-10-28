import type { t } from './common.ts';

/**
 * Public registry surface (single mutator, read-only queries).
 */
export type SlugViewRegistry = {
  register: t.SlugViewRegister;
  get(id?: t.SlugViewId): t.SlugViewRenderer | undefined;
  list(): t.SlugViewRegistryItem[];
};

/** Register a view. */
export type SlugViewRegister = (
  id: t.SlugViewId,
  render: t.SlugViewRenderer,
  meta?: t.SlugViewMeta,
) => t.SlugViewRegistry;

/** Read-only projection for consumers (non-configurable). */
export type SlugViewRegistryReadonly = Pick<SlugViewRegistry, 'get' | 'list'>;

/** Single item within the registry list. */
export type SlugViewRegistryItem = {
  readonly id: t.SlugViewId;
  readonly meta?: t.SlugViewMeta;
};
