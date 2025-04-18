/**
 * CSS Selectors Level 3 pseudo‑classes.
 * https://www.w3.org/TR/selectors-3
 */
export const level3PseudoClasses = new Set<string>([
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
]);

/**
 * CSS Selectors Level 4 pseudo‑classes (and newer form/structural pseudo‑classes).
 * https://www.w3.org/TR/selectors-4
 */
export const level4PseudoClasses = new Set<string>([
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
]);

/**
 * CSS Pseudo-Classes (Levels 3 & 4).
 */
export const pseudoClasses = new Set<string>([...level3PseudoClasses, ...level4PseudoClasses]);
