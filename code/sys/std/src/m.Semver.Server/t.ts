import type { t } from './common.ts';

/**
 * Tools for working with Semver ("Semantic Versions").
 */
export type SemverServerLib = t.SemverLib & {
  /** Console formatting helpers. */
  readonly Fmt: t.SemverServerFmt;
};

/**
 * Console formatting helpers.
 */
export type SemverServerFmt = {
  colorize(version: t.StringSemver | t.Semver, options?: ColorizeOptions): string;
};

type ColorizeOptions = {
  highlight?: t.SemverReleaseType;
  baseColor?: t.WrapAnsiColor;
  prefixColor?: t.WrapAnsiColor;
  prereleaseColor?: t.WrapAnsiColor;
};
