import { Is, Schema, type t } from '../common.ts';
import { SlugFileContentSchema } from './u.schema.ts';

export const validate: t.SlugFileContentSchemaLib['validate'] = (input) => {
  const ok = (doc: t.SlugFileContentDoc): t.SlugValidateOK<t.SlugFileContentDoc> => ({
    ok: true,
    sequence: doc,
  });
  const fail = (message: string): t.SlugValidateFail => ({
    ok: false,
    error: new Error(message),
  });

  if (!Is.record(input)) {
    return fail('Invalid slug-file-content: expected an object payload.');
  }

  const isValid = Schema.Value.Check(SlugFileContentSchema, input);
  if (!isValid) {
    return fail('Invalid slug-file-content: value does not conform to schema.');
  }

  return ok(input as t.SlugFileContentDoc);
};
