import bundle from './-bundle.json' with { type: 'json' };
import { type t, c, FileMap, Fs, PATHS } from './common.ts';


/**
 * Write out the bundled <FileMap> to a target location.
 */
export async function saveToFilesystem(dir: t.StringDir = PATHS.tmp) {
  await FileMap.write(dir, bundle);
  console.info(c.gray(`Template files hydrated to: ${c.white(Fs.Path.trimCwd(dir))}`));

  const ls = await Fs.ls(dir)
  console.info('  ↓')
  ls.forEach((path) => {
    const prefix = c.green('template:')
    const dirname = Fs.Path.trimCwd(Fs.dirname(path));
    const filename = c.white(Fs.basename(path));
    console.info(c.gray(`  ${prefix} ${dirname}/${filename}`))
  })
  console.info()
}
