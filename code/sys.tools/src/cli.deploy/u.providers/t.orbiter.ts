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
};
