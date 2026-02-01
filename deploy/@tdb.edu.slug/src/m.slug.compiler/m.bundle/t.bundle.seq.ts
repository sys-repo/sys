import type { t } from './common.ts';

/**
 * Media Sequence
 */
export type BundleSequenceDag = t.Graph.Dag.Result;
export type BundleSequenceFacet = t.SlugLintFacet;
export type BundleSequenceResult = t.LintSequenceFilepathResult & {
  readonly dir: {
    readonly base: t.StringDir;
    readonly manifests: t.StringDir;
    readonly video: t.StringDir;
    readonly image: t.StringDir;
  };
};

/**
 * Configuration
 */
export type SlugBundleMediaSeq = {
  readonly crdt: {
    readonly docid: t.StringId;
    readonly path: t.StringPath;
  };
  readonly target?: {
    readonly manifests?: {
      readonly base?: t.StringDir;
      readonly hrefBase?: t.StringUrl;
      readonly dir?: t.StringDir;
      readonly assets?: t.StringPath;
      readonly playback?: t.StringPath;
      readonly tree?: t.StringPath;
    };
    readonly media?: {
      readonly video?: {
        readonly base?: t.StringDir;
        readonly hrefBase?: t.StringUrl;
        readonly dir?: t.StringDir;
      };
      readonly image?: {
        readonly base?: t.StringDir;
        readonly hrefBase?: t.StringUrl;
        readonly dir?: t.StringDir;
      };
    };
  };
  readonly requirePlayback?: boolean;
};
