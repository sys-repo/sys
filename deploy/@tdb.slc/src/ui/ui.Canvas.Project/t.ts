import type { t } from './common.ts';

/**
 * <Component>:
 */
export type CanvasProjectProps = {
  doc?: t.Crdt.Ref;
  video?: SampleVideo;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onCanvasClick?: React.MouseEventHandler;
};

export type SampleVideo = { src?: string };
