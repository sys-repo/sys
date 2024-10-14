import type { t } from './common.ts';

/**
 * Tools for installing, monitoring and managing Quilibrium nodes.
 */
export type QNodeLib = {
  readonly Release: t.ReleaseLib;
};

/* Environment a release is being pulled for. */
export type ReleaseEnv = { readonly os: string; readonly arch: string };

/**
 * Tools for pulling and managing Quilbrium nodes releases.
 */
export type ReleaseLib = {
  /* Current environment settings used as defaults when pulling releases. */
  readonly env: ReleaseEnv;

  /* Pull latest release. */
  pull(options?: t.ReleaseOptions): Promise<ReleaseResponse>;
};

/* Options passed to the Release.pull method. */
export type ReleaseOptions = { os?: string; arch?: string; outDir?: string };

/* Response returned from the Release.pull() method. */
export type ReleaseResponse = {
  version: string;
  files: t.StringPath[];
  env: ReleaseEnv;
  is: { newRelease: boolean };
};
