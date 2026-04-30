import { Fs, TmplEngine } from '../common.ts';

const SOURCE_PREFIX = 'cell.';

export async function bundleCellTmpl() {
  const root = Fs.resolve(import.meta.dirname ?? '.', '..');
  const res = await TmplEngine.bundle(root, {
    targetFile: Fs.join(root, '-bundle.json'),
    filter: (e) => e.path.startsWith(SOURCE_PREFIX),
  });
  console.info(TmplEngine.Log.bundled(res));
  return res;
}
