import type { t } from './common.ts';

export type SlugTreeSchemaLib = {
  readonly Item: t.TSchema;
  readonly Props: t.TSchema;
  readonly validate: SlugTreeValidate;
  readonly Is: t.SlugTreeSchemaIsLib;
};

export type SlugTreeValidate = (
  input: unknown,
  opts?: t.SlugTreeValidateOpts,
) => t.SlugValidateResult<t.SlugTreeItems>;
export type SlugTreeValidateOpts = { readonly registry?: t.SlugTraitRegistry };

export type SlugTreeSchemaIsLib = {
  readonly items: (value: unknown) => value is t.SlugTreeItems;
  readonly item: (value: unknown) => value is t.SlugTreeItem;
  readonly refOnly: (value: unknown) => value is t.SlugTreeItemRefOnly;
  readonly inline: (value: unknown) => value is t.SlugTreeItemInline;
};
