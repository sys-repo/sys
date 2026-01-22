import type { t } from '../common.ts';

export function formatErrors(errors: t.ValueError[]) {
  const joined = errors
    .map((error) => {
      const path = Array.isArray(error.path) ? error.path.join('/') : error.path;
      return path ? `${path}: ${error.message}` : error.message;
    })
    .join('; ');
  return new Error(joined || 'Schema validation failed');
}
