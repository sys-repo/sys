import type { t } from './common.ts';

/** Schema library for slug tree documents. */
export type SlugTreeSchemaLib = {
  readonly Item: t.TSchema;
  readonly Props: t.TSchema;
  readonly validate: SlugTreeValidate;
  readonly Is: t.SlugTreeSchemaIsLib;
};

/** Validator for slug tree documents. */
export type SlugTreeValidate = (
  input: unknown,
  opts?: t.SlugTreeValidateOpts,
) => t.SlugValidateResult<t.SlugTreeDoc>;
/** Validation options for slug tree documents. */
export type SlugTreeValidateOpts = { readonly registry?: t.SlugTraitRegistry };

/** Type guards for slug tree documents. */
export type SlugTreeSchemaIsLib = {
  readonly doc: (value: unknown) => value is t.SlugTreeDoc;
  readonly items: (value: unknown) => value is t.SlugTreeItems;
  readonly item: (value: unknown) => value is t.SlugTreeItem;
  readonly refOnly: (value: unknown) => value is t.SlugTreeItemRefOnly;
  readonly inline: (value: unknown) => value is t.SlugTreeItemInline;
};
