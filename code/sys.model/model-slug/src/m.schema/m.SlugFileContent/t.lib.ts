import type { t } from './common.ts';

export type SlugFileContentSchemaLib = {
  readonly Props: t.TSchema;
  readonly validate: SlugFileContentValidate;
  readonly Is: t.SlugFileContentSchemaIsLib;
};

export type SlugFileContentValidate = (
  input: unknown,
) => t.SlugValidateResult<t.SlugFileContentDoc>;
