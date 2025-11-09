import type { t } from './common.ts';

export const format: t.TimecodeLib['format'] = (ms: number, opts = {}): t.VttTimecode => {
  const { withMillis = false, forceHours = false } = opts;

  if (!Number.isFinite(ms) || ms < 0) {
    throw new Error('format: ms must be a non-negative finite number');
  }

  const whole = Math.floor(ms);
  const msec = whole % 1000;
  let totalSeconds = (whole - msec) / 1000;
  const ss = totalSeconds % 60;
  totalSeconds = (totalSeconds - ss) / 60;
  const mm = totalSeconds % 60;
  const hh = (totalSeconds - mm) / 60;

  const base = hh > 0 || forceHours ? `${two(hh)}:${two(mm)}:${two(ss)}` : `${two(mm)}:${two(ss)}`;
  const out = withMillis ? `${base}.${ms3(msec)}` : base;

  // Constructed string is guaranteed to match PATTERN.
  return out as t.VttTimecode;
};

/**
 * Helpers:
 */

/** Two-digit zero pad. */
function two(n: number) {
  return n < 10 ? '0' + n : '' + n;
}

/** Three-digit zero pad. */
function ms3(n: number) {
  return n < 10 ? '00' + n : n < 100 ? '0' + n : '' + n;
}
