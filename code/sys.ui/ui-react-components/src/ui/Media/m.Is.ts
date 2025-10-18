import { type t } from './common.ts';

export const Is: t.MediaIsLib = {
  mediaStream(input?: unknown): input is MediaStream {
    return typeof MediaStream === 'function'
      ? input instanceof MediaStream
      : !!input && typeof input === 'object' && 'getTracks' in input;
  },

  constraints(input?: unknown): input is MediaStreamConstraints {
    return (
      !!input &&
      typeof input === 'object' &&
      !Is.mediaStream(input) &&
      ('audio' in input || 'video' in input)
    );
  },

  deviceInfo(input?: unknown): input is MediaDeviceInfo {
    if (!input || typeof input !== 'object') return false;
    const o = input as Record<string, unknown>;
    if (typeof o.deviceId !== 'string') return false;
    if (!isMediaDeviceKind(o.kind)) return false;
    if ('label' in o && o.label !== undefined && typeof o.label !== 'string') return false;
    if ('groupId' in o && o.groupId !== undefined && typeof o.groupId !== 'string') return false;
    return true;
  },

  track(input?: unknown): input is MediaStreamTrack {
    if (!input || typeof input !== 'object') return false;
    const o = input as Record<string, unknown>;
    if (!isTrackKind(o.kind)) return false;
    if (typeof o.id !== 'string') return false;
    if (typeof (o as { getSettings?: unknown }).getSettings !== 'function') return false;
    return true;
  },
};

/**
 * Helpers:
 */
const isTrackKind = (k: unknown): k is 'audio' | 'video' => k === 'audio' || k === 'video';
const isMediaDeviceKind = (k: unknown): k is MediaDeviceKind =>
  k === 'audioinput' || k === 'audiooutput' || k === 'videoinput';
