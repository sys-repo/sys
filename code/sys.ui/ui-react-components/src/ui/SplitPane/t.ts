import type { t } from './common.ts';
export type * from './t.SplitRatio.ts';

/**
 * Component: SplitPane (N panes).
 */
export type SplitPaneProps = {
  /** Panes in order. */
  children?: React.ReactNode[];

  /** Whether the split pane is currently draggable (resizable). */
  active?: boolean;

  /** Layout orientation. */
  orientation?: t.Orientation;

  /**
   * Controlled pane ratios. Must be same length as children.
   * Should sum to ~1. If omitted, `defaultValue` is used (uncontrolled).
   */
  value?: t.Percent[];

  /**
   * Uncontrolled initial ratios; normalized to sum to 1.
   * If omitted, divides evenly.
   */
  defaultValue?: t.Percent[];

  /**
   * Per-pane minimum ratio bounds. Single number applies to all.
   * Default: 0.
   */
  min?: t.Percent | t.Percent[];

  /**
   * Per-pane maximum ratio bounds. Single number applies to all.
   * Default: 1.
   */
  max?: t.Percent | t.Percent[];

  /** If set, render only this pane index and hide others (gutters inert). */
  onlyIndex?: t.Index;

  /** Uniform gutter width (px). */
  gutter?: t.Pixels;

  /** Visual line thickness within the gutter (px). */
  gutterLine?: t.Pixels;

  /** Visual line opacity [0..1]. */
  gutterOpacity?: t.Percent;

  // Common:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onChange?: (e: { ratios: t.Percent[]; activeGutter?: number }) => void;
  onDragStart?: (e: { ratios: t.Percent[]; activeGutter: number }) => void;
  onDragEnd?: (e: { ratios: t.Percent[]; activeGutter: number }) => void;
};
