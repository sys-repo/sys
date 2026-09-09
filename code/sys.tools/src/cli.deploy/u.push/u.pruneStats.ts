import { type t } from '../common.ts';

/** Helpers for provider-reported stale-file prune results. */
export const PushPruneStats = {
  /** Merge provider prune results while preserving per-file detail order. */
  merge(stats: readonly (t.PushPruneStats | undefined)[]): t.PushPruneStats | undefined {
    const files = stats.flatMap((stat) => stat?.files ?? []);
    return files.length ? { files } : undefined;
  },

  /** Derive stable summary counts for reports from per-file details. */
  summary(stats?: t.PushPruneStats): t.PushPruneSummary {
    const files = stats?.files ?? [];
    let removed = 0;

    for (const file of files) {
      switch (file.status) {
        case 'removed':
          removed += 1;
          break;
      }
    }

    return { total: files.length, removed };
  },
} as const;
