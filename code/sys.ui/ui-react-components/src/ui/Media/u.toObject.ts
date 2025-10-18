/**
 * @module
 * Plain-object snapshots of Web Media primitives.
 *
 * Exports:
 * - ToObject: { device, track, stream }
 * - toObject(input): routed single entry
 */

import { type t } from './common.ts';
import { Is } from './m.Is.ts';

/**
 * Device → POJO
 */
export const toDeviceObject = (
  device?: MediaDeviceInfo,
  opts?: t.MediaToObjectOptions,
): t.DeviceObject | undefined => {
  if (!device) return;
  const { maxLabel = 32 } = opts ?? {};
  const o: t.DeviceObject = {
    deviceId: device.deviceId,
    kind: device.kind,
    label: trim(device.label, maxLabel),
    groupId: device.groupId || undefined,
  };
  return compact(o);
};

/**
 * Track → POJO
 */
export const toTrackObject = (
  track?: MediaStreamTrack,
  opts?: t.MediaToObjectOptions,
): t.TrackObject | undefined => {
  if (!track) return;
  const { maxLabel = 32 } = opts ?? {};

  const settings = (() => {
    const st = track.getSettings?.() ?? {};
    const out: t.TrackSettingsCore = {
      deviceId: st.deviceId,
      // Some UAs expose groupId in settings (non-standard but useful):
      groupId: (st as { groupId?: string }).groupId,
      width: st.width,
      height: st.height,
      frameRate: st.frameRate,
      aspectRatio: st.aspectRatio,
      facingMode: st.facingMode,
      sampleRate: st.sampleRate,
      sampleSize: st.sampleSize,
      channelCount: st.channelCount,
      echoCancellation: st.echoCancellation,
      noiseSuppression: st.noiseSuppression,
      autoGainControl: st.autoGainControl,
    };
    return compact(out);
  })();

  const muted = (track as unknown as { muted?: boolean }).muted ?? false;

  const o: t.TrackObject = {
    id: track.id,
    kind: track.kind as 'audio' | 'video',
    label: trim(track.label, maxLabel),
    enabled: track.enabled,
    muted,
    readyState: track.readyState,
    settings: Object.keys(settings).length ? settings : undefined,
  };
  return compact(o);
};

/**
 * Stream → POJO
 */
export const toStreamObject = (
  stream?: MediaStream,
  opts?: t.MediaToObjectOptions,
): t.StreamObject | undefined => {
  if (!stream) return;

  const map = (ts: MediaStreamTrack[]) =>
    ts.map((tr) => toTrackObject(tr, opts)).filter(Boolean) as readonly t.TrackObject[];

  const audio = map(stream.getAudioTracks?.() ?? []);
  const video = map(stream.getVideoTracks?.() ?? []);

  const o: t.StreamObject = {
    id: stream.id,
    active: stream.active,
    audio: { count: audio.length, tracks: audio },
    video: { count: video.length, tracks: video },
  };
  return o;
};

/**
 * Public sub-lib mounted at Media.ToObject
 */
export const ToObject = {
  device: toDeviceObject,
  track: toTrackObject,
  stream: toStreamObject,
} satisfies t.MediaToObjectLib;

/**
 * Routed single entry mounted at Media.toObject
 */
export function toObject(input: MediaDeviceInfo, opts?: t.MediaToObjectOptions): t.DeviceObject;
export function toObject(input: MediaStream, opts?: t.MediaToObjectOptions): t.StreamObject;
export function toObject(input: MediaStreamTrack, opts?: t.MediaToObjectOptions): t.TrackObject;
export function toObject(input?: t.AnyMedia, opts?: t.MediaToObjectOptions): t.AnyMediaObject;
export function toObject(input?: t.AnyMedia, opts?: t.MediaToObjectOptions): t.AnyMediaObject {
  if (!input) return undefined;
  if (isDeviceInfo(input)) return toDeviceObject(input, opts)!;
  if (Is.mediaStream(input)) return toStreamObject(input, opts)!; // ← use existing Is
  if (isTrack(input)) return toTrackObject(input, opts)!;
  return undefined;
}

/**
 * Helpers:
 */
const trim = (s: string | undefined, max = 32) => (s && s.length > max ? `${s.slice(0, max)}…` : s);
const compact = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

/**
 * Guards (duck-typed for device/track; stream delegates to Is.mediaStream)
 */
const isDeviceInfo = (v: unknown): v is MediaDeviceInfo =>
  !!v &&
  typeof v === 'object' &&
  'deviceId' in (v as Record<string, unknown>) &&
  'kind' in (v as Record<string, unknown>);

const isTrack = (v: unknown): v is MediaStreamTrack =>
  !!v &&
  typeof v === 'object' &&
  'id' in (v as Record<string, unknown>) &&
  'kind' in (v as Record<string, unknown>) &&
  typeof (v as { getSettings?: unknown }).getSettings === 'function';
