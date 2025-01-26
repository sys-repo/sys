import { c, FileMap, Fs, PATHS } from './common.ts';

/**
 * Bundle the template files into a `FileMap`.
 */
export async function bundleTemplateFiles() {
  await Fs.writeJson(PATHS.tmpl.json, await FileMap.bundle(PATHS.tmpl.source));
  console.info(c.gray(`Templates written into file-map: ${c.white(PATHS.tmpl.json)}`));
}
