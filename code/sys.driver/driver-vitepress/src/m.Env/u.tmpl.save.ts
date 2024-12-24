import { type t, FileMap, Fs, c } from './common.ts';

export const PATHS = {
  source: 'src/-tmpl',
  json: 'src/m.Env/u.tmpl.json',
  tmp: '.tmp/-tmpl',
} as const;

/**
 * Bundle the template files into a `FileMap`.
 */
export async function bundleTemplateFiles() {
  await Fs.writeJson(PATHS.json, await FileMap.bundle(PATHS.source));
  console.info(c.gray(`Templates written to file-map at: ${c.white(PATHS.json)}`));
}

/**
 * Write out a <FileMap> bundle to a target location.
 */
export async function saveTemplateFiles(target: string = PATHS.tmp, bundle?: t.FileMap) {
  if (!bundle) {
    bundle = (await Fs.readJson<t.FileMap>(PATHS.json)).json;
    if (!bundle) throw new Error('Could not derive FileMap bundle');
  }
  await FileMap.write(target, bundle);
  console.info(c.gray(`Template file-map hydrated to: ${c.white(Fs.Path.trimCwd(target))}`));
}
