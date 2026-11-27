import type { t } from './common.ts';

/**
 * Component: Elapsed Time (Debug).
 */
export type ElapsedTimeProps = {
  video?: t.VideoPlayerSignals;
  abs?: t.CssEdges.Input | boolean;
  show?: boolean;
  style?: t.CssInput;
};
