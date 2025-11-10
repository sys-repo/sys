import type { t } from './common.ts';

export type * from './t.composite.ts';
export type * from './t.helpers.ts';

/**
 * Composite video API surface.
 * Combines orchestration helpers with a renderable view component.
 */
export type CompositeVideoLib = t.CompositeVideoHelpers & {
  /** Renderable UI component */
  readonly View: t.FC<CompositeVideoProps>;
};

/**
 * Component:
 */
export type CompositeVideoProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
