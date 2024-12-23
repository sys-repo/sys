import { FileMap, Fs, c } from './common.ts';

export async function saveFileMap() {
  const path = {
    source: 'src/-tmpl',
    target: 'src/m.Env/u.tmpl.json',
  };
  await Fs.writeJson(path.target, await FileMap.bundle(path.source));
  console.info(c.gray(`Template file-map written to: ${c.white(path.target)}`));
}
