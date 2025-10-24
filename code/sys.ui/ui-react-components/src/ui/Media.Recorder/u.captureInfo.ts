import { type t, Delete } from './common.ts';

export const captureInfo = (stream: MediaStream): t.MediaRecorderCapture => {
  const track = stream.getVideoTracks?.()[0];
  const s = track?.getSettings?.() ?? {};
  return Delete.undefined({
    width: s.width,
    height: s.height,
    frameRate: s.frameRate,
    aspectRatio: s.aspectRatio,

    deviceId: s.deviceId,
    facingMode: s.facingMode,
    resizeMode: (s as any).resizeMode,

    displaySurface: (s as any).displaySurface,
    logicalSurface: (s as any).logicalSurface,
    cursor: (s as any).cursor,

    groupId: s.groupId,
    contentHint: track?.contentHint,
  });
};
