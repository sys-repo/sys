/**
 * Orbiter provider configuration (YAML configuration).
 */
export type OrbiterProvider = {
  kind: 'orbiter';

  /** Stable site identifier used by Orbiter. */
  siteId: string;

  /** Logical domain / bucket name (eg "fs"). */
  domain: string;
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
