import { type t } from './common.ts';
import { schema } from './u.manfest.schema.ts';
import { parse, standard } from './u.manifest.ts';

export const Manifest: t.TimecodePlaybackManifestSchemaLib = {
  schema,
  parse,
  standard,
};
