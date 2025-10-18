import { type t } from './common.ts';

export const Is: t.MediaIsLib = {
  /**
   * True if input is a MediaStream.
   * Uses instanceof when constructor exists; falls back to duck typing.
   */
  mediaStream(input?: unknown): input is MediaStream {
    return typeof MediaStream === 'function'
      ? input instanceof MediaStream
      : !!input && typeof input === 'object' && 'getTracks' in input;
  },

  /**
   * True if input looks like MediaStreamConstraints ({audio|video} in object)
   * and is not itself a MediaStream.
   */
  constraints(input?: unknown): input is MediaStreamConstraints {
    return (
      !!input &&
      typeof input === 'object' &&
      !Is.mediaStream(input) &&
      ('audio' in input || 'video' in input)
    );
  },

  /**
   * True if input looks like a MediaDeviceInfo.
   * Cross-realm safe duck type: requires deviceId + kind fields.
   */
  deviceInfo(input?: unknown): input is MediaDeviceInfo {
    return (
      !!input &&
      typeof input === 'object' &&
      'deviceId' in (input as Record<string, unknown>) &&
      'kind' in (input as Record<string, unknown>)
    );
  },

  /**
   * True if input looks like a MediaStreamTrack.
   * Requires id + kind + getSettings() function; avoids instanceof.
   */
  track(input?: unknown): input is MediaStreamTrack {
    return (
      !!input &&
      typeof input === 'object' &&
      'id' in (input as Record<string, unknown>) &&
      'kind' in (input as Record<string, unknown>) &&
      typeof (input as { getSettings?: unknown }).getSettings === 'function'
    );
  },
};
