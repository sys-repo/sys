import type { t } from './common.ts';

export type LintMediaSeqBundle = {
  readonly target?: {
    readonly base?: t.StringDir;
    readonly hrefBase?: t.StringUrl;
    readonly manifests?: {
      readonly dir?: t.StringDir;
      readonly assets?: t.StringPath;
      readonly playback?: t.StringPath;
      readonly tree?: t.StringPath;
    };
    readonly media?: {
      readonly video?: t.StringPath;
      readonly image?: t.StringPath;
    };
  };
  readonly requirePlayback?: boolean;
};
