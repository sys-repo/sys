import type { t } from './common.ts';

/**
 * WebVTT(-flexible) patterns.
 * - .timecode: MM:SS | HH:MM:SS | HH:MM:SS.mmm  (HH optional, .mmm optional)
 * - .slice:    "<from>..<to>" where bounds are timecode | "" (open) | "-timecode" (relEnd)
 */
export const Pattern: t.TimecodeLib['Pattern'] = {
  timecode: `^(?:\\d{2}:)?[0-5]\\d:[0-5]\\d(?:\\.\\d{3})?$`,
  slice: `^\\s*(?:(?:\\d{2}:)?[0-5]\\d:[0-5]\\d(?:\\.\\d{3})?|)\\s*\\.\\.\\s*(?:(?:\\d{2}:)?[0-5]\\d:[0-5]\\d(?:\\.\\d{3})?|-(?:\\d{2}:)?[0-5]\\d:[0-5]\\d(?:\\.\\d{3})?)\\s*$`,
};

/**
 * Internal:
 */
export const RE = {
  timecode: new RegExp(Pattern.timecode),
  slice: new RegExp(Pattern.slice),
} as const;
