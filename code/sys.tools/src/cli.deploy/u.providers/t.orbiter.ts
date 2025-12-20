import type { t } from '../common.ts';

/**
 * Orbiter provider configuration.
 *
 * This payload is materialized as `orbiter.json`
 * inside the endpoint staging dir before execution.
 */
export type OrbiterProvider = {
  kind: 'orbiter';

  /** Stable site identifier used by Orbiter. */
  siteId: string;

  /** Logical domain / bucket name (eg "fs"). */
  domain: string;

  /**
   * Directory Orbiter serves from.
   * Relative to the endpoint staging dir.
   * Usually "dist".
   */
  buildDir: t.StringPath;

  /**
   * Optional build command.
   * Commonly "echo no-op" when build is handled upstream.
   */
  buildCommand?: string;
};
