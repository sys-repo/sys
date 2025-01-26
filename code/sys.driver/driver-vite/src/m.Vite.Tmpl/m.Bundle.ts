import bundle from './-bundle.json' with { type: 'json' };
import { c, FileMap, Fs, PATHS, type t } from './common.ts';


export const Bundle: t.ViteBundleLib = {
  /**
   * Read in the current source code of the templates and bundle it into a file-map
   */
  async toFilemap() {
    const from = PATHS.tmpl.source;
    const to = PATHS.tmpl.json;
    await Fs.writeJson(PATHS.tmpl.json, await FileMap.bundle(from));
    console.info(c.gray(`Templates written into file-map: ${c.white(to)}`));
    return { from, to };
  },

  /**
   * Write out the bundled <FileMap> to a target location.
   */
  async toFilesystem(dir: t.StringDir = PATHS.tmp) {
    await FileMap.write(dir, bundle);
    console.info(c.gray(`Template files hydrated to: ${c.white(Fs.Path.trimCwd(dir))}`));

    const ls = await Fs.ls(dir);

    console.info('  ↓');
    ls.forEach((path) => {
      const prefix = c.green('template:');
      const dirname = Fs.Path.trimCwd(Fs.dirname(path));
      const filename = c.white(Fs.basename(path));
      console.info(c.gray(`  ${prefix} ${dirname}/${filename}`));
    });

    console.info();
  },
};
