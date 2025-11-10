import type { t } from './common.ts';

export type * from './t.props.ts';

/**
 * Composite video API surface.
 * Combines orchestration helpers with a renderable view component.
 */
export type CompositeVideoLib = {
  /** Renderable UI component */
  readonly View: t.FC<t.CompositeVideoProps>;

  /** Pure, programmatic operations for working with composite time-based media structures. */
  readonly Tools: t.TimecodeCompositeLib;
};
