import { Is, type t } from './common.ts';

/**
 * Normalize a number or string to a bounded 0..1 percentage.
 */
export function normalize(input?: string | number): t.Percent {
  if (Is.number(input)) return unit(input);
  if (Is.string(input)) {
    const text = input.trim();
    if (!text) return 0;
    const scalar = text.endsWith('%') ? Number(text.replace(/%$/, '')) / 100 : Number(text);
    return unit(scalar);
  }
  return 0;
}

/**
 * Normalize a value, then constrain it by optional min/max percent bounds.
 */
export function clamp(value?: string | number, min?: string | number, max?: string | number): t.Percent {
  let percent = normalize(value);
  if (min !== undefined) percent = Math.max(normalize(min), percent);
  if (max !== undefined) percent = Math.min(normalize(max), percent);
  return normalize(percent);
}

function unit(value: number): t.Percent {
  if (!Is.number(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
