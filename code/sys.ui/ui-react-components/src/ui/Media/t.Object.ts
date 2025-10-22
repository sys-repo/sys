import type { t } from './common.ts';

/**
 * @module
 * Types for converting Web Media primitives into plain objects.
 * - Media.ToObject.{device,track,stream}
 * - Media.toObject(...) routed single entry
 */

/**
 * Options:
 */
export type MediaToObjectOptions = {
  readonly maxLabel?: number;
};

/**
 * Device snapshot (plain JSON-safe object).
 */
export type DeviceObject = {
  readonly deviceId: string;
  readonly kind: MediaDeviceKind;
  readonly label?: string;
  readonly groupId?: string;
};

/**
 * Subset of high-signal track settings.
 * Keep compact to avoid UA noise and remain serializable.
 */
export type TrackSettingsCore = {
  readonly deviceId?: string;
  readonly groupId?: string;
  readonly width?: number;
  readonly height?: number;
  readonly frameRate?: number;
  readonly aspectRatio?: number;
  readonly facingMode?: string;
  readonly sampleRate?: number;
  readonly sampleSize?: number;
  readonly channelCount?: number;
  readonly echoCancellation?: boolean;
  readonly noiseSuppression?: boolean;
  readonly autoGainControl?: boolean;
};

/**
 * Track snapshot.
 */
export type TrackObject = {
  readonly id: string;
  readonly kind: 'audio' | 'video';
  readonly label?: string;
  readonly enabled: boolean;
  readonly muted: boolean;
  readonly readyState: MediaStreamTrackState;
  readonly settings?: TrackSettingsCore;
};

/**
 * Stream snapshot.
 */
export type StreamObject = {
  readonly id: string;
  readonly active: boolean;
  readonly audio: {
    readonly count: number;
    readonly tracks: readonly TrackObject[];
  };
  readonly video: {
    readonly count: number;
    readonly tracks: readonly TrackObject[];
  };
};

/**
 * Union helpers.
 */
export type AnyMedia = MediaDeviceInfo | MediaStream | MediaStreamTrack | undefined | null;

export type AnyMediaObject = DeviceObject | TrackObject | StreamObject | undefined;

/**
 * Sub-library shape mounted at Media.ToObject.
 * Explicit per-type converters.
 */
export type MediaToObjectLib = {
  readonly device: (d?: MediaDeviceInfo, opts?: MediaToObjectOptions) => DeviceObject | undefined;
  readonly track: (t?: MediaStreamTrack, opts?: MediaToObjectOptions) => TrackObject | undefined;
  readonly stream: (s?: MediaStream, opts?: MediaToObjectOptions) => StreamObject | undefined;
};

/**
 * Routed single entry mounted at Media.toObject.
 * Overloads preserve strong result typing at call-site.
 */
export type MediaToObjectRoute = {
  (input: MediaDeviceInfo, opts?: MediaToObjectOptions): DeviceObject;
  (input: MediaStream, opts?: MediaToObjectOptions): StreamObject;
  (input: MediaStreamTrack, opts?: MediaToObjectOptions): TrackObject;
  (input?: AnyMedia, opts?: MediaToObjectOptions): AnyMediaObject;
};
