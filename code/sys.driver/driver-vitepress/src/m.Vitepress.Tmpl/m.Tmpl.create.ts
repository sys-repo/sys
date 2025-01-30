import { type t, Fs, PATHS, Tmpl } from './common.ts';
import { Bundle } from './m.Bundle.ts';
import { createFileProcessor } from './u.processFile.ts';

/**
 * Create a new instance of the bundled file template.
 */
export const create: t.VitepressTmplLib['create'] = async (args) => {
  const processFile = createFileProcessor(args);

  const templatesDir = Fs.resolve(PATHS.tmpl.tmp);
  await Fs.remove(templatesDir);
  await Bundle.toFilesystem(templatesDir);


  /**
   * TODO 🐷
   * - afterCreate (hook)
   * - save modules: ./sys/jsr/  (← save deps modules - to recreate local "workspace" in target module).
   */

  return Tmpl.create(templatesDir, { processFile, afterCopy });
};
