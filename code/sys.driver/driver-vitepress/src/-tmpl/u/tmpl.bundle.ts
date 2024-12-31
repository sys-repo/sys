import { c, FileMap, Fs, PATHS } from './common.ts';

/**
 * Bundle the template files into a `FileMap`.
 */
export async function bundleTemplateFiles() {
  await Fs.writeJson(PATHS.json, await FileMap.bundle(PATHS.source));
  console.info(c.gray(`Templates written to file-map at: ${c.white(PATHS.json)}`));
}
