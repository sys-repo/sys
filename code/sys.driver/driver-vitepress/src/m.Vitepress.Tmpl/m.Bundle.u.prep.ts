import { c, FileMap, Fs, PATHS } from './common.ts';

/**
 * Bundle the template files into a `FileMap`.
 */
export async function prep() {
  const from = PATHS.tmpl.source;
  const to = PATHS.tmpl.json;
  await Fs.writeJson(PATHS.tmpl.json, await FileMap.bundle(from));
  console.info(c.gray(`Templates written into file-map: ${c.white(to)}`));
  return { from, to };
}
