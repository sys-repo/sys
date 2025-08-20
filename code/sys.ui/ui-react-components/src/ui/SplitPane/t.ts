import type { t } from './common.ts';

/**
 * Component: SplitPane.
 */
export type SplitPaneProps = {
  /** Pane content */
  children?: [React.ReactNode, React.ReactNode];

  /** Enabled state. */
  enabled?: boolean;
  /** Layout orientation. */
  orientation?: t.Orientation;
  /** Controlled ratio [0..1]. */
  value?: t.Percent;
  /** Uncontrolled initial ratio [0..1]. */
  defaultValue?: t.Percent;
  /** Minmum size. */
  min?: t.Percent;
  /** Maximum size. */
  max?: t.Percent;

  /** Gutter offset size. */
  gutter?: t.Pixels;
  gutterOpacity?: t.Percent;
  gutterLine?: t.Pixels;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onChange?: t.SplitPaneChangeHandler;
  onDragStart?: t.SplitPaneChangeHandler;
  onDragEnd?: t.SplitPaneChangeHandler;
};

/**
 * Events:
 */

/** Change handlers: */
export type SplitPaneChangeHandler = (e: SplitPaneChange) => void;
/** Represents a change to the pane's position. */
export type SplitPaneChange = { ratio: t.Percent };
