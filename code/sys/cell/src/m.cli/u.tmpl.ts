import { GITIGNORE_ENTRIES, GITIGNORE_PATH } from '../m.tmpl/u/u.gitignore.ts';
import { listTmplOwnedPaths, listTmplPaths, tmplDescriptorPath } from '../m.tmpl/u/u.paths.ts';
import { readTmplText } from '../m.tmpl/u/u.text.ts';

const MinimalTemplate = 'default';

export const Tmpl = {
  /**
   * Import bundle readers directly so CLI help does not load template writers.
   */
  minimalDescriptor: () => readTmplText(MinimalTemplate, tmplDescriptorPath(MinimalTemplate)),
  minimalOwnedPaths: () => listTmplOwnedPaths(MinimalTemplate),
  minimalWritePaths: () => listTmplPaths(MinimalTemplate),
  gitignore: () => ({ path: GITIGNORE_PATH, entries: GITIGNORE_ENTRIES }),
} as const;
