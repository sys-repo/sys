import type { t } from './common.ts';

/**
 * Creates an instance of the template file generator.
 */
export type VitepressTmplFactory = (args: t.VitepressTmplFactoryArgs) => Promise<t.Tmpl>;
export type VitepressTmplFactoryArgs = {
  inDir: t.StringDir;
  srcDir?: t.StringDir;
  version?: t.StringSemver;
};
