import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.media.seq.ts';
export type * from './t.tree.ts';
export type * from './u.profile.ts';

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
