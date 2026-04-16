import type { t } from './common.ts';

/**
 * Authored slug YAML dataset export.
 */
export type SlugBundleDocYaml = {
  readonly crdt: {
    readonly docid: t.StringId;
    readonly path: t.StringPath;
  };
  readonly target: {
    readonly dir: t.StringDir;
    readonly filenames?: {
      readonly mode?: 'docid';
    };
  };
};

export type BundleSlugDocYamlResult = {
  readonly dir: t.StringDir;
  readonly written: readonly t.StringFile[];
};
