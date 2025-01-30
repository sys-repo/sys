import { type t, Fs, PATHS, Tmpl } from './common.ts';
import { Bundle } from './m.Bundle.ts';
import { createFileProcessor } from './u.processFile.ts';

/**
 * Create a new instance of the bundled file template.
 */
export const create: t.ViteTmplLib['create'] = async (args = {}) => {
  const templatesDir = Fs.resolve(PATHS.tmpl.tmp);

  const beforeCopy: t.TmplCopyHandler = async () => {
    /**
     * Ensure the templates are hydrated and ready to use.
     */
    await Fs.remove(templatesDir);
    await Bundle.toFilesystem(templatesDir);
  };

  const afterCopy: t.TmplCopyHandler = async (e) => {
    /**
     * (🐷) Perform additional setup here (as needed).
     */
  };

  const processFile = createFileProcessor(args);
  return Tmpl.create(templatesDir, { processFile, beforeCopy, afterCopy });
};

/**
 * Helpers
 */
const is = {
  withinHiddenDir(path: string): boolean {
    const dirs = path.split('/').slice(0, -1);
    return dirs.some((dir) => dir.startsWith('.'));
  },
  userspace(path: string): boolean {
    /**
     * NOTE: no "user-space" concept as of yet.
     */
    return false;
  },
} as const;
