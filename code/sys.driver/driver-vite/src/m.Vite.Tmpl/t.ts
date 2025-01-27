import type { t } from './common.ts';

/**
 * Template Library:
 * Create (and keep upated) a vanilla "Vite" project.
 */
export type ViteTmplLib = {
  /** Tools for file bundling within the ESM module (to be published into the registry). */
  readonly Bundle: ViteBundleLib;

  /** Creates an instance of the template file generator. */
  create(args: t.ViteTmplCreateArgs): Promise<t.Tmpl>;

  /** Initialize the local machine environment with latest templates */
  update(args?: t.ViteTmplUpdateArgs): Promise<t.ViteTmplUpdateResponse>;
};

/** Arguments passed to the `ViteTmpl.create` method. */
export type ViteTmplCreateArgs = {
  version?: t.StringSemver;
};

/**
 * Tools for file bundling within the ESM module (to be published into the registry).
 */
export type ViteBundleLib = {
  /** Read in the current source code of the templates and bundle it into a file-map. */
  toFilemap(): Promise<{ from: t.StringDir; to: t.StringDir }>;

  /** Write out the bundled <FileMap> to a target location. */
  toFilesystem(dir?: t.StringDir): Promise<void>;
};

/** Arguments passed to the `Vite.Tmpl.update` method. */
export type ViteTmplUpdateArgs = {
  force?: boolean;
  in?: t.StringDir;
  version?: t.StringSemver;
  silent?: boolean;
};

/**
 * The response returned from an environment update.
 */
export type ViteTmplUpdateResponse = { readonly ops: t.TmplFileOperation[] };
