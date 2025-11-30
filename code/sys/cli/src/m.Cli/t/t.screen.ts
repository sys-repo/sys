import type { t } from '../common.ts';

/**
 * Tools for working with a terminal screen.
 */
export type CliScreenLib = {
  /**
   * Measure the terminal’s current width and height in character cells.
   */
  size(): t.CliSize;
};

/** Current terminal dimensions in character cells. */
export type CliSize = {
  readonly width: number;
  readonly height: number;
};
