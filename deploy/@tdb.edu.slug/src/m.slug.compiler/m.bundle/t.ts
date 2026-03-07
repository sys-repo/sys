import type { t } from './common.ts';

/** Type re-exports. */
export type * from './m.bundle.slug-tree.fs/t.ts';
export type * from './m.bundle.slug-tree.media-seq/t.ts';
export type * from './t.bundle.ts';
export type * from './t.menu.ts';
export type * from './t.run.ts';

/**
 * Bundler tools
 */
export type SlugBundleLib = {
  readonly validate: (args: { path: t.StringFile }) => Promise<t.BundleConfigValidation>;
  readonly run: (args: {
    cwd: t.StringDir;
    cmd: t.Crdt.Cmd.Client;
    interactive?: boolean;
  }) => Promise<t.MenuResult>;
};

export type BundleConfigValidation = {
  ok: boolean;
  errors: readonly t.ValueError[];
};
