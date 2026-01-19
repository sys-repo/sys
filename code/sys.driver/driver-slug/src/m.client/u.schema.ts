import { type t } from './common.ts';

export function formatSchemaReason(errors: readonly t.WireSchemaValueError[]): string {
  return errors
    .map((error) => {
      const path = pathToString(error.path);
      return path ? `${path}: ${error.message}` : error.message;
    })
    .join('; ');
}

/**
 * Helpers
 */
const pathToString = (path: string | readonly string[]): string => {
  if (Array.isArray(path)) return path.join('/');
  if (typeof path === 'string') return path;
  return '';
};
