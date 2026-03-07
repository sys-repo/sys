import type { t } from './common.ts';

/** Type re-export */
export type * from './t.lib.ts';

/** Root document for a slug tree. */
export type SlugTreeDoc = {
  readonly tree: SlugTreeItems;
};

/** Collection of slug tree items. */
export type SlugTreeItems = readonly SlugTreeItem[];
/** Union of slug tree item variants. */
export type SlugTreeItem = SlugTreeItemRefOnly | SlugTreeItemInline;

/** Reference-only slug tree item. */
export type SlugTreeItemRefOnly = {
  readonly slug: string;
  readonly ref: string;
  readonly slugs?: readonly SlugTreeItem[];
};

/** Inline slug tree item with optional data and traits. */
export type SlugTreeItemInline = {
  readonly slug: string;
  readonly description?: string;
  readonly traits?: readonly t.SlugTrait[];
  readonly data?: { readonly [key: string]: unknown };
  readonly slugs?: readonly SlugTreeItem[];
};

/** Trait registry for resolving schema-backed traits. */
export type SlugTraitRegistry = {
  readonly all: readonly SlugTraitRegistryEntry[];
  get(id: string): SlugTraitRegistryEntry | undefined;
};
/** Trait registry entry with schema metadata. */
export type SlugTraitRegistryEntry = {
  readonly id: t.StringId;
  readonly propsSchema: t.TSchema;
};
