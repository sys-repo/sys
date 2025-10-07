import { type t } from './common.ts';
import { Error } from './m.Slug.Error.ts';
import { fromYaml } from './m.Slug.fromYaml.ts';

export const Slug: t.YamlSlugLib = {
  Error,
  fromYaml,
};
