import type { t } from './common.ts';

/**
 * Component: info-panel of composite spec.
 */
export type CompositeVideoSpecInfoProps = {
  /** Ordered pieces to stitch together. */
  videos?: t.Timecode.Composite.Spec;
  layout?: t.KeyValueLayout;
  size?: t.KeyValueSize;
  mono?: boolean;
  ellipsize?: number | [number, number];

  theme?: t.CommonTheme;
  style?: t.CssInput;
};
