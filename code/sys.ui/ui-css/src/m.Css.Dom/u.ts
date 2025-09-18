import { pkg } from './common.ts';
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
export const AlphanumericWithHyphens = {
  safeParse(input: unknown) {
    if (typeof input === 'string' && /^[A-Za-z][A-Za-z0-9-]*$/.test(input)) {
      return { success: true, data: input };
    } else {
      const error = `String must start with a letter and can contain letters, digits, and hyphens (hyphen not allowed at the beginning)`;
      return { success: false, error };
    }
  },
};
