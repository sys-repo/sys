import type { t } from './common.ts';

/**
 * Component:
 */
export type VideoRecorderViewProps = Pick<t.CrdtLayoutProps, 'header' | 'sidebar' | 'repo'> & {
  signals?: t.VideoRecorderViewSignals;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onStreamError?: t.MediaVideoStreamProps['onError'];
};

/**
 * State wrapped in signals.
 */
export type VideoRecorderViewSignals = t.CrdtLayoutSignals & {
  camera: t.Signal<MediaDeviceInfo | undefined>;
  audio: t.Signal<MediaDeviceInfo | undefined>;
  stream: t.Signal<MediaStream | undefined>;
};
