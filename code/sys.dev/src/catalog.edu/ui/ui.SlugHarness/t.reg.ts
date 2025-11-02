import type { t } from './common.ts';

/**
 * Public registry surface (single mutator, read-only queries).
 */
export type SlugViewRegistry<TView extends t.SlugViewId = string> = {
  register: t.SlugViewRegister<TView>;
  get(id?: TView): t.SlugViewRenderer | undefined;
  list(): t.SlugViewRegistryItem<TView>[];
};

/** Register a view. */
export type SlugViewRegister<TView extends t.SlugViewId> = (
  id: TView,
  render: t.SlugViewRenderer,
  meta?: t.SlugViewMeta,
) => t.SlugViewRegistry<TView>;

/** Read-only projection for consumers (non-configurable). */
export type SlugViewRegistryReadonly<TView extends t.SlugViewId = string> = Pick<
  SlugViewRegistry<TView>,
  'get' | 'list'
>;

/** Single item within the registry list. */
export type SlugViewRegistryItem<TView extends t.SlugViewId = string> = {
  readonly id: TView;
  readonly meta?: t.SlugViewMeta;
};
