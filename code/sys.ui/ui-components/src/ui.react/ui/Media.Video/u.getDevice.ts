import { type t } from './common.ts';

export const getDevice: t.MediaVideoLib['getDevice'] = async (stream, kind = 'videoinput') => {
  const [videoTrack] = stream.getVideoTracks();
  if (!videoTrack) return undefined;

  const { deviceId } = videoTrack.getSettings();
  if (!deviceId) return undefined; // NB: possibly permission not yet granted.

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.find((d) => d.kind === kind && d.deviceId === deviceId);
};
