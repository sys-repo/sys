import type { t } from '../common.ts';

/**
 * Orbiter provider configuration (YAML configuration).
 */
export type OrbiterProvider = {
  kind: 'orbiter';

  /** Stable site identifier used by Orbiter. */
  siteId: string;

  /** Logical domain / bucket name (eg "fs"). */
  domain: string;

  /**
   * Optional shard deployment config.
   * When present, shard-aware mappings can be expanded and validated.
   */
  shards?: {
    /** Total shard count (0..N-1). */
    total: number;
    /** Optional allowlist of shard indices to deploy. */
    only?: number[];
    /** Optional shard index → siteId map. */
    siteIds?: Record<number, t.StringUrl>;
  };
};

/**
 * Formal configuration (orbiter.json).
 */
export type OrbiterConfig = {
  readonly siteId: string;
  readonly domain: string;
  readonly buildCommand: string;
  readonly buildDir: string;
};
