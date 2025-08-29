import type * as t from './t.ts';

/**
 * Filter out common setup helpers within a mono-repo template.
 */
export const tmplFilter: t.TmplFilter = (e) => {
  if (e.file.name === '.tmpl.ts') return false; // NB: the initialization script for the template: is not content.
  return true;
};
