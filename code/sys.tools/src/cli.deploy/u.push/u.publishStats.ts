import { type t } from '../common.ts';

/** Helpers for provider-reported publish file results. */
export const PushPublishStats = {
  /** Merge provider publish results while preserving per-file detail order. */
  merge(stats: readonly (t.PushPublishStats | undefined)[]): t.PushPublishStats | undefined {
    const files = stats.flatMap((stat) => stat?.files ?? []);
    return files.length ? { files } : undefined;
  },

  /** Derive stable summary counts for reports from per-file details. */
  summary(stats?: t.PushPublishStats): t.PushPublishSummary {
    const files = stats?.files ?? [];
    let written = 0;
    let skipped = 0;

    for (const file of files) {
      switch (file.status) {
        case 'written':
          written += 1;
          break;
        case 'skipped':
          skipped += 1;
          break;
      }
    }

    return { total: files.length, written, skipped };
  },
} as const;
