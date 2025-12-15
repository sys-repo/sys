import * as t from './t.ts';
import { Fs, Cli } from './libs.ts';
import { Fmt } from './u.fmt.ts';

type Recency = { lastUsedAt?: t.UnixTimestamp; createdAt?: t.UnixTimestamp };

/**
 * Base config file heleprs.
 */
export const Config = {
  /**
   * Entry-gate normalization for a configuration file.
   */
  async prepare(toolname: string, filename: string, cwd?: t.StringDir) {
    cwd = cwd ?? Fs.cwd('terminal');
    const path = Fs.join(cwd, filename);

    if (!(await Fs.exists(path))) {
      console.info(Fmt.Prereqs.folderNotConfigured(cwd, toolname));
      const yes = await Cli.Prompt.Confirm.prompt({ message: `Create config file now?` });
      if (!yes) Deno.exit(0);
    }

    return { path };
  },

  /**
   * Returns a new list ordered by:
   *   1. Most recent `lastUsedAt` (descending)
   *   2. For items without `lastUsedAt`: most recent `createdAt` (descending)
   *   Items missing both timestamps are placed last.
   */
  orderByRecency<T extends Recency>(items: T[] = []): T[] {
    return [...items].sort((a, b) => {
      const A = a.lastUsedAt;
      const B = b.lastUsedAt;

      // Primary: lastUsedAt if either has one.
      if (A != null || B != null) {
        const LA = A ?? 0;
        const LB = B ?? 0;
        if (LA !== LB) return LB - LA; // descending
      }

      // Secondary: createdAt
      const CA = a.createdAt ?? 0;
      const CB = b.createdAt ?? 0;
      return CB - CA; // descending
    });
  },
} as const;
