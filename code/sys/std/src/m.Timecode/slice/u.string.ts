import { type t, Duration } from '../common.ts';
import type { TimecodeSliceBound, TimeWindow } from './t.ts';
import { is } from './u.is.ts';
import { parse } from './u.parse.ts';
import { resolve } from './u.resolve.ts';
import { toHms } from './u.ts';

/**
 * Render a slice to its canonical string form.
 * - Accepts either a parsed struct or a raw slice string.
 * - For raw strings: trims and normalizes spacing around the ".." delimiter.
 *   (No validation beyond single-delimiter split.)
 */
export const toString: t.TimecodeSliceLib['toString'] = (slice = '') => {
  if (typeof slice === 'string') {
    const raw = slice.trim();
    const i = raw.indexOf('..');
    if (i < 0) return '' as t.TimecodeSliceString;
    const a = raw.slice(0, i).trim();
    const b = raw.slice(i + 2).trim();
    return `${a}..${b}` as t.TimecodeSliceString;
  }

  const fmt = (b: TimecodeSliceBound): string => {
    switch (b.kind) {
      case 'open':
        return '';
      case 'abs':
        return toHms(b.ms);
      case 'relEnd':
        return `-${toHms(b.ms)}`;
    }
  };

  return `${fmt(slice.start)}..${fmt(slice.end)}` as t.TimecodeSliceString;
};

/**
 * Build a canonical slice string from a concrete window.
 * - If `total` provided: emit open start when from===0, open end when to===total.
 * - Otherwise: emit absolute HH:MM:SS(.mmm) for both ends.
 * - Prefers explicit end when start is open (avoids returning just "..").
 */
export const from: t.TimecodeSliceLib['from'] = (window: TimeWindow, total?: t.Msecs) => {
  const { from, to } = window;
  const hasTotal = typeof total === 'number';
  const openStart = hasTotal && Number(from) === 0;
  const openEnd = hasTotal && Number(to) === Number(total);

  const a = openStart ? '' : toHms(from);
  const b = openEnd && !openStart ? '' : toHms(to);
  return `${a}..${b}` as t.TimecodeSliceString;
};

/**
 * Split a slice string (e.g. "00:00:05..00:00:10", "..00:00:10", "00:00:05..")
 * into friendly {start,end} parts without validation.
 */
export const split: t.TimecodeSliceLib['split'] = (input) => {
  // Normalize to a canonical string first (supports raw string or parsed slice)
  const s = typeof input === 'string' ? input.trim() : input ? toString(input) : '';
  if (!s) return { start: '', end: '' };

  const i = s.indexOf('..');
  if (i < 0) return { start: '', end: '' };

  const start = s.slice(0, i).trim();
  const end = s.slice(i + 2).trim();

  return {
    start: start || '',
    end: end || '',
  };
};

/**
 * Compute duration between slice bounds.
 */
export const duration: t.TimecodeSliceLib['duration'] = (input, opts = {}) => {
  const { total, unit, round } = opts;
  const parsed = ensureParsed(input);
  if (!parsed) return undefined;

  const win = resolveWindow(parsed, total);
  if (!win) return undefined;

  const ms = Math.max(0, Number(win.to) - Number(win.from)) as t.Msecs;
  const text =
    unit != null ? Duration.format(ms, unit, round ?? 0) : Duration.create(ms).toString({ round });

  return { ms, text };
};

/**
 * Compute formatted start/end summaries for a slice.
 * - Returns undefined if slice cannot be resolved.
 */
export const positions: t.TimecodeSliceLib['positions'] = (input, opts = {}) => {
  const { total, round } = opts;
  const parsed = ensureParsed(input);
  if (!parsed) return undefined;

  const win = resolveWindow(parsed, total);
  if (!win) return undefined;

  const start = Duration.create(win.from, { round }).toString({ round });
  const end = Duration.create(win.to, { round }).toString({ round });
  return { start, end };
};

/**
 * Helpers:
 */
function ensureParsed(
  input: string | t.TimecodeSliceNormalized,
): t.TimecodeSliceNormalized | undefined {
  if (typeof input !== 'string') return input;
  if (!is(input)) return undefined;
  return parse(input);
}

function needsTotal(slice: t.TimecodeSliceNormalized): boolean {
  return slice.start.kind !== 'abs' || slice.end.kind !== 'abs';
}

function resolveWindow(
  slice: t.TimecodeSliceNormalized,
  total?: t.Msecs,
): t.TimeWindow | undefined {
  if (!needsTotal(slice)) {
    // Both absolute: resolve without total.
    const a = Number((slice.start as Extract<t.TimecodeSliceBound, { kind: 'abs' }>).ms);
    const b = Number((slice.end as Extract<t.TimecodeSliceBound, { kind: 'abs' }>).ms);
    const from = Math.min(a, b) as t.Msecs;
    const to = Math.max(a, b) as t.Msecs;
    return { from, to };
  }

  if (typeof total !== 'number') return undefined;
  return resolve(slice, total);
}
