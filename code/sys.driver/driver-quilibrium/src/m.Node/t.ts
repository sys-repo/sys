import type { t } from './common.ts';

/**
 * Tools for installing, monitoring and managing Quilibrium nodes.
 */
export type QNodeLib = {
  /** Tools for pulling and managing Quilbrium nodes releases. */
  readonly Release: t.ReleaseLib;
};

/**
 * Environment a release is being pulled for.
 */
export type ReleaseEnv = {
  /** Operating system type */
  readonly os: string;
  /** Architecutre type */
  readonly arch: string;
};

/**
 * Tools for pulling and managing Quilbrium nodes releases.
 */
export type ReleaseLib = {
  /** Current environment settings used as defaults when pulling releases. */
  readonly env: ReleaseEnv;

  /** Pull latest release. */
  pull(options?: t.ReleaseOptions): Promise<ReleasePullResponse>;
};

/**
 * Options passed to the `Release.pull` method.
 */
export type ReleaseOptions = {
  os?: string;
  arch?: string;
  outDir?: string;
  rootDir?: t.StringPath;
  force?: boolean; // force download if already exists.
};

/**
 * Response returned from the Release.pull() method.
 */
export type ReleasePullResponse = {
  /** Version pulled, or "" empty if nothing was pulled */
  version: string;
  /** The paths to the downloaded binaries. */
  files: t.StringPath[];
  /** The environment flags used during the pull operations */
  env: ReleaseEnv;
  /** Flags. */
  is: { newRelease: boolean };
};
