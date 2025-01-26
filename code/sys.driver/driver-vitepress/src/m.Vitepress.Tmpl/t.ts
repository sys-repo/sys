import type { t } from './common.ts';

/**
 * Template Library:
 * Create and keep upated a "Vitepress" project.
 */
export type VitepressTmplLib = {
  /** Creates an instance of the template file generator. */
  create(args: t.VitepressTmplCreateArgs): Promise<t.Tmpl>;
};

/** Arguments passed to the `VitepressTmpl.create` method. */
export type VitepressTmplCreateArgs = {
  inDir: t.StringDir;
  srcDir?: t.StringDir;
  version?: t.StringSemver;
};
