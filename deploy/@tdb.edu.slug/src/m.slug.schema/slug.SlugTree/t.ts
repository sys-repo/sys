import type { t } from './common.ts';

/** Type re-export */
export type * from './t.lib.ts';

export type SlugTreeItems = readonly SlugTreeItem[];
export type SlugTreeItem = SlugTreeItemRefOnly | SlugTreeItemInline;

export type SlugTreeItemRefOnly = {
  readonly slug: string;
  readonly ref: string;
  readonly slugs?: readonly SlugTreeItem[];
};

export type SlugTreeItemInline = {
  readonly slug: string;
  readonly description?: string;
  readonly traits?: readonly t.SlugTrait[];
  readonly data?: { readonly [key: string]: unknown };
  readonly slugs?: readonly SlugTreeItem[];
};

export type SlugTraitRegistry = {
  readonly all: readonly SlugTraitRegistryEntry[];
  get(id: string): SlugTraitRegistryEntry | undefined;
};
export type SlugTraitRegistryEntry = {
  readonly id: t.StringId;
  readonly propsSchema: t.TSchema;
};
