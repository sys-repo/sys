import { type t, Fs, PATHS, Tmpl, pkg } from './common.ts';
import { Bundle } from './m.Bundle.ts';
import { createFileProcessor } from './u.process.file.ts';

/**
 * Create a new instance of the bundled file template.
 */
export const create: t.ViteTmplLib['create'] = async (args = {}) => {
  const ctx = wrangle.ctx(args);
  const templatesDir = Fs.resolve(PATHS.tmpl.tmp);

  /**
   * Ensure the templates are hydrated and ready to use.
   */
  const beforeWrite: t.TmplWriteHandler = async () => {
    await Fs.remove(templatesDir);
    await Bundle.writeToFile(templatesDir);
  };

  /**
   * (🐷) Perform additional setup here (as needed).
   */
  const afterWrite: t.TmplWriteHandler = async (e) => {};

  /**
   * Template-engine instance.
   */
  const processFile = createFileProcessor(args);
  return Tmpl.create(templatesDir, { processFile, beforeWrite, afterWrite, ctx });
};

/**
 * Helpers
 */
const wrangle = {
  ctx(args: t.ViteTmplCreateArgs): t.ViteTmplCtx {
    const { version = pkg.version, tmpl = 'Default' } = args;
    return { version, tmpl };
  },
} as const;
