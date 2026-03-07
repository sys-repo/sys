import type { t } from './common.ts';

/** Schema library for slug file-content documents. */
export type SlugFileContentSchemaLib = {
  readonly Index: t.TSchema;
  readonly Props: t.TSchema;
  readonly validate: SlugFileContentValidate;
  readonly Is: t.SlugFileContentSchemaIsLib;
};

/** Validator for slug file-content documents. */
export type SlugFileContentValidate = (
  input: unknown,
) => t.SlugValidateResult<t.SlugFileContentDoc>;
