import type { t } from '../../common.ts';

export type OrbiterConfig = {
  readonly siteId: string;
  readonly domain: string;
  readonly buildCommand: string;
  readonly buildDir: string;
};

export type OrbiterConfigDeps = {
  /**
   * Write UTF-8 text to a file path.
   * We keep this injected so `u.config.ts` stays pure/testable and doesn't
   * assume a specific FS helper exists in `common.ts`.
   */
  readonly writeText: (path: t.StringPath, text: string) => Promise<void>;
};
