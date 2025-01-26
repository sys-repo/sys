import type { t } from './common.ts';

/**
 * Creates an instance of the template file generator.
 */
export type VitePressTmplFactory = (args: t.VitePressTmplFactoryArgs) => Promise<t.Tmpl>;
export type VitePressTmplFactoryArgs = {
  inDir: t.StringDir;
  srcDir?: t.StringDir;
  version?: t.StringSemver;
};
