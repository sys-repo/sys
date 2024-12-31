import { c, FileMap, Fs, PATHS } from './common.ts';
import bundle from './tmpl.bundle.json' with { type: 'json' };

/**
 * Write out a <FileMap> bundle to a target location.
 */
export async function saveTemplateFiles(target: string = PATHS.tmp) {
  await FileMap.write(target, bundle);
  console.info(c.gray(`Template files hydrated to: ${c.white(Fs.Path.trimCwd(target))}`));
}
