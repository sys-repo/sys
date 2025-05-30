import { type t, Fs, PATHS, Tmpl } from './common.ts';
import { Bundle } from './m.Bundle.ts';
import { createFileProcessor } from './u.process.file.ts';

/**
 * Create a new instance of the bundled file template.
 */
export const create: t.VitepressTmplLib['create'] = async (args) => {
  const templatesDir = Fs.resolve(PATHS.tmpl.tmp);

  /**
   * Ensure the templates are hydrated and ready to use.
   */
  const beforeWrite: t.TmplWriteHandler = async () => {
    await Fs.remove(templatesDir);
    await Bundle.toFilesystem(templatesDir);
  };

  /**
   * (🐷) Perform additional setup here (as needed).
   */
  const afterWrite: t.TmplWriteHandler = async (e) => {};

  /**
   * Template-engine instance.
   */
  const processFile = createFileProcessor(args);
  return Tmpl.create(templatesDir, { processFile, beforeWrite, afterWrite });
};
