import type { t } from './common.ts';

/**
 * Component:
 */
export type VideoRecorderViewProps = Pick<t.CrdtLayoutProps, 'crdt' | 'header' | 'sidebar'> & {
  signals?: t.VideoRecorderViewSignals;
  aspectRatio?: string | number;
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

/**
 * Media device constraint helpers.
 * - Requests 4:3 video.
 * - Requests low-latency, raw audio (DSP off by default).
 * - Feature-detects `latency` constraint to avoid TS/dom errors.
 */
export type AudioConstraints = MediaTrackConstraints & {
  readonly latency?: number | ConstrainDoubleRange;
};
