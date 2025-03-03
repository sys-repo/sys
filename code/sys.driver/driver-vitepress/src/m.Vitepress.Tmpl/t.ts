import type { t } from './common.ts';

/**
 * Template Library:
 * Create (and keep upated) a "Vitepress" project.
 */
export type VitepressTmplLib = {
  /** Tools for file bundling within the ESM module (to be published into the registry). */
  readonly Bundle: VitepressBundleLib;

  /** Creates an instance of the template file generator. */
  create(args: t.VitepressTmplCreateArgs): Promise<t.Tmpl>;

  /** Initialize the local machine environment with latest templates */
  update(args?: t.VitepressTmplUpdateArgs): Promise<t.VitepressTmplUpdateResponse>;
};

/** Arguments passed to the `VitepressTmpl.create` method. */
export type VitepressTmplCreateArgs = {
  inDir: t.StringDir;
  srcDir?: t.StringDir;
  version?: t.StringSemver;
};

/**
 * Tools for file bundling within the ESM module (to be published into the registry).
 */
export type VitepressBundleLib = {
  /** Read in the current source code of the templates and bundle it into a file-map. */
  toFilemap(): Promise<{ from: t.StringDir; to: t.StringDir }>;

  /** Write out the bundled <FileMap> to a target location. */
  toFilesystem(dir?: t.StringDir): Promise<void>;
};

/** Arguments passed to the `VitePress.Tmpl.update` method. */
export type VitepressTmplUpdateArgs = {
  force?: boolean;
  inDir?: t.StringDir;
  srcDir?: t.StringDir;
  version?: t.StringSemver;
  silent?: boolean;
};

/**
 * The response returned from an environment update.
 */
export type VitepressTmplUpdateResponse = { readonly ops: t.TmplFileOperation[] };
