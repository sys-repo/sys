export * from './u.Find.ts';
export * from './u.Print.ts';

/**
 * Collapse all whitespace into single spaces and trim ends.
 * Useful for robust string assertions that shouldn't break
 * on formatting differences (e.g. DOM/cssText).
 */
export const squash = (s = ''): string => s.replace(/\s+/g, ' ').trim();
