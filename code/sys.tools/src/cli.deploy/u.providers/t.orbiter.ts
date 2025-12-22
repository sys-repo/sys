/**
 * Orbiter provider configuration.
 */
export type OrbiterProvider = {
  kind: 'orbiter';

  /** Stable site identifier used by Orbiter. */
  siteId: string;

  /** Logical domain / bucket name (eg "fs"). */
  domain: string;
};
