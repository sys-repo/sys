import { type t, DEFAULT, Process } from './common.ts';

export const probe: t.FfmpegProbeFn = async (opts = {}) => {
  const bin = {
    ffprobe: opts.bin?.ffprobe ?? DEFAULT.bin.ffprobe,
    ffmpeg: opts.bin?.ffmpeg ?? DEFAULT.bin.ffmpeg,
  };

  const ffprobe = await check(bin.ffprobe);
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
    const ffmpeg = await check(bin.ffmpeg);
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

function isMissingBinaryError(err: unknown) {
  const msg = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();
  return (
    msg.includes('not found') ||
    msg.includes('enoent') ||
    msg.includes('no such file') ||
    msg.includes('cannot find') ||
    msg.includes('spawn')
  );
}

async function check(cmd: string): Promise<{ ok: true } | { ok: false; error: unknown }> {
  try {
    const res = await Process.invoke({ cmd, args: ['-version'], silent: true });
    if (res.success) return { ok: true };
    return { ok: false, error: res.text.stderr || res.text.stdout || res.toString() };
  } catch (error) {
    return { ok: false, error };
  }
}
