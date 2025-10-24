import type { t } from './common.ts';

/**
 * Component:
 */
export type VideoRecorderViewProps = Pick<t.LayoutProps, 'crdt' | 'header' | 'sidebar'> & {
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
export type VideoRecorderViewSignals = t.LayoutSignals & {
  readonly camera: t.Signal<MediaDeviceInfo | undefined>;
  readonly audio: t.Signal<MediaDeviceInfo | undefined>;
  readonly stream: t.Signal<MediaStream | undefined>;
  readonly recorder: t.Signal<t.MediaRecorderStatus | undefined>;
  readonly config: t.Signal<t.VideoRecorderConfig | undefined>;
};

/**
 * Configuration options for the MediaRecorder.
 */
export type VideoRecorderConfig = {
  readonly mimeType?: string;
  readonly videoBitsPerSecond?: number;
  readonly audioBitsPerSecond?: number;
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
