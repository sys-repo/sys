import { V } from './common.ts';
export { toString } from './u.toString.ts';

/**
 * Validation.
 */
export const AlphanumericWithHyphens = V.pipe(
  V.string(),
  V.regex(
    /^[A-Za-z][A-Za-z0-9-]*$/,
    'String must start with a letter and can contain letters, digits, and hyphens (hyphen not allowed at the beginning)',
  ),
);
