import type { t } from './common.ts';
import type { SlugTreeFsStats } from './t.bundle.tree.ts';

export type BundleRunProgress =
  | { stage: 'media:seq'; current: number; total: number; docid: t.Crdt.Id }
  | { stage: 'slug-tree:fs' };

export type BundleRunDocSummary = {
  readonly docid: t.Crdt.Id;
  readonly issues: {
    readonly total: number;
    readonly byKind: ReadonlyMap<string, number>;
  };
};

export type BundleRunSummary = {
  readonly warnings: readonly string[];
  readonly mediaSeq?: {
    readonly total: number;
    readonly bundled: number;
    readonly docs: readonly BundleRunDocSummary[];
  };
  readonly slugTreeFs?: { readonly ran: boolean } & SlugTreeFsStats;
};
