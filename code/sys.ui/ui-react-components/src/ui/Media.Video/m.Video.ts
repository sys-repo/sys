/**
 * @module
 * Tools for working with video streams.
 */
import { type t } from './common.ts';
import { AspectRatio } from './m.AspectRatio.ts';
import { getStream } from './u.getStream.ts';
import { VideoStream as Stream } from './ui.tsx';
import { useVideoStream } from './use.VideoStream.ts';
import { getDevice } from './u.getDevice.ts';

export const Video: t.MediaVideoLib = {
  UI: { Stream, useVideoStream },
  AspectRatio,
  getStream,
  getDevice,
};
