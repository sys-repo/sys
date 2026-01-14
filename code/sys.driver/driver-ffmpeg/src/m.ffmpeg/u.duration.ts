import { type t, DEFAULT, Process, Json, Is } from './common.ts';

export const duration: t.MediaDurationFn = async (path, opts = {}) => {
  const ffprobe = opts.ffprobe ?? DEFAULT.bin.ffprobe;

  try {
    const res = await Process.invoke({
      cmd: ffprobe,
      args: ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', String(path)],
      silent: true,
    });

    if (!res.success) {
      const errText = res.text.stderr || res.text.stdout || res.toString();
      const missing = isMissingBinaryError(errText);
      const unsupported = isUnsupportedFormatError(errText);
      return {
        ok: false,
        reason: missing ? 'missing-ffprobe' : unsupported ? 'unsupported-format' : 'probe-failed',
        error: errText,
      };
    }

    const text = res.text.stdout || res.toString() || '';
    const parsed = Json.safeParse(text);
    if (!parsed.ok) {
      return { ok: false, reason: 'parse-failed', error: parsed.error };
    }

    const secs = readDurationSeconds(parsed.data);
    if (secs === undefined) {
      return { ok: false, reason: 'parse-failed', error: text };
    }

    const msecs = Math.round(secs * 1000) as unknown as t.Msecs;
    return { ok: true, msecs };
  } catch (error) {
    const missing = isMissingBinaryError(error);
    return { ok: false, reason: missing ? 'missing-ffprobe' : 'probe-failed', error };
  }
};

/**
 * Helpers
 */

function readDurationSeconds(json: unknown): number | undefined {
  if (!json || !Is.record(json)) return undefined;

  type TFormat = { readonly format?: unknown };
  type TDuration = { readonly duration?: unknown };
  const format = (json as TFormat).format;
  if (!format || !Is.record(format)) return undefined;

  const dur = (format as TDuration).duration;
  if (Is.num(dur)) return Number.isFinite(dur) ? dur : undefined;
  if (Is.str(dur)) {
    const n = Number(dur);
    return Number.isFinite(n) ? n : undefined;
  }

  return undefined;
}

function isMissingBinaryError(err: unknown) {
  const msg = errorMessage(err);
  return (
    msg.includes('not found') ||
    msg.includes('enoent') ||
    msg.includes('no such file') ||
    msg.includes('cannot find')
  );
}

function isUnsupportedFormatError(err: unknown) {
  const msg = errorMessage(err);
  return (
    msg.includes('invalid data found') ||
    msg.includes('unknown format') ||
    msg.includes('could not find codec parameters') ||
    msg.includes('error reading header')
  );
}

function errorMessage(err: unknown) {
  return (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();
}
