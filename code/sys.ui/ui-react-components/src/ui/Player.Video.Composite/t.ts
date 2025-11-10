import type { t } from './common.ts';

export type * from './t.composite.ts';
export type * from './t.helpers.ts';
export type * from './t.props.ts';

/**
 * Composite video API surface.
 * Combines orchestration helpers with a renderable view component.
 */
export type CompositeVideoLib = t.CompositeVideoHelpers & {
  /** Renderable UI component */
  readonly View: t.FC<t.CompositeVideoProps>;
};
