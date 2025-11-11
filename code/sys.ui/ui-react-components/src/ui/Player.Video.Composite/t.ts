import type { t } from './common.ts';

export type * from './t.props.ts';
export type * from './t.props.video.ts';

/**
 * Composite video API surface.
 * Combines orchestration helpers with a renderable view component.
 */
export type CompositeVideoLib = {
  /** Pure, programmatic operations for working with composite time-based media structures. */
  readonly Tools: t.TimecodeCompositeLib;

  /** Renderable UI components. */
  readonly View: {
    readonly Video: t.FC<t.CompositeVideoProps>;
    readonly SpecInfo: t.FC<t.CompositeVideoSpecInfoProps>;
  };
};
