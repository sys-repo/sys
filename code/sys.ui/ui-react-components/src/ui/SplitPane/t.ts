import type { t } from './common.ts';

/**
 * Component: SplitPane.
 * Minimal two-slot split using CSS Grid + usePointer.
 */
export type SplitPaneProps = {
  /** Pane content */
  children?: [React.ReactNode, React.ReactNode];
  /** Layout orientation. */
  orientation?: t.Orientation;
  /** Controlled ratio [0..1]. */
  value?: t.Percent;
  /** Uncontrolled initial ratio [0..1]. */
  defaultValue?: t.Percent;
  /** default 0.1. */
  min?: t.Percent;
  /** default 0.9. */
  max?: t.Percent;
  /** px, default 6. */
  gutter?: t.Pixels;
  /** Enabled state. */
  enabled?: boolean;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onChange?: (ratio: number) => void;
  onDragStart?: (ratio: number) => void;
  onDragEnd?: (ratio: number) => void;
};
