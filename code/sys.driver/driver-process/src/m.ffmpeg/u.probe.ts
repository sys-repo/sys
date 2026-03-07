import { type t, DEFAULT } from './common.ts';
import { checkVersion, isMissingBinaryError } from '../u.probe/mod.ts';

export const probe: t.FfmpegProbeFn = async (opts = {}) => {
  const bin = {
    ffprobe: opts.bin?.ffprobe ?? DEFAULT.bin.ffprobe,
    ffmpeg: opts.bin?.ffmpeg ?? DEFAULT.bin.ffmpeg,
  };

  const ffprobe = await checkVersion(bin.ffprobe);
  if (!ffprobe.ok) {
    const missing = isMissingBinaryError(ffprobe.error);
    return {
      ok: false,
      reason: missing ? 'missing-ffprobe' : 'spawn-failed',
      hint: hintInstall('ffprobe'),
      error: ffprobe.error,
    };
  }

  const requireFfmpeg = opts.requireFfmpeg ?? false;
  if (requireFfmpeg) {
    const ffmpeg = await checkVersion(bin.ffmpeg);
    if (!ffmpeg.ok) {
      const missing = isMissingBinaryError(ffmpeg.error);
      return {
        ok: false,
        reason: missing ? 'missing-ffmpeg' : 'spawn-failed',
        hint: hintInstall('ffmpeg'),
        error: ffmpeg.error,
      };
    }

    return { ok: true, bin: { ffprobe: bin.ffprobe, ffmpeg: bin.ffmpeg } };
  }

  return { ok: true, bin: { ffprobe: bin.ffprobe } };
};

/**
 * Helpers
 */
function hintInstall(name: 'ffprobe' | 'ffmpeg') {
  return name === 'ffprobe'
    ? 'ffprobe not found. Install FFmpeg (ffprobe ships with it) and ensure it is on PATH.'
    : 'ffmpeg not found. Install FFmpeg and ensure it is on PATH.';
}
