import type { t } from './common.ts';

/**
 * Template Library:
 * Create (and keep upated) a vanilla "Vite" project.
 */
export type ViteTmplLib = {
  /** Tools for file bundling within the ESM module (to be published into the registry). */
  readonly Bundle: ViteBundleLib;

  /** Creates an instance of the template file generator. */
  create(args?: t.ViteTmplCreateArgs): Promise<t.Tmpl>;

  /** Write and process the templates to the local file-system. */
  write(args?: t.ViteTmplWriteArgs): Promise<t.ViteTmplWriteResponse>;

  /** Prepare the template with latest state and dependency versions. */
  prep(options?: { silent?: boolean }): Promise<t.ViteTmplPrepResponse>;
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
  writeToFile(dir?: t.StringDir): Promise<void>;
};

/** Arguments passed to the `Vite.Tmpl.update` method. */
export type ViteTmplWriteArgs = {
  force?: boolean;
  in?: t.StringDir;
  version?: t.StringSemver;
  silent?: boolean;
};

/** The response returned from an environment update. */
export type ViteTmplWriteResponse = { readonly ops: t.TmplFileOperation[] };

/** The response returned from the `Vite.Tmpl.prep` method */
export type ViteTmplPrepResponse = { readonly deps: t.EsmImportMap };
