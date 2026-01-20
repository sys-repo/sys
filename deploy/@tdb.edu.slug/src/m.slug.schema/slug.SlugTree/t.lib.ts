import type { t } from './common.ts';

export type SlugTreeSchemaLib = {
  readonly Item: t.TSchema;
  readonly Props: t.TSchema;
  readonly validate: SlugTreeValidate;
};

export type SlugTreeValidate = (
  input: unknown,
  opts?: t.SlugTreeValidateOpts,
) => t.ValidateResult<t.SlugTreeItems>;
export type SlugTreeValidateOpts = { readonly registry?: t.SlugTraitRegistry };
