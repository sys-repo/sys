/**
 * @module
 * Tools for working with video streams.
 */
import { type t } from './common.ts';
import { AspectRatio } from './m.AspectRatio.ts';
import { getStream } from './u.getStream.ts';
import { VideoStream as View } from './ui.tsx';
export { useVideoStream } from './use.VideoStream.ts';

export const VideoStream: t.VideoStreamLib = {
  AspectRatio,
  View,
  getStream,
};
