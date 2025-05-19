import { pkg, z } from './common.ts';
export { toString } from './u.toString.ts';

export function getStylesheetId(instance?: string, defaultPrefix?: string) {
  instance = (instance || '').trim();
  let id = pkg.name;
  if (instance) id += `:${instance}`;
  if (defaultPrefix) id += `:${defaultPrefix}`;
  return id;
}

/**
 * Validation:
 */
export const AlphanumericWithHyphens = z.string().check(
  z.regex(/^[A-Za-z][A-Za-z0-9-]*$/, {
    error: `String must start with a letter and can contain letters, digits, and hyphens (hyphen not allowed at the beginning)`,
  }),
);
