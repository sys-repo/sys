import { type t, Slug as Domain } from './common.ts';
import { Error } from './m.Slug.Error.ts';
import { fromYaml } from './m.Slug.fromYaml.ts';

export const Slug: t.YamlSlugLib = {
  fromYaml,
  Error,
  Domain,
};
