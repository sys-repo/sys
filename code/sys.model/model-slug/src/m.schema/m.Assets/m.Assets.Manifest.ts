import { type t } from './common.ts';
import { schema } from './u.manifest.schema.ts';
import { parse, standard } from './u.manifest.ts';

export const Manifest: t.SlugAssetsManifestSchemaLib = {
  schema,
  parse,
  standard,
};
