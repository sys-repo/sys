export * from '../common.ts';

export { Delete } from '../m.Delete/mod.ts';

/**
 * WebVTT(-flexible)
 * Regex: MM:SS | HH:MM:SS | HH:MM:SS.mmm (HH optional, .mmm optional).
 */
export const PATTERN = '^(?:\\d{2}:)?[0-5]\\d:[0-5]\\d(?:\\.\\d{3})?$';
export const RE = new RegExp(PATTERN);
