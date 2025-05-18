import { type t } from './common.ts';

/**
 * CSS Selectors Level 3 pseudo‑classes.
 * https://www.w3.org/TR/selectors-3
 */
export const level3 = [
  ':hover',
  ':active',
  ':focus',
  ':visited',
  ':link',
  ':target',
  ':checked',
  ':disabled',
  ':enabled',
  ':first-child',
  ':last-child',
  ':only-child',
  ':nth-child',
  ':nth-last-child',
  ':first-of-type',
  ':last-of-type',
  ':only-of-type',
  ':empty',
  ':root',
  ':not',
  ':lang',
] as const;

/**
 * CSS Selectors Level 4 pseudo‑classes (and newer form/structural pseudo‑classes).
 * https://www.w3.org/TR/selectors-4
 */
export const level4 = [
  ':focus-visible',
  ':focus-within',
  ':any-link',
  ':default',
  ':indeterminate',
  ':in-range',
  ':invalid',
  ':optional',
  ':out-of-range',
  ':placeholder-shown',
  ':read-only',
  ':read-write',
  ':required',
  ':valid',
  ':user-invalid',
  ':defined',
  ':is',
  ':where',
  ':has',
  ':dir',
] as const;

/**
 * CSS Pseudo-Classes (Levels 3 & 4).
 * Ref:
 *    https://www.w3.org/TR/selectors-3
 *    https://www.w3.org/TR/selectors-4
 */
export const CssPseudoClass: t.CssPseudoClassLib = {
  level3: new Set(level3),
  level4: new Set(level4),
  all: new Set([...level3, ...level4]),
  isClass(input: unknown): input is t.CssPseudoClass {
    return typeof input === 'string' && this.all.has(input as t.CssPseudoClass);
  },
};
