import { type t, D, Try, logInfo } from './common.ts';

export type RecorderBitrate = {
  readonly videoBitsPerSecond: number;
  readonly audioBitsPerSecond: number;
};

/**
 * Create a high-quality, standards-compliant MediaRecorder for a given stream.
 *
 * - Negotiates the best supported mime type (VP9 → VP8 → WebM → MP4 fallback).
 * - Scales video bitrate based on actual capture resolution if not specified.
 * - Applies a gentle encoder hint for detail when supported.
 */
export const createMediaRecorder: t.CreateMediaRecorder = (stream, options = {}): MediaRecorder => {
  if (!stream) throw new Error('createMediaRecorder: missing stream');

  const mimeType = resolveBestMimeType(options.mimeType, D.mimeType);
  const { videoBitsPerSecond, audioBitsPerSecond } = resolveRecorderBitrates(stream, options);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond,
    audioBitsPerSecond,
  });

  // Nudge encoder for crispness.
  setContentHintDetail(stream);

  // Finish up.
  return recorder;
};

/**
 * Helpers:
 */
function setContentHintDetail(stream: MediaStream) {
  const { result } = Try.run(() => {
    const vt = stream.getVideoTracks?.()[0];
    if (vt && vt.contentHint !== 'detail') vt.contentHint = 'detail';
    return true as const;
  });
  if (result.ok) logInfo('set → contentHint=detail (encoder crispness)');
  else logInfo('contentHint=detail not applied', result.error);
}

/** Resolve final recorder bitrates from a stream, honoring explicit overrides. */
function resolveRecorderBitrates(
  stream: MediaStream,
  opts: t.MediaRecorderOptions,
): RecorderBitrate {
  const track = stream.getVideoTracks?.()[0];
  const s = track?.getSettings?.() ?? {};
  const w = typeof s.width === 'number' ? s.width : 0;
  const h = typeof s.height === 'number' ? s.height : 0;
  const px = w * h;

  return {
    videoBitsPerSecond: opts.videoBitsPerSecond ?? adaptiveVideoBitrate(px, D.videoBitsPerSecond),
    audioBitsPerSecond: opts.audioBitsPerSecond ?? D.audioBitsPerSecond,
  } as const;
}

/** Return an adaptive video bitrate (bps) from pixel area with sane thresholds. */
function adaptiveVideoBitrate(px: number, fallback: number): number {
  if (px >= 2560 * 1440) return 14_000_000; //  1440p+
  if (px >= 1920 * 1080) return 10_000_000; //  1080p
  if (px >= 1280 * 720) return 6_000_000; //    720p
  return fallback;
}

/**
 * Determine the best supported MIME type for MediaRecorder recording.
 * Order of preference:
 *   1. Explicit user-provided value (if supported)
 *   2. VP9
 *   3. VP8
 *   4. Generic WebM
 *   5. MP4 (Safari fallback)
 */
function resolveBestMimeType(
  userMimeType?: string,
  fallback: string = 'video/webm;codecs=vp9,opus',
): string {
  const candidates: readonly string[] = [
    userMimeType ?? fallback,
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4;codecs=h264,aac', // Safari (explicit)
    'video/mp4', //                 Safari (generic)
  ];

  const isSupported =
    typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
      ? (m: string) => MediaRecorder.isTypeSupported(m)
      : () => true;

  return candidates.find(isSupported) ?? candidates[candidates.length - 1];
}
