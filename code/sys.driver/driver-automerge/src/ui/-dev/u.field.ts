import { type t } from './common.ts';

/**
 * Construct a normalized, display-safe string label for a given object path.
 */
export const fieldFromPath: t.DevLib['fieldFromPath'] = (path, opts = {}) => {
  const { prefix = 'doc' } = opts;
  const segs = Array.isArray(path) ? path : undefined;
  const body = segs && segs.length > 0 ? `/${segs.join('/')}` : '(none)';
  return `${prefix}:${body}`.replace(/\./g, ':');
};

/**
 * Construct an array of `<ObjectView>`-safe expand paths.
 */
export const expandPaths: t.DevLib['expandPaths'] = (paths, opts = {}) => {
  const out = ['$'];
  if (!Array.isArray(paths)) return out;

  for (const path of paths) {
    if (Array.isArray(path) && path.length > 0) {
      const field = fieldFromPath(path, opts);
      out.push(`$.${field}`);
    }
  }

  return out;
};
