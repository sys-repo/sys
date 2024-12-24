import { FileMap, Fs, c } from './common.ts';

/**
 * Bundle the template files into a `FileMap`.
 */
export async function bundleTemplateFiles() {
  const path = {
    source: 'src/-tmpl',
    target: 'src/m.Env/u.tmpl.json',
  };
  await Fs.writeJson(path.target, await FileMap.bundle(path.source));
  console.info(c.gray(`Template file-map written to: ${c.white(path.target)}`));
}
