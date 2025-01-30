import { type t, Fs, Jsr, PATHS, Tmpl } from './common.ts';
import { Bundle } from './m.Bundle.ts';
import { createFileProcessor } from './u.processFile.ts';

/**
 * Create a new instance of the bundled file template.
 */
export const create: t.VitepressTmplLib['create'] = async (args) => {
  const templatesDir = Fs.resolve(PATHS.tmpl.tmp);

  const beforeCopy: t.TmplCopyHandler = async () => {
    /**
     * Ensure the templates are hydrated and ready to use.
     */
    await Fs.remove(templatesDir);
    await Bundle.toFilesystem(templatesDir);
  };

  const afterCopy: t.TmplCopyHandler = async (e) => {

    const { manifest } = await Jsr.manifest('@sys/tmp', '0.0.56');
    if (manifest) {
      const path = e.dir.target.join(PATHS.sys.jsr);
      await manifest.pull(path);
    }
  };

  const processFile = createFileProcessor(args);
  return Tmpl.create(templatesDir, { processFile, beforeCopy, afterCopy });
};
