import type { t } from './common.ts';

/** Progress events emitted while a bundle run is executing. */
export type BundleRunProgress =
  | { stage: 'media:seq'; current: number; total: number; docid: t.Crdt.Id }
  | { stage: 'slug-tree:fs' }
  | { stage: 'slug:fs:yaml'; current: number; total: number; docid: t.Crdt.Id };

/** Per-document summary emitted by a bundle run. */
export type BundleRunDocSummary = {
  readonly docid: t.Crdt.Id;
  readonly issues: {
    readonly total: number;
    readonly byKind: ReadonlyMap<string, number>;
  };
};

/** Aggregate summary for a completed bundle run. */
export type BundleRunSummary = {
  readonly warnings: readonly string[];
  readonly mediaSeq?: {
    readonly total: number;
    readonly bundled: number;
    readonly docs: readonly BundleRunDocSummary[];
    readonly elapsed: t.Msecs;
  };
  readonly slugTreeFs?: { readonly ran: boolean } & t.SlugBundleFileTreeStats;
  readonly slugFsYaml?: {
    readonly total: number;
    readonly written: number;
    readonly elapsed: t.Msecs;
    readonly dir: t.StringDir;
  };
};
